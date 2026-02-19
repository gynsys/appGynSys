"""
Servicio Monolítico de Notificaciones (The Brain)
Consolida: Reglas (Registry), Procesamiento (Processor), Envío (Sender) y CRUD.
"""
import logging
import json
from datetime import datetime, timedelta, date
import pytz
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.config import settings
from app.db.models.notification import NotificationRule, NotificationLog, PendingNotification, NotificationChannel
from app.db.models.cycle_user import CycleUser
from app.db.models.doctor import Doctor
from app.db.models.cycle_predictor import CycleLog, PregnancyLog, SymptomLog, CycleNotificationSettings
from app.db.models.push_subscription import PushSubscription
from app.schemas.notification import NotificationRuleUpdate, PushSubscriptionSchema
from app.cycle_predictor.logic import calculate_predictions
from app.tasks.email_tasks import _send_smtp_email, _send_web_push

logger = logging.getLogger(__name__)

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
    return db_obj

def create_or_update_subscription(db: Session, sub_in: PushSubscriptionSchema, user_id: int) -> PushSubscription:
    db_obj = db.query(PushSubscription).filter(PushSubscription.endpoint == sub_in.endpoint).first()
    if db_obj:
        db_obj.user_id = user_id
        db_obj.p256dh = sub_in.keys.p256dh
        db_obj.auth = sub_in.keys.auth
    else:
        db_obj = PushSubscription(
            user_id=user_id,
            endpoint=sub_in.endpoint,
            p256dh=sub_in.keys.p256dh,
            auth=sub_in.keys.auth
        )
        db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def delete_subscription_by_endpoint(db: Session, endpoint: str) -> bool:
    db.query(PushSubscription).filter(PushSubscription.endpoint == endpoint).delete()
    db.commit()
    return True


# ==============================================================================
# 3. CONTEXT & PROCESSING LOGIC (THE BRAIN)
# ==============================================================================

def calculate_smart_context(user: CycleUser, predictions: dict, pregnancy: PregnancyLog, db_session: Session) -> dict:
    """Build a comprehensive context object describing the user's current status."""
    tz = pytz.timezone('America/Caracas')
    today = datetime.now(tz).date()
    ctx = { "today": today }
    
    # 1. Pregnancy Context
    if pregnancy:
        ctx["is_pregnant"] = True
        gestation_days = (today - pregnancy.last_period_date).days
        ctx["gestation_days"] = gestation_days
        ctx["gestation_week"] = gestation_days // 7
        ctx["gestation_day_of_week"] = (gestation_days % 7) + 1 
        
        if ctx["gestation_week"] < 14: ctx["trimester"] = 1
        elif ctx["gestation_week"] < 28: ctx["trimester"] = 2
        else: ctx["trimester"] = 3
            
    # Universal Symptom Check
    symptom_log = db_session.query(SymptomLog).filter(
        SymptomLog.cycle_user_id == user.id,
        SymptomLog.date == today
    ).first()
    if symptom_log and symptom_log.symptoms:
        if isinstance(symptom_log.symptoms, list): ctx["reported_symptoms"] = symptom_log.symptoms
        elif isinstance(symptom_log.symptoms, str): ctx["reported_symptoms"] = [symptom_log.symptoms]

    if pregnancy: return ctx
    
    ctx["is_pregnant"] = False
    
    # 2. Cycle Context
    if predictions:
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

    # 3. Contraceptive Context
    cycle_day = ctx.get("cycle_day", 0)
    if cycle_day > 0:
        ctx["pill_number"] = cycle_day
        if cycle_day <= 21: ctx["pill_subtype"] = "active_pill"
        elif cycle_day <= 28: ctx["pill_subtype"] = "placebo"
        if cycle_day == 1: ctx["pill_event"] = "new_pack"

    # 4. Annual Checkup
    if user.created_at:
        user_created_date = user.created_at.date()
        if user_created_date.month == today.month and user_created_date.day == today.day:
            ctx["is_annual_checkup"] = True

    return ctx

def evaluate_registry_rule(rule_def: dict, context: dict, user_settings: CycleNotificationSettings) -> bool:
    if not user_settings: return False
    
    # 1. Logic
    if not rule_def["logic"](context): return False
        
    # 2. Preferences
    category = rule_def["category"]
    if context.get("is_pregnant"):
        if category == "prenatal" and not user_settings.prenatal_milestones: return False
    else:
        if category == "contraceptive" and not user_settings.contraceptive_enabled: return False
            
    return True

# ==============================================================================
# 4. DELIVERY LOGIC (SENDER)
# ==============================================================================

def send_dual_notification_logic(db, item: PendingNotification):
    """Core delivery logic: ALWAYS Push -> Email failover (Dual)."""
    user = db.query(CycleUser).filter(CycleUser.id == item.recipient_id).first()
    if not user: return False, None, "User not found"
    
    push_success = False
    error_msg = None
    
    # Try Push
    try:
        push_body = item.message_text or item.subject
        _send_web_push(user.id, item.subject, push_body, "/cycle/dashboard", db)
        push_success = True 
    except Exception as e:
        error_msg = f"Push error: {str(e)}"
    
    # Failover to Email
    if not push_success:
        try:
            _send_smtp_email(user.email, item.subject, item.body)
            return True, "email", None
        except Exception as e:
            return False, "email", str(e)
            
    if push_success:
        return True, "push", None
        
    return False, None, error_msg or "No valid channel succeeded"


def run_daily_evaluation(db: Session):
    """
    Daily Task (8:00 AM): Evaluates global rules for all users.
    Optimized for Agnostic/Closed App model.
    """
    try:
        tz = pytz.timezone('America/Caracas')
        now = datetime.now(tz)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

        # 1. Fetch Global Rules (Source of Truth for texts)
        global_rules = {
            r.notification_type: r 
            for r in db.query(NotificationRule).filter(NotificationRule.tenant_id == None, NotificationRule.is_active == True).all()
        }

        # 2. Process all Active Users
        users = db.query(CycleUser).filter(CycleUser.is_active == True).all()
        
        for user in users:
            try:
                # Get user context
                user_settings = db.query(CycleNotificationSettings).filter(
                    CycleNotificationSettings.cycle_user_id == user.id
                ).first()
                if not user_settings: continue

                pregnancy = db.query(PregnancyLog).filter(
                     PregnancyLog.cycle_user_id == user.id, 
                     PregnancyLog.is_active == True
                ).first()
                
                predictions = None
                if not pregnancy:
                     last_cycle = db.query(CycleLog).filter(CycleLog.cycle_user_id == user.id).order_by(CycleLog.start_date.desc()).first()
                     if last_cycle:
                         predictions = calculate_predictions(last_cycle.start_date, user.cycle_avg_length, user.period_avg_length)
                
                smart_ctx = calculate_smart_context(user, predictions, pregnancy, db)
                
                # 3. Check Registry Rules
                for rule_def in NOTIFICATION_REGISTRY:
                    rtype = rule_def["type"]
                    
                    # Does it fire?
                    if not evaluate_registry_rule(rule_def, smart_ctx, user_settings):
                        continue
                        
                    # Find the Template Rule (Global or Default)
                    template_rule = global_rules.get(rtype)
                    if not template_rule:
                        logger.warning(f"No global template found for {rtype}")
                        continue

                    # Frequency Cap
                    already_sent = db.query(NotificationLog).filter(
                        NotificationLog.notification_rule_id == template_rule.id,
                        NotificationLog.recipient_id == user.id,
                        NotificationLog.sent_at >= today_start
                    ).first()
                    if already_sent: continue

                    already_pending = db.query(PendingNotification).filter(
                        PendingNotification.notification_rule_id == template_rule.id,
                        PendingNotification.recipient_id == user.id,
                        PendingNotification.status == "pending",
                        PendingNotification.scheduled_for >= today_start
                    ).first()
                    if already_pending: continue

                    # Schedule it
                    try:
                        hour, minute = map(int, template_rule.send_time.split(':'))
                        target_time = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
                    except:
                        target_time = now.replace(hour=8, minute=0, second=0, microsecond=0)
                        
                    if target_time < now:
                        target_time = now + timedelta(minutes=5)

                    # Render
                    render_vars = { "patient_name": user.nombre_completo }
                    render_vars.update(smart_ctx)
                    
                    # Standard Rule render
                    rendered = template_rule.render_content(render_vars)

                    pending = PendingNotification(
                        notification_rule_id=template_rule.id,
                        recipient_id=user.id,
                        subject=rendered["title"],
                        body=rendered["message_html"],
                        message_text=rendered["message_text"],
                        scheduled_for=target_time,
                        channel=template_rule.channel,
                        status="pending"
                    )
                    db.add(pending)
                
                # Commit per user to avoid massive loss on error
                db.commit()
                        
            except Exception as e:
                logger.error(f"Error processing user {user.id}: {e}", exc_info=True)
                db.rollback()
                
    except Exception as e:
        logger.error(f"Critical Error in process_dynamic_notifications: {e}", exc_info=True)


def deliver_pending_notifications(db: Session):
    """
    Periodic task to send pending notifications that are due.
    """
    try:
        tz = pytz.timezone('America/Caracas')
        now = datetime.now(tz)
        
        # Obtener notificaciones pendientes vencidas
        pending_list = db.query(PendingNotification).filter(
            PendingNotification.status.in_(["pending", "retrying"]),
            PendingNotification.scheduled_for <= now
        ).limit(50).all() 
        
        for item in pending_list:
            try:
                # Lógica de entrega
                success, channel_used, error = send_dual_notification_logic(db, item)
                
                if success:
                    item.status = "sent"
                    # Registrar en el log de auditoría
                    log = NotificationLog(
                        notification_rule_id=item.notification_rule_id,
                        recipient_id=item.recipient_id,
                        notification_type=item.rule.notification_type if item.rule else "unknown",
                        title_sent=item.subject,
                        status="sent",
                        channel_used=channel_used
                    )
                    db.add(log)
                else:
                    item.retry_count += 1
                    item.last_error = error
                    if item.retry_count >= 5:
                        item.status = "failed"
                    else:
                        item.status = "retrying"
                    
                    logger.warning(f"Notification {item.id} failed (try {item.retry_count}): {error}")
                
                db.commit()
            except Exception as e:
                db.rollback()
                logger.error(f"Error processing pending notification {item.id}: {e}", exc_info=True)
                
    except Exception as e:
        logger.error(f"Critical error in deliver_pending_notifications: {e}", exc_info=True)
