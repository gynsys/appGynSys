from typing import List, Dict, Any, Union, Optional
from sqlalchemy.orm import Session
from app.db.models.notification import NotificationRule
from app.db.models.cycle_predictor import CycleNotificationSettings
from .base import logger, log_notification_event

# --- Helper logic functions ---
def is_day(context: dict, day: int) -> bool:
    return context.get("cycle_day") == day

def is_week(context: dict, week: int) -> bool:
    return context.get("gestation_week") == week

def has_event(context: dict, event: str) -> bool:
    return context.get("event") == event

# --- Registry Definition ---
NOTIFICATION_REGISTRY: List[Dict[str, Any]] = [
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
    
    # ===== METODO DEL RITMO (Días Infértiles/Seguros) =====
    { "type": "rhythm_after_period_1", "category": "rhythm", "priority": 150, "title": "Día Seguro - Post Periodo (1/5)", "message": "Estás en tu primer día infértil post-periodo. Riesgo de embarazo muy bajo.", "logic": lambda c: c.get("days_after_period") == 1 },
    { "type": "rhythm_after_period_2", "category": "rhythm", "priority": 151, "title": "Día Seguro - Post Periodo (2/5)", "message": "Fase infértil activa. Puedes aplicar el método del ritmo de forma segura.", "logic": lambda c: c.get("days_after_period") == 2 },
    { "type": "rhythm_after_period_3", "category": "rhythm", "priority": 152, "title": "Día Seguro - Post Periodo (3/5)", "message": "Continúa tu ventana de días seguros según el método del ritmo.", "logic": lambda c: c.get("days_after_period") == 3 },
    { "type": "rhythm_after_period_4", "category": "rhythm", "priority": 153, "title": "Día Seguro - Precaución Pronto (4/5)", "message": "Penúltimo día de tu fase segura post-periodo antes de ovular.", "logic": lambda c: c.get("days_after_period") == 4 },
    { "type": "rhythm_after_period_5", "category": "rhythm", "priority": 154, "title": "Día Seguro - Precaución Hoy (5/5)", "message": "Último día seguro de esta fase. A partir de mañana tu ventana fértil comienza.", "logic": lambda c: c.get("days_after_period") == 5 },

    { "type": "rhythm_before_period_5", "category": "rhythm", "priority": 155, "title": "Día Seguro - Pre Periodo (1/5)", "message": "Tu ventana fértil terminó. Inician tus 5 días seguros antes del próximo periodo.", "logic": lambda c: c.get("days_before_period") == 5 },
    { "type": "rhythm_before_period_4", "category": "rhythm", "priority": 156, "title": "Día Seguro - Pre Periodo (2/5)", "message": "Fase infértil pre-menstrual. Probabilidad de embarazo muy baja.", "logic": lambda c: c.get("days_before_period") == 4 },
    { "type": "rhythm_before_period_3", "category": "rhythm", "priority": 157, "title": "Día Seguro - Pre Periodo (3/5)", "message": "Continúan tus días seguros según el método del ritmo.", "logic": lambda c: c.get("days_before_period") == 3 },
    { "type": "rhythm_before_period_2", "category": "rhythm", "priority": 158, "title": "Día Seguro - Pre Periodo (4/5)", "message": "Tu periodo está por llegar. Día completamente seguro para relaciones.", "logic": lambda c: c.get("days_before_period") == 2 },
    { "type": "rhythm_before_period_1", "category": "rhythm", "priority": 159, "title": "Día Seguro - Pre Periodo (5/5)", "message": "Último día antes de tu periodo. Fase completamente infértil.", "logic": lambda c: c.get("days_before_period") == 1 },

    # ===== PRENATAL (41 SEMANAS) =====
    *[
        {
            "type": f"prenatal_week_{i}",
            "category": "prenatal",
            "priority": 200 + i,
            "title": f"Semana {i} de Embarazo",
            "message": f"🤰 ¡Semana {i}! Tu cuerpo y tu bebé están cambiando. Revisa tu app para ver el desarrollo de esta semana.",
            "logic": lambda c, i=i: is_week(c, i) and c.get("gestation_day_of_week") == 1
        } for i in range(1, 42)
    ],

    # ===== PRENATAL DAILY ROUTINES (New Rotating System) =====
    { "type": "prenatal_weekly_milestone", "category": "prenatal_milestone", "priority": 110, "title": "👶 Desarrollo del Bebé", "message": "¡Semana {gestation_week}! Tu bebé sigue creciendo. Descubre los nuevos órganos y sentidos que está desarrollando esta semana.", "logic": lambda c: c.get("is_pregnant") and c.get("gestation_day_of_week") == 1 },
    { "type": "prenatal_daily_nutrition_tip", "category": "prenatal_tip", "priority": 111, "title": "🥗 Tip de Nutrición", "message": "Asegúrate de incluir hierro y calcio en tu dieta hoy. Las espinacas y los lácteos son tus mejores aliados para el crecimiento fetal.", "logic": lambda c: c.get("is_pregnant") and c.get("gestation_day_of_week") == 2 },
    { "type": "prenatal_symptom_check", "category": "prenatal_symptom_alert", "priority": 112, "title": "📋 Bienestar y Síntomas", "message": "¿Sientes náuseas o cansancio? Es muy común. Registra cómo te sientes hoy en la aplicación para llevar un control seguro.", "logic": lambda c: c.get("is_pregnant") and c.get("gestation_day_of_week") == 3 },
    { "type": "prenatal_medical_tests_reminder", "category": "prenatal_test", "priority": 113, "title": "🩺 Estudios Médicos", "message": "Revisa si tienes laboratorios o pruebas de sangre pendientes para este trimestre. Mantener tus exámenes al día es vital.", "logic": lambda c: c.get("is_pregnant") and c.get("gestation_day_of_week") == 4 },
    { "type": "prenatal_exercise_tip", "category": "prenatal_tip", "priority": 114, "title": "🧘‍♀️ Movimiento y Salud", "message": "El ejercicio suave como caminar o yoga prenatal ayuda a reducir dolores de espalda y mejora la circulación. ¡Muévete un poco hoy!", "logic": lambda c: c.get("is_pregnant") and c.get("gestation_day_of_week") == 5 },
    { "type": "prenatal_ultrasound_prep", "category": "prenatal_ultrasound", "priority": 115, "title": "📸 Preparación Ecografía", "message": "Las ecografías son ventanas al mundo de tu bebé. Recuerda agendar tus ecos morfológicos en las semanas correspondientes.", "logic": lambda c: c.get("is_pregnant") and c.get("gestation_day_of_week") == 6 },
    { "type": "prenatal_rest_mindfulness", "category": "prenatal_tip", "priority": 116, "title": "😴 Descanso y Conexión", "message": "Domingo de descanso. Tómate un momento en silencio, respira y conéctate con tu bebé. Dormir bien es fundamental.", "logic": lambda c: c.get("is_pregnant") and c.get("gestation_day_of_week") == 7 },

    { "type": "prenatal_daily_supplements", "category": "prenatal_tip", "priority": 10, "title": "💊 Protege a tu bebé", "message": "¡Buenos días mamá! No olvides tomar tu vitamina prenatal, calcio o ácido fólico.", "logic": lambda c: c.get("is_pregnant") is True },
    { "type": "prenatal_daily_symptom_check", "category": "prenatal", "priority": 15, "title": "📋 Chequeo Diario", "message": "¿Cómo te sientes hoy médica o emocionalmente? Registra tus síntomas.", "logic": lambda c: c.get("is_pregnant") is True },

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

# --- Evaluation Logic ---
def evaluate_registry_rule(rule_def: dict, context: dict, user_settings: CycleNotificationSettings) -> bool:
    """Evalúa si una regla del registro debe dispararse."""
    if not user_settings:
        return False
    
    # Si está embarazada, solo reglas prenatales o del sistema
    if context.get("is_pregnant") and not rule_def["category"].startswith("prenatal") and rule_def["category"] != "system":
        return False
    
    try:
        if not rule_def["logic"](context):
            return False
    except Exception as e:
        logger.error(f"Error ejecutando lógica de regla {rule_def['type']}: {e}")
        return False
        
    category = rule_def["category"]
    
    # Evaluar las 5 subcategorías prenatales contra los respectivos switches del usuario
    if category.startswith("prenatal"):
        if category == "prenatal_milestone" and not getattr(user_settings, 'prenatal_milestones', True):
            return False
        if category == "prenatal_tip" and not getattr(user_settings, 'prenatal_daily_tips', True):
            return False
        if category == "prenatal_symptom_alert" and not getattr(user_settings, 'prenatal_symptom_alerts', True):
            return False
        if category == "prenatal_ultrasound" and not getattr(user_settings, 'prenatal_ultrasounds', True):
            return False
        if category == "prenatal_test" and not getattr(user_settings, 'prenatal_lab_results', True): # Maping medical tests to lab results switch
            return False
        # Las de categoría genérica "prenatal" por defecto pasan si cumplen lo anterior

    if category == "contraceptive" and not getattr(user_settings, 'contraceptive_enabled', False):
        return False
    if category == "rhythm" and not getattr(user_settings, 'rhythm_method_enabled', False):
        return False
            
    return True

# --- Rule Container ---
class _RuleData:
    """Contenedor simple de datos de una NotificationRule."""
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
