"""
Servicio Monolítico de Notificaciones (The Brain) - Versión Producción
Consolida: Reglas (Registry), Procesamiento (Processor), Envío (Sender) y CRUD.
"""
import logging
import json
import random
import time
import os
from datetime import datetime, timedelta, date
from enum import Enum
from typing import List, Optional, Dict, Any, Tuple
from contextlib import contextmanager
from functools import lru_cache
import threading

import pytz
from sqlalchemy.orm import Session, joinedload, sessionmaker
from sqlalchemy import desc, func, UniqueConstraint
from sqlalchemy.exc import IntegrityError
from sqlalchemy.dialects.postgresql import insert

from app.core.config import settings
from app.db.models.notification import NotificationRule, NotificationLog, PendingNotification, NotificationChannel
from app.db.models.cycle_user import CycleUser
from app.db.models.doctor import Doctor
from app.db.models.cycle_predictor import CycleLog, PregnancyLog, SymptomLog, CycleNotificationSettings
from app.db.models.push_subscription import PushSubscription
from app.schemas.notification import NotificationRuleUpdate, PushSubscriptionSchema
from app.cycle_predictor.logic import calculate_predictions
from app.tasks.email_tasks import _send_integrated_email, _send_web_push
from app.db.base import SessionLocal  # Asegúrate de tener esto

logger = logging.getLogger(__name__)

# ==============================================================================
# CONFIGURACIÓN
# ==============================================================================

# Configuración del sistema de notificaciones
MAX_NOTIFICATIONS_PER_CATEGORY_PER_DAY = 1  # Máx 1 notif por categoría por día
# Categorías válidas (deben coincidir con el campo 'category' de NOTIFICATION_REGISTRY)
NOTIFICATION_CATEGORIES = ("menstrual", "prenatal", "contraceptive", "system")
BATCH_SIZE_USERS = 100
BATCH_SIZE_DELIVERY = 50
MAX_RETRIES = 5
CIRCUIT_FAILURE_THRESHOLD = 5
CIRCUIT_RECOVERY_TIMEOUT = 60
# Tiempo máximo que una notificación puede estar en estado 'processing' antes de ser rescatada
STALE_PROCESSING_TIMEOUT_MINUTES = 15

# ==============================================================================
# UTILIDADES (Timezone, Logging, Circuit Breaker)
# ==============================================================================

def normalize_to_caracas(dt: Optional[datetime] = None) -> datetime:
    """Garantiza datetime aware en America/Caracas."""
    tz = pytz.timezone('America/Caracas')
    if dt is None:
        return datetime.now(tz)
    if dt.tzinfo is None:
        return tz.localize(dt)
    return dt.astimezone(tz)

def get_worker_id() -> str:
    """Identificador único del worker actual. Resistente a errores de scope en Celery fork workers."""
    try:
        import threading as _threading
        return f"{os.getpid()}_{_threading.current_thread().ident}"
    except Exception:
        return str(os.getpid())

def log_notification_event(
    event_type: str,
    user_id: int,
    rule_type: str,
    details: Optional[dict] = None,
    level: str = "info"
) -> None:
    """Logging estructurado en JSON con nivel configurable.
    Eventos definidos:
      - EVAL_TRIGGERED   : inicio de evaluación para un usuario
      - RULE_QUEUED      : regla evaluada como verdadera y encolada
      - RULE_SKIPPED     : regla saltada (con reason: daily_limit, already_sent, user_disabled, logic_false, debug_bypass)
      - sent             : notificación enviada exitosamente
      - retry            : enviando de nuevo tras fallo temporal
      - permanent_failure: alcanzó MAX_RETRIES sin éxito
    No propaga excepciones para no bloquear el flujo principal.
    """
    try:
        payload = {
            "event": event_type,
            "user_id": user_id,
            "rule_type": rule_type,
            "timestamp": datetime.utcnow().isoformat(),
            "worker_id": get_worker_id(),
        }
        if details:
            payload.update(details)

        msg = json.dumps(payload, default=str)
        log_fn = getattr(logger, level, logger.info)
        log_fn(msg)
    except Exception as _log_ex:
        logger.warning(f"log_notification_event failed silently: {_log_ex}")

class CircuitState(Enum):
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"

class CircuitBreaker:
    """
    Circuit breaker por proceso. NOTA: Si usas múltiples workers/procesos,
    cada uno tiene su propio estado. Para distribuido, implementar con Redis.
    """
    def __init__(self, failure_threshold=CIRCUIT_FAILURE_THRESHOLD, recovery_timeout=CIRCUIT_RECOVERY_TIMEOUT):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self._reset()

    def _reset(self):
        self.failure_count = 0
        self.last_failure_time = None
        self.state = CircuitState.CLOSED

    def can_execute(self) -> bool:
        if self.state == CircuitState.CLOSED:
            return True
        if self.state == CircuitState.OPEN:
            if self.last_failure_time and (datetime.now() - self.last_failure_time).seconds > self.recovery_timeout:
                self.state = CircuitState.HALF_OPEN
                logger.info("Circuit breaker entering HALF_OPEN state")
                return True
            return False
        return True  # HALF_OPEN

    def record_success(self):
        if self.state == CircuitState.HALF_OPEN:
            self._reset()
            logger.info("Circuit breaker CLOSED (recovered)")
        else:
            self.failure_count = max(0, self.failure_count - 1)

    def record_failure(self):
        self.failure_count += 1
        self.last_failure_time = datetime.now()
        if self.failure_count >= self.failure_threshold:
            if self.state != CircuitState.OPEN:
                logger.warning(f"Circuit breaker OPEN after {self.failure_count} failures")
            self.state = CircuitState.OPEN

# Circuit breaker global para push (singleton por proceso)
push_circuit = CircuitBreaker()

def calculate_next_retry_time(retry_count: int, base_delay_minutes: int = 5) -> datetime:
    """Backoff exponencial con jitter."""
    delay = base_delay_minutes * (2 ** retry_count) + random.randint(0, 5)
    return normalize_to_caracas() + timedelta(minutes=delay)

@contextmanager
def session_scope():
    """Context manager para sesiones de DB con manejo automático de rollback/commit."""
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()

# ==============================================================================
# 1. REGISTRY (REGLAS Y TEXTOS)
# ==============================================================================

def is_day(context, day):
    return context.get("cycle_day") == day

def is_week(context, week):
    return context.get("gestation_week") == week

def has_event(context, event):
    return context.get("event") == event

NOTIFICATION_REGISTRY = [
    # ===== CALCULADORA MENSTRUAL (28 + 1 rules) =====
    {
        "type": "day_1_period_start",
        "category": "menstrual",
        "priority": 100,
        "title": "Día 1 - Inicio Periodo",
        "message": "🩸 Hoy inicia tu periodo. Registra tu flujo y síntomas para un seguimiento preciso.",
        "logic": lambda c: is_day(c, 1)
    },
    { "type": "day_2_symptom_check", "category": "menstrual", "priority": 101, "title": "Día 2 - Chequeo de Dolor", "message": "¿Cómo te sientes hoy? Registra dolor, flujo y otros síntomas.", "logic": lambda c: is_day(c, 2) },
    { "type": "day_3_hydration", "category": "menstrual", "priority": 102, "title": "Día 3 - Hidratación", "message": "💧 Recuerda beber mucha agua para ayudar con los cólicos.", "logic": lambda c: is_day(c, 3) },
    { "type": "day_4_mood_track", "category": "menstrual", "priority": 103, "title": "Día 4 - Estado de Ánimo", "message": "¿Cómo está tu ánimo hoy? Registra tus emociones.", "logic": lambda c: is_day(c, 4) },
    { "type": "day_5_flow_decrease", "category": "menstrual", "priority": 104, "title": "Día 5 - Fin de Chequeo", "message": "Tu flujo debería estar disminuyendo. ¿Cómo va tu periodo?", "logic": lambda c: is_day(c, 5) },
    { "type": "day_6_energy_boost", "category": "menstrual", "priority": 105, "title": "Día 6 - Energía en Aumento", "message": "✨ Tu energía debería aumentar. Buen momento para ejercitarte.", "logic": lambda c: is_day(c, 6) },
    { "type": "day_7_period_end", "category": "menstrual", "priority": 106, "title": "Día 7 - Fin de Periodo", "message": "Tu periodo debería estar terminando. ¡Inicia una nueva fase!", "logic": lambda c: is_day(c, 7) },
    { "type": "day_8_skin_care", "category": "menstrual", "priority": 107, "title": "Día 8 - Piel Radiante", "message": "🌸 Tu piel está en su mejor momento. Cuídala bien.", "logic": lambda c: is_day(c, 8) },
    { "type": "day_9_fertile_approaching", "category": "menstrual", "priority": 108, "title": "Día 9 - Ventana Fértil Cerca", "message": "❤️ Se aproxima tu ventana fértil. Estate atenta.", "logic": lambda c: is_day(c, 9) },
    { "type": "day_10_fertile_start", "category": "menstrual", "priority": 109, "title": "Día 10 - Ventana Fértil", "message": "❤️‍🔥 Inicia tu ventana fértil. Alta probabilidad de concepción.", "logic": lambda c: is_day(c, 10) },
    { "type": "day_11_high_fertility", "category": "menstrual", "priority": 110, "title": "Día 11 - Fertilidad Alta", "message": "🔥 Fertilidad muy alta. Momento ideal para concebir.", "logic": lambda c: is_day(c, 11) },
    { "type": "day_12_peak_fertility", "category": "menstrual", "priority": 111, "title": "Día 12 - Pico de Fertilidad", "message": "🔥🔥 Pico máximo de fertilidad. Mayor probabilidad de embarazo.", "logic": lambda c: is_day(c, 12) },
    { "type": "day_13_ovulation", "category": "menstrual", "priority": 112, "title": "Día 13 - Posible Ovulación", "message": "🥚 Probable día de ovulación. Registra síntomas.", "logic": lambda c: is_day(c, 13) },
    { "type": "day_14_ovulation_peak", "category": "menstrual", "priority": 113, "title": "Día 14 - Ovulación", "message": "🥚 Día típico de ovulación (ciclo 28 días).", "logic": lambda c: is_day(c, 14) },
    { "type": "day_15_fertile_end", "category": "menstrual", "priority": 114, "title": "Día 15 - Fin Ventana Fértil", "message": "✅ Termina tu ventana fértil.", "logic": lambda c: is_day(c, 15) },
    { "type": "day_16_implantation_window", "category": "menstrual", "priority": 115, "title": "Día 16 - Posible Implantación", "message": "Si hubo concepción, puede iniciar la implantación.", "logic": lambda c: is_day(c, 16) },
    { "type": "day_17_mood_watch", "category": "menstrual", "priority": 116, "title": "Día 17 - Observa tu Humos", "message": "Entras en fase lútea. Observa cambios en tu humor.", "logic": lambda c: is_day(c, 17) },
    { "type": "day_18_exercise_tip", "category": "menstrual", "priority": 117, "title": "Día 18 - Ejercicio Suave", "message": "Buen momento para yoga o caminatas tranquilas.", "logic": lambda c: is_day(c, 18) },
    { "type": "day_19_metabolism_alert", "category": "menstrual", "priority": 118, "title": "Día 19 - Metabolismo", "message": "Tu metabolismo aumenta. Puedes sentir más hambre.", "logic": lambda c: is_day(c, 19) },
    { "type": "day_20_rest_importance", "category": "menstrual", "priority": 119, "title": "Día 20 - Descanso", "message": "Prioriza el sueño. Tu cuerpo se prepara para el fin del ciclo.", "logic": lambda c: is_day(c, 20) },
    { "type": "day_21_cycle_summary", "category": "menstrual", "priority": 120, "title": "Día 21 - Resumen de Ciclo", "message": "Has tenido un ciclo regular. Revisa tus registros mensuales.", "logic": lambda c: is_day(c, 21) },
    { "type": "day_22_pms_start", "category": "menstrual", "priority": 121, "title": "Día 22 - Posible SPM", "message": "💙 Pueden iniciar síntomas premenstruales. Cuídate.", "logic": lambda c: is_day(c, 22) },
    { "type": "day_23_bloating_check", "category": "menstrual", "priority": 122, "title": "Día 23 - Hinchazón", "message": "¿Te sientes hinchada? Es normal en esta fase.", "logic": lambda c: is_day(c, 23) },
    { "type": "day_24_mood_changes", "category": "menstrual", "priority": 123, "title": "Día 24 - Cambios de Ánimo", "message": "Registra tu estado de ánimo y síntomas emocionales.", "logic": lambda c: is_day(c, 24) },
    { "type": "day_25_breast_tenderness", "category": "menstrual", "priority": 124, "title": "Día 25 - Sensibilidad Mamaria", "message": "¿Sensibilidad o dolor en los senos? Registra tus síntomas.", "logic": lambda c: is_day(c, 25) },
    { "type": "day_26_period_preparation", "category": "menstrual", "priority": 125, "title": "Día 26 - Preparación", "message": "Tu periodo debería llegar en 2-3 días. Prepárate.", "logic": lambda c: is_day(c, 26) },
    { "type": "day_27_cramps_alert", "category": "menstrual", "priority": 126, "title": "Día 27 - Posibles Cólicos", "message": "Pueden iniciar cólicos premenstruales.", "logic": lambda c: is_day(c, 27) },
    { "type": "day_28_period_tomorrow", "category": "menstrual", "priority": 127, "title": "Día 28 - Periodo Mañana", "message": "📅 Tu periodo debería llegar mañana. ¿Ya llegó?", "logic": lambda c: is_day(c, 28) },
    { "type": "period_late_1_day", "category": "menstrual", "priority": 128, "title": "1 Día de Retraso", "message": "📅 Tu periodo tiene 1 día de retraso. ¿Ya llegó?", "logic": lambda c: c.get("event") == "period_late" and c.get("days") == 1 },

    # ===== PRENATAL (41 SEMANAS) =====
    *[
        {
            "type": f"prenatal_week_{i}",
            "category": "prenatal",
            "priority": 200 + i,
            "title": f"Semana {i} de Embarazo",
            "message": f"🤰 ¡Semana {i}! Revisa tu app para ver el desarrollo de tu bebé.",
            "logic": lambda c, i=i: is_week(c, i)
        } for i in range(1, 42)
    ],

    # ===== PRENATAL MILESTONES & ALERTS =====
    { "type": "prenatal_first_ultrasound", "category": "prenatal", "priority": 250, "title": "📸 Primera Ecografía", "message": "Agenda tu primera ecografía (entre semanas 6-8).", "logic": lambda c: has_event(c, "first_ultrasound") },
    { "type": "prenatal_genetic_test", "category": "prenatal", "priority": 251, "title": "🧬 Test Genético", "message": "Considera realizar pruebas genéticas (NIPT) entre semanas 10-13.", "logic": lambda c: has_event(c, "genetic_test") },
    { "type": "prenatal_anatomy_scan", "category": "prenatal", "priority": 252, "title": "📸 Ecografía Anatómica", "message": "Ecografía anatómica completa (semana 18-22).", "logic": lambda c: has_event(c, "anatomy_scan") },
    { "type": "prenatal_glucose_test", "category": "prenatal", "priority": 253, "title": "🍬 Test de Glucosa", "message": "Test de tolerancia a la glucosa (semana 24-28).", "logic": lambda c: has_event(c, "glucose_test") },
    { "type": "prenatal_tdap_vaccine", "category": "prenatal", "priority": 254, "title": "💉 Vacuna Tdap", "message": "Vacuna contra tosferina (Tdap) - semana 27-36.", "logic": lambda c: has_event(c, "tdap_vaccine") },
    { "type": "prenatal_group_b_strep", "category": "prenatal", "priority": 255, "title": "🦠 Test Estreptococo B", "message": "Test de Estreptococo Grupo B (semana 35-37).", "logic": lambda c: has_event(c, "group_b_strep") },
    { "type": "prenatal_kick_counts", "category": "prenatal", "priority": 256, "title": "👶 Conteo de Patadas", "message": "Inicia el conteo diario de movimientos fetales (semana 28+).", "logic": lambda c: has_event(c, "kick_counts") },
    { "type": "prenatal_reduced_movement", "category": "prenatal", "priority": 5, "title": "⚠️ Movimientos Reducidos", "message": "Si notas movimientos fetales reducidos, contacta a tu médico inmediatamente.", "logic": lambda c: has_event(c, "reduced_movement") },
    { "type": "prenatal_bleeding", "category": "prenatal", "priority": 1, "title": "🚨 Sangrado", "message": "Sangrado durante el embarazo requiere atención médica inmediata.", "logic": lambda c: has_event(c, "bleeding_alert") },
    { "type": "prenatal_severe_headache", "category": "prenatal", "priority": 2, "title": "🤕 Dolor de Cabeza Severo", "message": "Dolor de cabeza severo puede ser signo de preeclampsia.", "logic": lambda c: has_event(c, "severe_headache") },

    # ===== SYSTEM =====
    { "type": "system_welcome", "category": "system", "priority": 300, "title": "👋 Bienvenida a la App", "message": "¡Bienvenida! Completa tu perfil para comenzar.", "logic": lambda c: has_event(c, "user_registered") },
    { "type": "system_profile_incomplete", "category": "system", "priority": 301, "title": "📝 Completa tu Perfil", "message": "Completa tu perfil para obtener predicciones más precisas.", "logic": lambda c: has_event(c, "profile_incomplete") },
    { "type": "system_log_period", "category": "system", "priority": 302, "title": "🩸 Registra tu Periodo", "message": "¿Ya te llegó el periodo? Regístralo.", "logic": lambda c: has_event(c, "period_not_logged") },
    { "type": "system_appointment_reminder", "category": "system", "priority": 306, "title": "📅 Cita Médica Mañana", "message": "Recuerda: Tienes cita médica mañana a las {appointment_time}.", "logic": lambda c: has_event(c, "appointment_tomorrow") },
    { "type": "system_medication_reminder", "category": "system", "priority": 307, "title": "💊 Hora de Medicamento", "message": "Hora de tomar tu medicamento: {medication_name}.", "logic": lambda c: has_event(c, "medication_time") },
    { "type": "system_annual_checkup", "category": "system", "priority": 308, "title": "🩺 Chequeo Anual", "message": "Ha pasado un año desde tu último chequeo ginecológico.", "logic": lambda c: has_event(c, "annual_checkup") },

    # ===== CONTRACEPTIVE =====
    { "type": "contraceptive_daily", "category": "contraceptive", "priority": 10, "title": "💊 Recordatorio Anticonceptivo", "message": "Hola {patient_name}, es hora de tomar tu pastilla anticonceptiva.", "logic": lambda c: c.get("type") == "contraceptive" and c.get("subtype") == "active_pill" },
    { "type": "contraceptive_rest_start", "category": "contraceptive", "priority": 11, "title": "💊 Inicio de Descanso", "message": "Hoy comienzas tus días de descanso o placebo.", "logic": lambda c: c.get("type") == "contraceptive" and c.get("subtype") == "placebo" }
]

NOTIFICATION_MAP = { n["type"]: n for n in NOTIFICATION_REGISTRY }


# ==============================================================================
# 2. CRUD OPERATIONS
# ==============================================================================

def get_global_rules(db: Session) -> List[NotificationRule]:
    """Get all system-wide notification rules."""
    return db.query(NotificationRule).filter(NotificationRule.tenant_id == None).order_by(NotificationRule.priority).all()

def get_rule_by_type(db: Session, tenant_id: Optional[int], notification_type: str) -> Optional[NotificationRule]:
    return db.query(NotificationRule).filter(
        NotificationRule.tenant_id == tenant_id,
        NotificationRule.notification_type == notification_type
    ).first()

def update_rule(db: Session, db_obj: NotificationRule, rule_in: NotificationRuleUpdate) -> NotificationRule:
    update_data = rule_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_obj, field, value)

    db_obj.is_edited = True
    db.commit()
    db.refresh(db_obj)

    # Invalidar cache de reglas para que todos los workers carguen la versión actualizada
    # en su próxima ejecución (TTL: hasta 1h, pero se limpia inmediatamente en este proceso)
    get_cached_global_rules.cache_clear()
    logger.info(f"Rule cache cleared after editing rule {db_obj.notification_type}")

    return db_obj

def create_or_update_subscription(db: Session, sub_in: PushSubscriptionSchema, user_id: int) -> PushSubscription:
    """UPSERT atómico para suscripciones push (PostgreSQL)."""
    stmt = insert(PushSubscription).values(
        user_id=user_id,
        endpoint=sub_in.endpoint,
        p256dh=sub_in.keys.p256dh,
        auth=sub_in.keys.auth,
        updated_at=normalize_to_caracas()
    ).on_conflict_do_update(
        index_elements=['endpoint'],
        set_=dict(
            user_id=user_id, 
            p256dh=sub_in.keys.p256dh, 
            auth=sub_in.keys.auth,
            updated_at=normalize_to_caracas()
        )
    )
    db.execute(stmt)
    db.commit()
    return db.query(PushSubscription).filter_by(endpoint=sub_in.endpoint).first()

def delete_subscription_by_endpoint(db: Session, endpoint: str) -> bool:
    result = db.query(PushSubscription).filter(PushSubscription.endpoint == endpoint).delete()
    db.commit()
    return result > 0


# ==============================================================================
# 3. CONTEXT & PROCESSING LOGIC (THE BRAIN)
# ==============================================================================

def safe_render_content(rule: "Union[NotificationRule, _RuleData]", context: dict) -> Optional[dict]:
    """Renderiza contenido de forma segura con fallback.
    Compatible con objetos ORM (NotificationRule) y datos primitivos (_RuleData).
    """
    ntype = rule.notification_type
    try:
        # Si es un ORM con el método render_content, lo usamos directamente
        if hasattr(rule, "render_content"):
            return rule.render_content(context)

        # Para _RuleData extraemos plantillas y renderizamos manualmente
        title_tpl = getattr(rule, "title_template", "") or ""
        text_tpl = getattr(rule, "message_text_template", "") or ""

        def _fmt(tpl: str) -> str:
            try:
                return tpl.format_map(context)
            except (KeyError, AttributeError):
                return tpl

        rendered_title = _fmt(title_tpl)
        rendered_text = _fmt(text_tpl)
        rendered_html = f"<p>{rendered_text}</p>" if rendered_text and not rendered_text.startswith("<") else rendered_text

        return {
            "title": rendered_title,
            "message_html": rendered_html,
            "message_text": rendered_text,
        }

    except Exception as e:
        logger.error(f"Error inesperado renderizando {ntype}: {e}", exc_info=True)
        # Fallback al registro estático en memoria
        registry_rule = NOTIFICATION_MAP.get(ntype)
        if registry_rule:
            return {
                "title": registry_rule["title"],
                "message_html": f"<p>{registry_rule['message']}</p>",
                "message_text": registry_rule["message"],
            }
        return None

def validate_smart_context(ctx: dict) -> Tuple[bool, Optional[str]]:
    """Valida que el contexto tenga los campos mínimos necesarios."""
    if not ctx.get("today"):
        return False, "Missing today"
    if ctx.get("is_pregnant"):
        if not ctx.get("gestation_week") and not ctx.get("gestation_days"):
            return False, "Pregnant but no gestation info"
    return True, None

def calculate_smart_context(user: CycleUser, predictions: Optional[dict], pregnancy: Optional[PregnancyLog], db_session: Session) -> dict:
    """Construye un objeto de contexto completo describiendo el estado actual de la usuaria."""
    today = normalize_to_caracas().date()
    ctx = {"today": today, "is_pregnant": False}

    # 1. Síntomas universales (siempre se calculan)
    try:
        symptom_log = db_session.query(SymptomLog).filter(
            SymptomLog.cycle_user_id == user.id,
            SymptomLog.date == today
        ).first()
        if symptom_log and symptom_log.symptoms:
            if isinstance(symptom_log.symptoms, list):
                ctx["reported_symptoms"] = symptom_log.symptoms
            elif isinstance(symptom_log.symptoms, str):
                ctx["reported_symptoms"] = [symptom_log.symptoms]
    except Exception as e:
        logger.warning(f"Error cargando síntomas para user {user.id}: {e}")

    # 2. Contexto de embarazo (si aplica)
    if pregnancy and pregnancy.is_active:
        ctx["is_pregnant"] = True
        try:
            gestation_days = (today - pregnancy.last_period_date).days
            ctx["gestation_days"] = max(0, gestation_days)
            ctx["gestation_week"] = ctx["gestation_days"] // 7
            ctx["gestation_day_of_week"] = (ctx["gestation_days"] % 7) + 1
            if ctx["gestation_week"] < 14:
                ctx["trimester"] = 1
            elif ctx["gestation_week"] < 28:
                ctx["trimester"] = 2
            else:
                ctx["trimester"] = 3
        except Exception as e:
            logger.error(f"Error calculando gestación para user {user.id}: {e}")
        return ctx

    # 3. Contexto de ciclo menstrual (solo si no embarazo)
    if predictions and isinstance(predictions, dict):
        ctx["cycle_day"] = predictions.get("cycle_day", 0)
        ctx["is_ovulation_day"] = (today == predictions.get("ovulation_date"))
        ctx["is_fertile_start"] = (today == predictions.get("fertile_window_start"))
        ctx["is_fertile_end"] = (today == predictions.get("fertile_window_end"))
        
        if predictions.get("ovulation_date"):
            ctx["days_after_ovulation"] = (today - predictions["ovulation_date"]).days
            
        if predictions.get("next_period_start"):
            ctx["days_before_period"] = (predictions["next_period_start"] - today).days
            days_late = (today - predictions["next_period_start"]).days
            if days_late > 0:
                ctx["period_confirmation_needed"] = True
                ctx["days_late"] = days_late
                
        ctx["phase"] = predictions.get("phase")

    # 4. Contexto anticonceptivo
    cycle_day = ctx.get("cycle_day", 0)
    if cycle_day > 0:
        ctx["type"] = "contraceptive"
        ctx["pill_number"] = cycle_day
        if cycle_day <= 21:
            ctx["subtype"] = "active_pill"
            ctx["pill_subtype"] = "active_pill"
        elif cycle_day <= 28:
            ctx["subtype"] = "placebo"
            ctx["pill_subtype"] = "placebo"
        if cycle_day == 1:
            ctx["pill_event"] = "new_pack"

    # 5. Chequeo anual
    if user.created_at:
        try:
            user_created_date = user.created_at.date()
            if user_created_date.month == today.month and user_created_date.day == today.day:
                ctx["is_annual_checkup"] = True
        except Exception:
            pass

    return ctx

def evaluate_registry_rule(rule_def: dict, context: dict, user_settings: CycleNotificationSettings) -> bool:
    """Evalúa si una regla del registro debe dispararse, aplicando preferencias del usuario."""
    if not user_settings:
        return False
    
    # Si está embarazada, solo reglas prenatales o del sistema
    if context.get("is_pregnant") and rule_def["category"] not in ("prenatal", "system"):
        return False
    
    # 1. Evaluar lógica de la regla
    try:
        if not rule_def["logic"](context):
            return False
    except Exception as e:
        logger.error(f"Error ejecutando lógica de regla {rule_def['type']}: {e}")
        return False
        
    # 2. Verificar preferencias
    category = rule_def["category"]
    if category == "prenatal" and not getattr(user_settings, 'prenatal_milestones', True):
        return False
    if category == "contraceptive" and not getattr(user_settings, 'contraceptive_enabled', False):
        return False
            
    return True

# ==============================================================================
# 4. DELIVERY LOGIC (SENDER)
# ==============================================================================

def send_dual_notification_logic(db: Session, item: PendingNotification) -> Tuple[bool, Optional[str], Optional[str]]:
    """Lógica de envío dual REAL: Envía por ambos canales (Push + Email) si el canal es 'dual'."""
    user = db.query(CycleUser).filter(CycleUser.id == item.recipient_id).first()
    if not user:
        return False, None, "User not found"
    
    channel_pref = item.channel or "dual"
    push_success = False
    email_success = False
    errors = []
    channels_sent = []
    
    # 1. INTENTAR PUSH (Si es dual o push)
    if channel_pref in ("dual", "push"):
        if push_circuit.can_execute():
            try:
                push_body = item.message_text or item.subject
                _send_web_push(user.id, item.subject, push_body, "/cycle/dashboard", db)
                push_success = True
                push_circuit.record_success()
                channels_sent.append("push")
            except Exception as e:
                push_circuit.record_failure()
                errors.append(f"Push error: {str(e)}")
                log_notification_event("push_failure", user.id, item.rule.notification_type if item.rule else "unknown", {"error": str(e)})
        else:
            logger.warning(f"Circuit breaker OPEN, skipping push for user {user.id}")
            errors.append("Push circuit breaker OPEN")
    
    # 2. INTENTAR EMAIL (Si es dual o email)
    # NOTA: Ya no es un failover. Si es dual, enviamos ambos para asegurar alcance.
    if channel_pref in ("dual", "email"):
        if user.email:
            try:
                _send_integrated_email(user.email, item.subject, item.body)
                email_success = True
                channels_sent.append("email")
            except Exception as e:
                errors.append(f"Email error: {str(e)}")
        else:
            errors.append("No email address found")
    
    # Resultado final: Éxito si al menos uno funcionó (o ambos)
    success = push_success or email_success
    final_channel = "+".join(channels_sent) if channels_sent else None
    final_error = "; ".join(errors) if errors else None
    
    return success, final_channel, final_error

# ==============================================================================
# 5. TAREAS PROGRAMADAS (PROCESSOR)
# ==============================================================================

class _RuleData:
    """
    Contenedor simple de datos primitivos de una NotificationRule.
    No depende de sesión SQLAlchemy, eliminando DetachedInstanceError.
    """
    __slots__ = (
        "id", "notification_type", "send_time", "channel",
        "title_template", "message_text_template", "is_active", "priority",
    )

    def __init__(self, rule: "NotificationRule") -> None:
        self.id: int = rule.id
        self.notification_type: str = rule.notification_type
        self.send_time: Optional[str] = rule.send_time
        self.channel: str = rule.channel
        self.title_template: Optional[str] = rule.title_template
        self.message_text_template: Optional[str] = rule.message_text_template
        self.is_active: bool = rule.is_active
        self.priority: int = rule.priority if rule.priority is not None else 99


@lru_cache(maxsize=1)
def get_cached_global_rules(ttl_hash: int = 0) -> Dict[str, "_RuleData"]:
    """
    Cache de reglas globales con TTL de 1 hora.
    Almacena datos primitivos en lugar de objetos ORM para evitar DetachedInstanceError.
    """
    with session_scope() as db:
        rules_list = db.query(NotificationRule).filter(
            NotificationRule.tenant_id == None,
            NotificationRule.is_active == True
        ).all()

        # Convertir a datos primitivos ANTES de cerrar la sesión
        rules = {r.notification_type: _RuleData(r) for r in rules_list}
        logger.info(f"Loaded {len(rules)} global rules into cache (primitive data)")
        return rules

# Flag de modo debug — cargado al inicio del módulo, no en cada llamada
_DEBUG_MODE: bool = False
try:
    from app.core.config import settings as _settings
    _DEBUG_MODE = bool(getattr(_settings, "NOTIFICATIONS_DEBUG_MODE", False))
    if _DEBUG_MODE:
        logger.warning("[NOTIFICATIONS_DEBUG_MODE=True] Duplicate guard BYPASSED — not for production!")
except Exception:
    pass

def _process_single_user(user_id: int, global_rules: Dict[str, "_RuleData"], now: datetime, today_date: date):
    """
    Procesa un único usuario en una sesión independiente.
    Aislamiento completo: fallos de un usuario no afectan a otros.
    """
    with session_scope() as db:
        user = db.query(CycleUser).filter(CycleUser.id == user_id, CycleUser.is_active == True).first()
        if not user:
            return
        
        # Obtener settings
        user_settings = db.query(CycleNotificationSettings).filter(
            CycleNotificationSettings.cycle_user_id == user.id
        ).first()
        if not user_settings:
            return
        
        # Obtener embarazo activo
        pregnancy = db.query(PregnancyLog).filter(
            PregnancyLog.cycle_user_id == user.id, 
            PregnancyLog.is_active == True
        ).first()
        
        # Calcular predicciones solo si no está embarazada
        predictions = None
        if not pregnancy:
            try:
                last_cycle = db.query(CycleLog).filter(
                    CycleLog.cycle_user_id == user.id
                ).order_by(CycleLog.start_date.desc()).first()
                
                if last_cycle and user.cycle_avg_length:
                    predictions = calculate_predictions(
                        last_cycle.start_date, 
                        user.cycle_avg_length, 
                        user.period_avg_length
                    )
                    if not isinstance(predictions, dict):
                        logger.warning(f"Invalid predictions for user {user.id}")
                        predictions = None
            except Exception as e:
                logger.error(f"Error calculating predictions for user {user.id}: {e}")
        
        # Calcular contexto
        smart_ctx = calculate_smart_context(user, predictions, pregnancy, db)
        
        # Validar contexto
        is_valid, error = validate_smart_context(smart_ctx)
        if not is_valid:
            logger.error(f"Invalid context for user {user.id}: {error}")
            return
        
        # Control de frecuencia POR CATEGORÍA:
        # Construir un mapa de qué categorías ya tienen notificaciones hoy
        # (enviadas o en cola), independientemente del rule_id específico.
        # Esto permite múltiples categorías en el mismo día (prenatal + contraceptive)
        # pero evita duplicar dentro de la misma categoría.

        # Mapa rule_id -> notification_type  (para cruzar con el NOTIFICATION_MAP)
        rule_id_to_type: Dict[int, str] = {
            v.id: k for k, v in global_rules.items()
        }

        sent_rule_ids = set(
            log.notification_rule_id for log in db.query(NotificationLog).filter(
                NotificationLog.recipient_id == user.id,
                func.date(NotificationLog.sent_at) == today_date
            )
        )
        pending_rule_ids = set(
            pend.notification_rule_id for pend in db.query(PendingNotification).filter(
                PendingNotification.recipient_id == user.id,
                PendingNotification.status.in_(["pending", "retrying", "processing"]),
                func.date(PendingNotification.scheduled_for) == today_date
            )
        )
        active_rule_ids = sent_rule_ids | pending_rule_ids

        # Categorías ya cubiertas hoy
        categories_sent_today: set = set()
        for rid in active_rule_ids:
            ntype = rule_id_to_type.get(rid)
            if ntype:
                reg_entry = NOTIFICATION_MAP.get(ntype)
                if reg_entry:
                    categories_sent_today.add(reg_entry["category"])

        # Log inicio de evaluación
        log_notification_event("EVAL_TRIGGERED", user.id, "*", {
            "ctx_type": smart_ctx.get("type"),
            "active_rule_ids": len(active_rule_ids),
            "categories_sent_today": list(categories_sent_today),
            "debug_mode": _DEBUG_MODE,
        })

        # Evaluar reglas (sin límite global, el límite es por categoría)
        notifications_created = 0
        
        for rule_def in NOTIFICATION_REGISTRY:
            rtype = rule_def["type"]
            category = rule_def.get("category", "system")
            
            # Evaluar lógica de la regla
            try:
                rule_passed = evaluate_registry_rule(rule_def, smart_ctx, user_settings)
                if not rule_passed:
                    log_notification_event("RULE_SKIPPED", user.id, rtype, {"reason": "logic_false"})
                    continue
            except Exception as e:
                logger.error(f"Error evaluating rule {rtype} for user {user.id}: {e}")
                continue

            template_rule = global_rules.get(rtype)
            if not template_rule:
                logger.warning(f"No global template found for {rtype}")
                continue

            rule_id = template_rule.id

            # Control de frecuencia por rule_id (evita duplicados exactos)
            if rule_id in active_rule_ids:
                if _DEBUG_MODE:
                    log_notification_event("RULE_SKIPPED", user.id, rtype, {
                        "reason": "already_queued_but_debug_bypass",
                        "rule_id": rule_id,
                    })
                else:
                    log_notification_event("RULE_SKIPPED", user.id, rtype, {
                        "reason": "already_queued",
                        "rule_id": rule_id,
                    })
                    continue

            # Control de frecuencia por CATEGORÍA (1 por categoría por día)
            if category in categories_sent_today and not _DEBUG_MODE:
                log_notification_event("RULE_SKIPPED", user.id, rtype, {
                    "reason": "category_limit",
                    "category": category,
                    "limit": MAX_NOTIFICATIONS_PER_CATEGORY_PER_DAY,
                })
                continue
            
            # Renderizar contenido
            render_vars = {"patient_name": user.nombre_completo or "Usuario"}
            render_vars.update(smart_ctx)
            rendered = safe_render_content(template_rule, render_vars)
            if not rendered:
                continue
            
            # Calcular hora de envío (respetar preferencia de usuario para anticonceptivos)
            try:
                send_time = template_rule.send_time
                if rule_def["category"] == "contraceptive" and user_settings.contraceptive_time:
                    send_time = user_settings.contraceptive_time
                
                hour, minute = map(int, send_time.split(':'))
                target_time = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
            except (ValueError, AttributeError):
                target_time = now.replace(hour=8, minute=0, second=0, microsecond=0)
            
            if target_time < now:
                target_time = now + timedelta(minutes=5)
            
            # Crear notificación pendiente
            pending = PendingNotification(
                notification_rule_id=rule_id,
                recipient_id=user.id,
                subject=rendered["title"],
                body=rendered["message_html"],
                message_text=rendered["message_text"],
                scheduled_for=target_time,
                channel=template_rule.channel,
                status="pending"
            )
            db.add(pending)

            # Flush para capturar IntegrityError antes del commit final
            try:
                db.flush()
                sent_today.add(rule_id)  # Actualizar cache local — mantenemos por compatibilidad
                active_rule_ids.add(rule_id)
                categories_sent_today.add(category)
                notifications_created += 1
                log_notification_event("RULE_QUEUED", user.id, rtype, {
                    "rule_id": rule_id,
                    "channel": template_rule.channel,
                    "scheduled_for": target_time.isoformat(),
                    "debug_mode": _DEBUG_MODE,
                })
                log_notification_event("scheduled", user.id, rtype, {"scheduled_for": target_time.isoformat()})
            except IntegrityError as ie:
                db.rollback()
                if "uix_pending_user_rule_date" in str(ie) or "unique" in str(ie).lower():
                    logger.debug(f"Duplicate prevented for user {user.id}, rule {rtype}")
                else:
                    logger.error(f"IntegrityError for user {user.id}, rule {rtype}: {ie}")
                continue
            except Exception as e:
                logger.error(f"Error creating notification for user {user.id}, rule {rtype}: {e}")
                continue
        
        logger.info(f"Created {notifications_created} notifications for user {user.id}")

def trigger_immediate_evaluation(db: Session, user_id: int):
    """
    Disparador para re-evaluación inmediata de notificaciones de un usuario.
    Se usa ante eventos como: registro, cambios de ajustes, logs de ciclo, etc.
    Limita la re-evaluación a la sesión actual para mayor reactividad.
    """
    try:
        now = normalize_to_caracas()
        today_date = now.date()
        
        # 1. Limpieza: Eliminar notificaciones PENDIENTES de hoy que puedan ser obsoletas
        # No eliminamos las que ya se están procesando o enviando.
        db.query(PendingNotification).filter(
            PendingNotification.recipient_id == user_id,
            PendingNotification.status.in_(["pending", "retrying"]),
            func.date(PendingNotification.scheduled_for) == today_date
        ).delete(synchronize_session=False)
        db.commit()
        
        # 2. Re-evaluar: Usar la lógica central para regenerar
        ttl_hash = int(time.time()) // 3600
        global_rules = get_cached_global_rules(ttl_hash)
        
        if global_rules:
            _process_single_user(user_id, global_rules, now, today_date)
            logger.info(f"Immediate evaluation triggered and completed for user {user_id}")
            
            # 3. Forzar envío inmediato si hay algo programado para "ahora" o ya pasó
            # Esto ayuda a que el usuario vea el resultado de su acción instantáneamente
            deliver_pending_notifications()
            
    except Exception as e:
        logger.error(f"Error triggering immediate evaluation for user {user_id}: {e}", exc_info=True)
        db.rollback()

def run_daily_evaluation():
    """
    Tarea diaria: Evalúa reglas globales para todos los usuarios.
    Cada usuario se procesa en su propia sesión para aislamiento completo.
    """
    try:
        now = normalize_to_caracas()
        today_date = now.date()
        
        # Cache de reglas globales (refresca cada hora)
        ttl_hash = int(time.time()) // 3600
        global_rules = get_cached_global_rules(ttl_hash)
        
        if not global_rules:
            logger.error("No global rules found, aborting")
            return
        
        # Contador de progreso
        processed = 0
        errors = 0
        
        # Streaming de usuarios con sesión separada solo para leer IDs
        with session_scope() as db:
            user_ids = [
                row[0] for row in db.query(CycleUser.id).filter(
                    CycleUser.is_active == True
                ).yield_per(BATCH_SIZE_USERS)
            ]
        
        logger.info(f"Starting daily evaluation for {len(user_ids)} users")
        
        # Procesar cada usuario en sesión independiente
        for user_id in user_ids:
            try:
                _process_single_user(user_id, global_rules, now, today_date)
                processed += 1
                
                if processed % 100 == 0:
                    logger.info(f"Progress: {processed}/{len(user_ids)} users processed")
                    
            except Exception as e:
                errors += 1
                logger.error(f"Critical error processing user {user_id}: {e}", exc_info=True)
                continue
        
        logger.info(f"Daily evaluation complete: {processed} processed, {errors} errors")
        
    except Exception as e:
        logger.error(f"Critical error in run_daily_evaluation: {e}", exc_info=True)

def deliver_pending_notifications():
    """
    Tarea periódica para enviar notificaciones pendientes.
    Implementa patrón de dos fases: lock -> procesar fuera de transacción -> actualizar.
    """
    try:
        now = normalize_to_caracas()
        processed = 0
        max_iterations = 10  # Evitar loop infinito
        
        for _ in range(max_iterations):
            # Fase 1: Obtener y lockear un lote de notificaciones
            with session_scope() as db:
                # Actualizar a "processing" para que otros workers no las tomen
                subquery = db.query(PendingNotification.id).filter(
                    PendingNotification.status.in_(["pending", "retrying"]),
                    PendingNotification.scheduled_for <= now
                ).with_for_update(skip_locked=True).limit(BATCH_SIZE_DELIVERY).subquery()
                
                pending_ids = [
                    row[0] for row in db.query(subquery.c.id).all()
                ]
                
                if not pending_ids:
                    break
                
                # Marcar como processing
                db.query(PendingNotification).filter(
                    PendingNotification.id.in_(pending_ids)
                ).update({
                    "status": "processing",
                    "updated_at": now
                }, synchronize_session=False)
            
            # Fase 2: Procesar fuera de transacción (libera conexión durante envío)
            for pid in pending_ids:
                try:
                    # Recargar notificación en nueva sesión
                    with session_scope() as db:
                        from sqlalchemy.orm import joinedload
                        item = db.query(PendingNotification).options(
                            joinedload(PendingNotification.rule)
                        ).filter_by(id=pid).first()
                        
                        if not item or item.status != "processing":
                            continue
                        
                        # Enviar notificación
                        success, channel_used, error = send_dual_notification_logic(db, item)
                        
                        # Actualizar resultado
                        if success:
                            item.status = "sent"
                            item.sent_at = now
                            item.channel_used = channel_used
                            
                            log = NotificationLog(
                                notification_rule_id=item.notification_rule_id,
                                recipient_id=item.recipient_id,
                                notification_type=item.rule.notification_type if item.rule else "unknown",
                                title_sent=item.subject,
                                status="sent",
                                channel_used=channel_used,
                                sent_at=now
                            )
                            db.add(log)
                            log_notification_event("sent", item.recipient_id, item.rule.notification_type if item.rule else "unknown", {"channel": channel_used})
                        else:
                            item.retry_count += 1
                            item.last_error = error[:500] if error else None  # Limitar longitud
                            
                            if item.retry_count >= MAX_RETRIES:
                                item.status = "failed"
                                log_notification_event("permanent_failure", item.recipient_id, item.rule.notification_type if item.rule else "unknown", {"error": error})
                            else:
                                item.status = "retrying"
                                item.scheduled_for = calculate_next_retry_time(item.retry_count)
                                log_notification_event("retry", item.recipient_id, item.rule.notification_type if item.rule else "unknown", {"retry_count": item.retry_count, "error": error})
                        
                        processed += 1
                        
                except Exception as e:
                    logger.error(f"Error processing notification {pid}: {e}", exc_info=True)
                    # Intentar marcar como failed
                    try:
                        with session_scope() as db:
                            db.query(PendingNotification).filter_by(id=pid).update({
                                "status": "failed",
                                "last_error": str(e)[:500]
                            })
                    except Exception as e2:
                        logger.error(f"Could not mark notification {pid} as failed: {e2}")
        
        if processed > 0:
            logger.info(f"Delivered {processed} notifications")

    except Exception as e:
        logger.error(f"Critical error in deliver_pending_notifications: {e}", exc_info=True)


def recover_stale_processing_notifications() -> int:
    """
    Rescata notificaciones atascadas en estado 'processing' que llevan más
    de STALE_PROCESSING_TIMEOUT_MINUTES sin actualizarse.

    Esto ocurre cuando un Celery worker muere en medio del envío (OOM, crash,
    reinicio). Sin esta función, esas notificaciones nunca se reintentan.

    Retorna el número de registros rescatados.
    """
    try:
        now = normalize_to_caracas()
        cutoff = now - timedelta(minutes=STALE_PROCESSING_TIMEOUT_MINUTES)

        with session_scope() as db:
            stale_ids = [
                row[0] for row in db.query(PendingNotification.id).filter(
                    PendingNotification.status == "processing",
                    PendingNotification.updated_at < cutoff
                ).all()
            ]

            if not stale_ids:
                return 0

            rescued = db.query(PendingNotification).filter(
                PendingNotification.id.in_(stale_ids)
            ).update({
                "status": "retrying",
                "retry_count": PendingNotification.retry_count + 1,
                "last_error": f"Recovered from stale processing state (>{STALE_PROCESSING_TIMEOUT_MINUTES}min)",
                "scheduled_for": now + timedelta(minutes=2),  # Reintento en 2 minutos
                "updated_at": now,
            }, synchronize_session=False)

            logger.warning(
                f"[RECOVERY] Rescued {rescued} stale 'processing' notifications "
                f"(stuck >{STALE_PROCESSING_TIMEOUT_MINUTES}min). IDs: {stale_ids[:10]}"
            )
            return rescued

    except Exception as e:
        logger.error(f"Error in recover_stale_processing_notifications: {e}", exc_info=True)
        return 0

# ==============================================================================
# 6. HEALTH CHECK
# ==============================================================================

def get_notification_system_health(db: Session) -> dict:
    """Devuelve métricas de salud del sistema de notificaciones."""
    try:
        now = normalize_to_caracas()
        yesterday = now - timedelta(days=1)
        
        pending_count = db.query(PendingNotification).filter(PendingNotification.status == "pending").count()
        failed_count = db.query(PendingNotification).filter(PendingNotification.status == "failed").count()
        retrying_count = db.query(PendingNotification).filter(PendingNotification.status == "retrying").count()
        processing_count = db.query(PendingNotification).filter(PendingNotification.status == "processing").count()
        
        sent_last_24h = db.query(NotificationLog).filter(NotificationLog.sent_at >= yesterday).count()
        failed_last_24h = db.query(PendingNotification).filter(
            PendingNotification.status == "failed",
            PendingNotification.updated_at >= yesterday
        ).count()
        
        # Determinar estado
        status = "healthy"
        if failed_count > 100 or failed_last_24h > 50:
            status = "degraded"
        if failed_count > 500 or failed_last_24h > 200:
            status = "critical"
        
        return {
            "status": status,
            "pending_queue": pending_count,
            "processing": processing_count,
            "failed_total": failed_count,
            "retrying": retrying_count,
            "sent_last_24h": sent_last_24h,
            "failed_last_24h": failed_last_24h,
            "circuit_breaker": {
                "state": push_circuit.state.value,
                "failures": push_circuit.failure_count,
                "threshold": push_circuit.failure_threshold
            },
            "timestamp": now.isoformat()
        }
    except Exception as e:
        logger.error(f"Error en health check: {e}")
        return {"status": "unhealthy", "error": str(e), "timestamp": normalize_to_caracas().isoformat()}