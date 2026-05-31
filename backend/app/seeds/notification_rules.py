# app/seeds/notification_rules.py
from sqlalchemy.orm import Session
from app.db.models.notification import NotificationRule, PendingNotification

def seed_notification_rules(db: Session, tenant_id: int):
    """
    Seed ALL 101 notification rules for a specific doctor (tenant).
    Wipes existing rules first for a clean state.
    """
    # Get IDs of rules to delete
    if tenant_id is None:
        rule_ids_query = db.query(NotificationRule.id).filter(NotificationRule.tenant_id.is_(None))
    else:
        rule_ids_query = db.query(NotificationRule.id).filter(NotificationRule.tenant_id == tenant_id)
        
    rule_ids = [r[0] for r in rule_ids_query.all()]
    
    # WIPE pending notifications for these rules
    if rule_ids:
        db.query(PendingNotification).filter(
            PendingNotification.notification_rule_id.in_(rule_ids)
        ).delete(synchronize_session=False)

    # WIPE existing rules for this tenant
    if tenant_id is None:
        db.query(NotificationRule).filter(NotificationRule.tenant_id.is_(None)).delete(synchronize_session=False)
    else:
        db.query(NotificationRule).filter(NotificationRule.tenant_id == tenant_id).delete(synchronize_session=False)

    db.commit()

    standard_rules = [
        # ===== CALCULADORA MENSTRUAL (28 + 1 rules) =====
        {
            "notification_type": "day_1_period_start",
            "trigger_condition": {"cycle_day": 1},
            "priority": 100,
            "title_template": "Inicio Periodo",
            "message_template": "👋 Hola! {patient_name}.\n\n🩸 Hoy inicia tu periodo. Registra tu flujo y síntomas para un seguimiento preciso.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nInicio de tu periodo",
            "channel": "dual",
            "send_time": "08:00"
        },
        {
            "notification_type": "day_2_symptom_check",
            "trigger_condition": {"cycle_day": 2},
            "priority": 101,
            "title_template": "Chequeo de Dolor",
            "message_template": "👋 Hola! {patient_name}.\n\n¿Cómo te sientes hoy? Registra dolor, flujo y otros síntomas.",
            "message_text_template": "👋 Hola! {patient_name}.\n\n¿Cómo te sientes?",
            "channel": "dual",
            "send_time": "09:00"
        },
        {
            "notification_type": "day_3_hydration",
            "trigger_condition": {"cycle_day": 3},
            "priority": 102,
            "title_template": "Hidratación",
            "message_template": "👋 Hola! {patient_name}.\n\n💧 Recuerda beber mucha agua para ayudar con los cólicos.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nMantente hidratada",
            "channel": "dual",
            "send_time": "10:00"
        },
        {
            "notification_type": "day_4_mood_track",
            "trigger_condition": {"cycle_day": 4},
            "priority": 103,
            "title_template": "Estado de Ánimo",
            "message_template": "👋 Hola! {patient_name}.\n\n¿Cómo está tu ánimo hoy? Registra tus emociones.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nRegistro de ánimo",
            "channel": "dual",
            "send_time": "11:00"
        },
        {
            "notification_type": "day_5_flow_decrease",
            "trigger_condition": {"cycle_day": 5},
            "priority": 104,
            "title_template": "Fin de Chequeo",
            "message_template": "👋 Hola! {patient_name}.\n\nTu flujo debería estar disminuyendo. ¿Cómo va tu periodo?",
            "message_text_template": "👋 Hola! {patient_name}.\n\nChequeo de flujo",
            "channel": "dual",
            "send_time": "08:30"
        },
        {
            "notification_type": "day_6_energy_boost",
            "trigger_condition": {"cycle_day": 6},
            "priority": 105,
            "title_template": "Energía en Aumento",
            "message_template": "👋 Hola! {patient_name}.\n\n✨ Tu energía debería aumentar. Buen momento para ejercitarte.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nMomento de ejercicio",
            "channel": "dual",
            "send_time": "07:00"
        },
        {
            "notification_type": "day_7_period_end",
            "trigger_condition": {"cycle_day": 7},
            "priority": 106,
            "title_template": "Fin de Periodo",
            "message_template": "👋 Hola! {patient_name}.\n\nTu periodo debería estar terminando. ¡Inicia una nueva fase!",
            "message_text_template": "👋 Hola! {patient_name}.\n\nFin del periodo",
            "channel": "dual",
            "send_time": "08:00"
        },
        {
            "notification_type": "day_8_skin_care",
            "trigger_condition": {"cycle_day": 8},
            "priority": 107,
            "title_template": "Piel Radiante",
            "message_template": "👋 Hola! {patient_name}.\n\n🌸 Tu piel está en su mejor momento. Cuídala bien.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nCuida tu piel",
            "channel": "dual",
            "send_time": "09:00"
        },
        {
            "notification_type": "day_9_fertile_approaching",
            "trigger_condition": {"cycle_day": 9},
            "priority": 108,
            "title_template": "Ventana Fértil Cerca",
            "message_template": "👋 Hola! {patient_name}.\n\n❤️ Se aproxima tu ventana fértil. Estate atenta.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nFertilidad próxima",
            "channel": "dual",
            "send_time": "08:00"
        },
        {
            "notification_type": "day_10_fertile_start",
            "trigger_condition": {"cycle_day": 10},
            "priority": 109,
            "title_template": "Ventana Fértil",
            "message_template": "👋 Hola! {patient_name}.\n\n❤️‍🔥 Inicia tu ventana fértil. Alta probabilidad de concepción.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nVentana fértil inicia",
            "channel": "dual",
            "send_time": "08:00"
        },
        {
            "notification_type": "day_11_high_fertility",
            "trigger_condition": {"cycle_day": 11},
            "priority": 110,
            "title_template": "Fertilidad Alta",
            "message_template": "👋 Hola! {patient_name}.\n\n🔥 Fertilidad muy alta. Momento ideal para concebir.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nAlta fertilidad",
            "channel": "dual",
            "send_time": "08:00"
        },
        {
            "notification_type": "day_12_peak_fertility",
            "trigger_condition": {"cycle_day": 12},
            "priority": 111,
            "title_template": "Pico de Fertilidad",
            "message_template": "👋 Hola! {patient_name}.\n\n🔥🔥 Pico máximo de fertilidad. Mayor probabilidad de embarazo.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nPico de fertilidad",
            "channel": "dual",
            "send_time": "08:00"
        },
        {
            "notification_type": "day_13_ovulation",
            "trigger_condition": {"cycle_day": 13},
            "priority": 112,
            "title_template": "Posible Ovulación",
            "message_template": "👋 Hola! {patient_name}.\n\n🥚 Probable día de ovulación. Registra síntomas.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nOvulación probable",
            "channel": "dual",
            "send_time": "08:00"
        },
        {
            "notification_type": "day_14_ovulation_peak",
            "trigger_condition": {"cycle_day": 14},
            "priority": 113,
            "title_template": "Ovulación",
            "message_template": "👋 Hola! {patient_name}.\n\n🥚 Día típico de ovulación (ciclo 28 días).",
            "message_text_template": "👋 Hola! {patient_name}.\n\nOvulación",
            "channel": "dual",
            "send_time": "08:00"
        },
        {
            "notification_type": "day_15_fertile_end",
            "trigger_condition": {"cycle_day": 15},
            "priority": 114,
            "title_template": "Fin Ventana Fértil",
            "message_template": "👋 Hola! {patient_name}.\n\n✅ Termina tu ventana fértil.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nFin de fertilidad",
            "channel": "dual",
            "send_time": "08:00"
        },
        {
            "notification_type": "day_16_implantation_window",
            "trigger_condition": {"cycle_day": 16},
            "priority": 115,
            "title_template": "Posible Implantación",
            "message_template": "👋 Hola! {patient_name}.\n\nSi hubo concepción, puede iniciar la implantación.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nVentana de implantación",
            "channel": "dual",
            "send_time": "09:00"
        },
        {
            "notification_type": "day_17_mood_watch",
            "trigger_condition": {"cycle_day": 17},
            "priority": 116,
            "title_template": "Observa tu Humor",
            "message_template": "👋 Hola! {patient_name}.\n\nEntras en fase lútea. Observa cambios en tu humor.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nFase lútea inicia",
            "channel": "dual",
            "send_time": "10:00"
        },
        {
            "notification_type": "day_18_exercise_tip",
            "trigger_condition": {"cycle_day": 18},
            "priority": 117,
            "title_template": "Ejercicio Suave",
            "message_template": "👋 Hola! {patient_name}.\n\nBuen momento para yoga o caminatas tranquilas.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nTip de ejercicio",
            "channel": "dual",
            "send_time": "09:00"
        },
        {
            "notification_type": "day_19_metabolism_alert",
            "trigger_condition": {"cycle_day": 19},
            "priority": 118,
            "title_template": "Metabolismo",
            "message_template": "👋 Hola! {patient_name}.\n\nTu metabolismo aumenta. Puedes sentir más hambre.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nCambios energéticos",
            "channel": "dual",
            "send_time": "11:00"
        },
        {
            "notification_type": "day_20_rest_importance",
            "trigger_condition": {"cycle_day": 20},
            "priority": 119,
            "title_template": "Descanso",
            "message_template": "👋 Hola! {patient_name}.\n\nPrioriza el sueño. Tu cuerpo se prepara para el fin del ciclo.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nImportancia del descanso",
            "channel": "dual",
            "send_time": "21:00"
        },
        {
            "notification_type": "day_21_cycle_summary",
            "trigger_condition": {"cycle_day": 21},
            "priority": 120,
            "title_template": "Resumen de Ciclo",
            "message_template": "👋 Hola! {patient_name}.\n\nHas tenido un ciclo regular. Revisa tus registros mensuales.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nResumen",
            "channel": "dual",
            "send_time": "10:00"
        },
        {
            "notification_type": "day_22_pms_start",
            "trigger_condition": {"cycle_day": 22},
            "priority": 121,
            "title_template": "Posible SPM",
            "message_template": "👋 Hola! {patient_name}.\n\n💙 Pueden iniciar síntomas premenstruales. Cuídate.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nPosible SPM",
            "channel": "dual",
            "send_time": "09:00"
        },
        {
            "notification_type": "day_23_bloating_check",
            "trigger_condition": {"cycle_day": 23},
            "priority": 122,
            "title_template": "Hinchazón",
            "message_template": "👋 Hola! {patient_name}.\n\n¿Te sientes hinchada? Es normal en esta fase.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nRegistro de síntomas",
            "channel": "dual",
            "send_time": "08:00"
        },
        {
            "notification_type": "day_24_mood_changes",
            "trigger_condition": {"cycle_day": 24},
            "priority": 123,
            "title_template": "Cambios de Ánimo",
            "message_template": "👋 Hola! {patient_name}.\n\nRegistra tu estado de ánimo y síntomas emocionales.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nRegistro emocional",
            "channel": "dual",
            "send_time": "11:00"
        },
        {
            "notification_type": "day_25_breast_tenderness",
            "trigger_condition": {"cycle_day": 25},
            "priority": 124,
            "title_template": "Sensibilidad Mamaria",
            "message_template": "👋 Hola! {patient_name}.\n\n¿Sensibilidad o dolor en los senos? Registra tus síntomas.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nChequeo de síntomas",
            "channel": "dual",
            "send_time": "10:00"
        },
        {
            "notification_type": "day_26_period_preparation",
            "trigger_condition": {"cycle_day": 26},
            "priority": 125,
            "title_template": "Preparación",
            "message_template": "👋 Hola! {patient_name}.\n\nTu periodo debería llegar en 2-3 días. Prepárate.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nPeriodo próximo",
            "channel": "dual",
            "send_time": "08:00"
        },
        {
            "notification_type": "day_27_cramps_alert",
            "trigger_condition": {"cycle_day": 27},
            "priority": 126,
            "title_template": "Posibles Cólicos",
            "message_template": "👋 Hola! {patient_name}.\n\nPueden iniciar cólicos premenstruales.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nAlerta de cólicos",
            "channel": "dual",
            "send_time": "09:00"
        },
        {
            "notification_type": "day_28_period_tomorrow",
            "trigger_condition": {"cycle_day": 28},
            "priority": 127,
            "title_template": "Periodo Mañana",
            "message_template": "👋 Hola! {patient_name}.\n\n📅 Tu periodo debería llegar mañana. ¿Ya llegó?",
            "message_text_template": "👋 Hola! {patient_name}.\n\nPeriodo por llegar",
            "channel": "dual",
            "send_time": "18:00"
        },
        {
            "notification_type": "period_late_1_day",
            "trigger_condition": {"event": "period_late", "days": 1},
            "priority": 128,
            "title_template": "1 Día de Retraso",
            "message_template": "👋 Hola! {patient_name}.\n\n📅 Tu periodo tiene 1 día de retraso. ¿Ya llegó?",
            "message_text_template": "👋 Hola! {patient_name}.\n\n1 día de retraso",
            "channel": "dual",
            "send_time": "09:00"
        },

        # ===== PRENATAL MILESTONES & ALERTS (21 rules) =====
        {
            "notification_type": "prenatal_first_ultrasound",
            "trigger_condition": {"event": "first_ultrasound"},
            "priority": 250,
            "title_template": "📸 Primera Ecografía",
            "message_template": "👋 Hola! {patient_name}.\n\nAgenda tu primera ecografía (entre semanas 6-8).",
            "message_text_template": "👋 Hola! {patient_name}.\n\nPrimera ecografía sugerida",
            "channel": "dual",
            "send_time": "10:00"
        },
        {
            "notification_type": "prenatal_genetic_test",
            "trigger_condition": {"event": "genetic_test"},
            "priority": 251,
            "title_template": "🧬 Test Genético",
            "message_template": "👋 Hola! {patient_name}.\n\nConsidera realizar pruebas genéticas (NIPT) entre semanas 10-13.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nTest genético disponible",
            "channel": "dual",
            "send_time": "10:00"
        },
        {
            "notification_type": "prenatal_anatomy_scan",
            "trigger_condition": {"event": "anatomy_scan"},
            "priority": 252,
            "title_template": "📸 Ecografía Anatómica",
            "message_template": "👋 Hola! {patient_name}.\n\nEs hora de tu ecografía morfológica (semana 18-22). Un momento clave para ver el desarrollo detallado de tu bebé.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nAgenda tu ecografía anatómica (semana 18-22)",
            "channel": "dual",
            "send_time": "10:00"
        },
        {
            "notification_type": "prenatal_3d_5d_ultrasound",
            "trigger_condition": {"gestation_week": [27]},
            "priority": 252,
            "title_template": "📸 Eco 3D/4D/5D",
            "message_template": "👋 Hola! {patient_name}.\n\n¡Es el mejor momento para ver la carita de tu bebé! Agenda tu ecografía 3D/4D/5D entre las semanas 26 y 30 para obtener las mejores imágenes.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nEs buen momento para agendar tu Eco 3D/5D",
            "channel": "dual",
            "send_time": "11:00"
        },
        {
            "notification_type": "prenatal_monthly_dentist",
            "trigger_condition": {"gestation_week": [16, 24, 32]},
            "priority": 252,
            "title_template": "🦷 Cuidado Dental",
            "message_template": "👋 Hola! {patient_name}.\n\nMes de revisión. ¿Has ido al dentista este mes? Recuerda que tus encías necesitan cuidados extra durante el embarazo para evitar gingivitis gestacional.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nRecordatorio: Cuida tus encías y visita al dentista",
            "channel": "dual",
            "send_time": "12:00"
        },
        {
            "notification_type": "prenatal_glucose_test",
            "trigger_condition": {"event": "glucose_test"},
            "priority": 253,
            "title_template": "🍬 Test de Glucosa",
            "message_template": "👋 Hola! {patient_name}.\n\nRecuerda realizarte el test de tolerancia a la glucosa de O'Sullivan (semana 24-28).",
            "message_text_template": "👋 Hola! {patient_name}.\n\nTiempo para el test de glucosa (semana 24-28)",
            "channel": "dual",
            "send_time": "10:00"
        },
        {
            "notification_type": "prenatal_tdap_vaccine",
            "trigger_condition": {"event": "tdap_vaccine"},
            "priority": 254,
            "title_template": "💉 Vacuna Tdap",
            "message_template": "👋 Hola! {patient_name}.\n\nVacuna contra tosferina (Tdap) - semana 27-36.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nVacuna Tdap sugerida",
            "channel": "dual",
            "send_time": "10:00"
        },
        {
            "notification_type": "prenatal_group_b_strep",
            "trigger_condition": {"event": "group_b_strep"},
            "priority": 255,
            "title_template": "🦠 Test Estreptococo B",
            "message_template": "👋 Hola! {patient_name}.\n\nTest de Estreptococo Grupo B (semana 35-37).",
            "message_text_template": "👋 Hola! {patient_name}.\n\nTest estreptococo B",
            "channel": "dual",
            "send_time": "09:00"
        },
        {
            "notification_type": "prenatal_kick_counts",
            "trigger_condition": {"event": "kick_counts"},
            "priority": 256,
            "title_template": "👶 Conteo de Patadas",
            "message_template": "👋 Hola! {patient_name}.\n\nInicia el conteo diario de movimientos fetales (semana 28+).",
            "message_text_template": "👋 Hola! {patient_name}.\n\nConteo de movimientos",
            "channel": "dual",
            "send_time": "19:00"
        },
        {
            "notification_type": "prenatal_reduced_movement",
            "trigger_condition": {"event": "reduced_movement"},
            "priority": 5,
            "title_template": "⚠️ Movimientos Reducidos",
            "message_template": "👋 Hola! {patient_name}.\n\nSi notas movimientos fetales reducidos, contacta a tu médico inmediatamente.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nAlerta: Movimientos reducidos",
            "channel": "dual",
            "send_time": "08:00"
        },
        {
            "notification_type": "prenatal_bleeding",
            "trigger_condition": {"event": "bleeding_alert"},
            "priority": 1,
            "title_template": "🚨 Sangrado",
            "message_template": "👋 Hola! {patient_name}.\n\nSangrado durante el embarazo requiere atención médica inmediata.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nAlerta: Sangrado",
            "channel": "dual",
            "send_time": "08:00"
        },
        {
            "notification_type": "prenatal_severe_headache",
            "trigger_condition": {"event": "severe_headache"},
            "priority": 2,
            "title_template": "🤕 Dolor de Cabeza Severo",
            "message_template": "👋 Hola! {patient_name}.\n\nDolor de cabeza severo puede ser signo de preeclampsia. Consulta a tu médico.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nAlerta: Dolor de cabeza",
            "channel": "dual",
            "send_time": "08:00"
        },
        {
            "notification_type": "prenatal_vision_changes",
            "trigger_condition": {"event": "vision_changes"},
            "priority": 3,
            "title_template": "👁️ Cambios en la Visión",
            "message_template": "👋 Hola! {patient_name}.\n\nCambios en la visión pueden indicar preeclampsia. Contacta a tu médico.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nAlerta: Visión borrosa",
            "channel": "dual",
            "send_time": "08:00"
        },
        {
            "notification_type": "prenatal_contractions",
            "trigger_condition": {"event": "regular_contractions"},
            "priority": 10,
            "title_template": "💪 Contracciones Regulares",
            "message_template": "👋 Hola! {patient_name}.\n\nContracciones regulares cada 5-10 minutos. Puede ser momento de ir al hospital.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nContracciones regulares",
            "channel": "dual",
            "send_time": "08:00"
        },
        {
            "notification_type": "prenatal_water_break",
            "trigger_condition": {"event": "water_break"},
            "priority": 5,
            "title_template": "💧 Ruptura de Bolsa",
            "message_template": "👋 Hola! {patient_name}.\n\nSi rompiste bolsa, contacta a tu médico y ve al hospital.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nAlerta: Ruptura de bolsa",
            "channel": "dual",
            "send_time": "08:00"
        },
        {
            "notification_type": "prenatal_swelling",
            "trigger_condition": {"event": "sudden_swelling"},
            "priority": 15,
            "title_template": "🦶 Hinchazón Súbita",
            "message_template": "👋 Hola! {patient_name}.\n\nHinchazón súbita en manos, cara o piernas puede ser preeclampsia.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nAlerta: Hinchazón",
            "channel": "dual",
            "send_time": "08:00"
        },
        {
            "notification_type": "prenatal_daily_tip_2",
            "trigger_condition": {"gestation_day_of_week": 2},
            "priority": 100,
            "title_template": "🥗 Nutrición Saludable",
            "message_template": "👋 Hola! {patient_name}.\n\nA la hora de comer, prioriza el plato saludable: verduras, proteína y un poco de carbohidrato. ¿Un antojo de media tarde? Prueba con fruta natural.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nNutrición saludable hoy.",
            "channel": "dual",
            "send_time": "13:30"
        },
        {
            "notification_type": "prenatal_daily_tip_3",
            "trigger_condition": {"gestation_day_of_week": 3},
            "priority": 101,
            "title_template": "💧 Hidratación y Cuidado",
            "message_template": "👋 Hola! {patient_name}.\n\n¡Hora de beber agua! Intenta alcanzar los 2 litros al día. ¿Un tip extra? Aplica crema hidratante en vientre y masajéalo.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nRecuerda hidratarte.",
            "channel": "dual",
            "send_time": "11:00"
        },
        {
            "notification_type": "prenatal_daily_tip_4",
            "trigger_condition": {"gestation_day_of_week": 4},
            "priority": 102,
            "title_template": "🧘‍♀️ Bienestar y Vínculo",
            "message_template": "👋 Hola! {patient_name}.\n\nTómate 5 minutos. Respira hondo, relájate y dile algo bonito a tu bebé. Él te escucha y siente tu amor.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nConecta con tu bebé.",
            "channel": "dual",
            "send_time": "18:00"
        },
        {
            "notification_type": "prenatal_daily_tip_5",
            "trigger_condition": {"gestation_day_of_week": 5},
            "priority": 103,
            "title_template": "🏃‍♀️ Ejercicio Suave",
            "message_template": "👋 Hola! {patient_name}.\n\nLevántate, estira las piernas y da un pequeño paseo. El movimiento suave alivia la espalda y mejora la circulación.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nTip de movimiento.",
            "channel": "dual",
            "send_time": "11:30"
        },
        {
            "notification_type": "prenatal_daily_tip_6",
            "trigger_condition": {"gestation_day_of_week": 6},
            "priority": 104,
            "title_template": "🛒 Preparación",
            "message_template": "👋 Hola! {patient_name}.\n\nSi vas a hacer compras, incluye espinacas, lentejas o yogur. ¿Ya pensaste qué guardar en la bolsa para el hospital?",
            "message_text_template": "👋 Hola! {patient_name}.\n\nTips de fin de semana.",
            "channel": "dual",
            "send_time": "11:00"
        },
        {
            "notification_type": "prenatal_daily_tip_7",
            "trigger_condition": {"gestation_day_of_week": 7},
            "priority": 105,
            "title_template": "😴 Descanso Profundo",
            "message_template": "👋 Hola! {patient_name}.\n\nHora de descansar mamá. Desconecta de las pantallas y recuerda dormir sobre tu lado izquierdo para ayudar a la circulación.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nConsejo de descanso.",
            "channel": "dual",
            "send_time": "21:30"
        },
        # ===== PRENATAL DAILY ROUTINES (New Rotating System) =====
        # Rotaremos el contenido por día de la semana (1 al 7) en base a su categoría
        {
            "notification_type": "prenatal_weekly_milestone",
            "trigger_condition": {"category": "prenatal_milestone", "gestation_day_of_week": 1},
            "priority": 110,
            "title_template": "👶 Desarrollo del Bebé",
            "message_template": "👋 Hola! {patient_name}.\n\n¡Semana {gestation_week}! Tu bebé sigue creciendo. Descubre los nuevos órganos y sentidos que está desarrollando esta semana.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nSemana {gestation_week}: Descubre el desarrollo de tu bebé.",
            "channel": "dual",
            "send_time": "09:00"
        },
        {
            "notification_type": "prenatal_daily_nutrition_tip",
            "trigger_condition": {"category": "prenatal_tip", "gestation_day_of_week": 2},
            "priority": 111,
            "title_template": "🥗 Tip de Nutrición",
            "message_template": "👋 Hola! {patient_name}.\n\nAsegúrate de incluir hierro y calcio en tu dieta hoy. Las espinacas y los lácteos son tus mejores aliados para el crecimiento fetal.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nTip nutricional del día: Hierro y calcio.",
            "channel": "dual",
            "send_time": "12:00"
        },
        {
            "notification_type": "prenatal_symptom_check",
            "trigger_condition": {"category": "prenatal_symptom_alert", "gestation_day_of_week": 3},
            "priority": 112,
            "title_template": "📋 Bienestar y Síntomas",
            "message_template": "👋 Hola! {patient_name}.\n\n¿Sientes náuseas o cansancio? Es muy común. Registra cómo te sientes hoy en la aplicación para llevar un control seguro.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nRevisión de bienestar y síntomas.",
            "channel": "dual",
            "send_time": "15:00"
        },
        {
            "notification_type": "prenatal_medical_tests_reminder",
            "trigger_condition": {"category": "prenatal_test", "gestation_day_of_week": 4},
            "priority": 113,
            "title_template": "🩺 Estudios Médicos",
            "message_template": "👋 Hola! {patient_name}.\n\nRevisa si tienes laboratorios o pruebas de sangre pendientes para este trimestre. Mantener tus exámenes al día es vital.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nRecordatorio de estudios médicos.",
            "channel": "dual",
            "send_time": "10:00"
        },
        {
            "notification_type": "prenatal_exercise_tip",
            "trigger_condition": {"category": "prenatal_tip", "gestation_day_of_week": 5},
            "priority": 114,
            "title_template": "🧘‍♀️ Movimiento y Salud",
            "message_template": "👋 Hola! {patient_name}.\n\nEl ejercicio suave como caminar o yoga prenatal ayuda a reducir dolores de espalda y mejora la circulación. ¡Muévete un poco hoy!",
            "message_text_template": "👋 Hola! {patient_name}.\n\nTip de movimiento suave.",
            "channel": "dual",
            "send_time": "17:00"
        },
        {
            "notification_type": "prenatal_ultrasound_prep",
            "trigger_condition": {"category": "prenatal_ultrasound", "gestation_day_of_week": 6},
            "priority": 115,
            "title_template": "📸 Preparación Ecografía",
            "message_template": "👋 Hola! {patient_name}.\n\nLas ecografías son ventanas al mundo de tu bebé. Recuerda agendar tus ecos morfológicos en las semanas correspondientes.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nTips sobre tus próximas ecografías.",
            "channel": "dual",
            "send_time": "10:00"
        },
        {
            "notification_type": "prenatal_rest_mindfulness",
            "trigger_condition": {"category": "prenatal_tip", "gestation_day_of_week": 7},
            "priority": 116,
            "title_template": "😴 Descanso y Conexión",
            "message_template": "👋 Hola! {patient_name}.\n\nDomingo de descanso. Tómate un momento en silencio, respira y conéctate con tu bebé. Dormir bien es fundamental.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nDía de descanso y conexión.",
            "channel": "dual",
            "send_time": "20:00"
        },
        {
            "notification_type": "prenatal_daily_supplements",
            "trigger_condition": {"category": "prenatal"},
            "priority": 10,
            "title_template": "💊 Protege a tu bebé",
            "message_template": "👋 Hola! {patient_name}.\n\n¡Buenos días mamá! No olvides tomar tu vitamina prenatal, calcio o ácido fólico. ¡Tu bebé te lo agradece profundamente!",
            "message_text_template": "👋 Hola! {patient_name}.\n\n¡Buenos días mamá! No olvides tomar tu vitamina prenatal, calcio o ácido fólico. ¡Tu bebé te lo agradece profundamente!",
            "channel": "dual",
            "send_time": "09:00"
        },

        # ===== SISTEMA (13 rules) =====
        {
            "notification_type": "system_welcome",
            "trigger_condition": {"event": "user_registered"},
            "priority": 300,
            "title_template": "👋 Bienvenida a la App",
            "message_template": "👋 Hola! {patient_name}.\n\n¡Bienvenida! Completa tu perfil para comenzar.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nBienvenida a la app",
            "channel": "dual",
            "send_time": "08:00"
        },
        {
            "notification_type": "system_profile_incomplete",
            "trigger_condition": {"event": "profile_incomplete"},
            "priority": 301,
            "title_template": "📝 Completa tu Perfil",
            "message_template": "👋 Hola! {patient_name}.\n\nCompleta tu perfil para obtener predicciones más precisas.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nCompleta tu perfil",
            "channel": "dual",
            "send_time": "10:00"
        },
        {
            "notification_type": "system_log_period",
            "trigger_condition": {"event": "period_not_logged"},
            "priority": 302,
            "title_template": "🩸 Registra tu Periodo",
            "message_template": "👋 Hola! {patient_name}.\n\n¿Ya te llegó el periodo? Regístralo para mantener tu calendario actualizado.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nRegistra tu periodo",
            "channel": "dual",
            "send_time": "18:00"
        },
        {
            "notification_type": "system_backup_reminder",
            "trigger_condition": {"event": "backup_needed"},
            "priority": 303,
            "title_template": "💾 Respalda tus Datos",
            "message_template": "👋 Hola! {patient_name}.\n\nCrea un respaldo de tu información para no perderla.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nRespalda tus datos",
            "channel": "dual",
            "send_time": "10:00"
        },
        {
            "notification_type": "system_update_available",
            "trigger_condition": {"event": "app_update"},
            "priority": 304,
            "title_template": "🆕 Actualización Disponible",
            "message_template": "👋 Hola! {patient_name}.\n\nNueva versión disponible con mejoras y nuevas funciones.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nActualización disponible",
            "channel": "dual",
            "send_time": "12:00"
        },
        {
            "notification_type": "system_data_sync",
            "trigger_condition": {"event": "sync_failed"},
            "priority": 305,
            "title_template": "⚠️ Error de Sincronización",
            "message_template": "👋 Hola! {patient_name}.\n\nNo pudimos sincronizar tus datos. Verifica tu conexión.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nError de sincronización",
            "channel": "dual",
            "send_time": "08:00"
        },
        {
            "notification_type": "system_appointment_reminder",
            "trigger_condition": {"event": "appointment_tomorrow"},
            "priority": 306,
            "title_template": "📅 Cita Médica Mañana",
            "message_template": "👋 Hola! {patient_name}.\n\nRecuerda: Tienes cita médica mañana a las {appointment_time}.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nCita médica mañana",
            "channel": "dual",
            "send_time": "19:00"
        },
        {
            "notification_type": "system_medication_reminder",
            "trigger_condition": {"event": "medication_time"},
            "priority": 307,
            "title_template": "💊 Hora de Medicamento",
            "message_template": "👋 Hola! {patient_name}.\n\nHora de tomar tu medicamento: {medication_name}.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nHora de medicamento",
            "channel": "dual",
            "send_time": "08:00"
        },
        {
            "notification_type": "system_annual_checkup",
            "trigger_condition": {"event": "annual_checkup"},
            "priority": 308,
            "title_template": "🩺 Chequeo Anual",
            "message_template": "👋 Hola! {patient_name}.\n\nHa pasado un año desde tu último chequeo ginecológico. Agenda tu cita.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nChequeo anual pendiente",
            "channel": "dual",
            "send_time": "09:00"
        },
        {
            "notification_type": "system_pap_smear",
            "trigger_condition": {"event": "pap_smear_due"},
            "priority": 309,
            "title_template": "🔬 Papanicolaou Pendiente",
            "message_template": "👋 Hola! {patient_name}.\n\nEs momento de tu Papanicolaou anual. Agenda tu cita.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nPapanicolaou pendiente",
            "channel": "dual",
            "send_time": "09:00"
        },
        {
            "notification_type": "system_mammogram",
            "trigger_condition": {"event": "mammogram_due"},
            "priority": 310,
            "title_template": "🩻 Mamografía Pendiente",
            "message_template": "👋 Hola! {patient_name}.\n\nSegún tu edad, es recomendable realizar una mamografía.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nMamografía recomendada",
            "channel": "dual",
            "send_time": "09:00"
        },
        {
            "notification_type": "system_privacy_update",
            "trigger_condition": {"event": "privacy_policy_update"},
            "priority": 311,
            "title_template": "🔒 Actualización de Privacidad",
            "message_template": "👋 Hola! {patient_name}.\n\nHemos actualizado nuestra política de privacidad.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nPolítica de privacidad actualizada",
            "channel": "dual",
            "send_time": "10:00"
        },
        {
            "notification_type": "system_inactive_user",
            "trigger_condition": {"event": "inactive_30_days"},
            "priority": 312,
            "title_template": "👋 Te Extrañamos",
            "message_template": "👋 Hola! {patient_name}.\n\nHace un mes que no usas la app. ¿Todo bien? Estamos aquí para ayudarte.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nTe extrañamos",
            "channel": "dual",
            "send_time": "10:00"
        },

        # ===== CONTRACEPTIVE (4 rules) =====
        {
            "notification_type": "contraceptive_daily",
            "trigger_condition": {"type": "contraceptive", "subtype": "active_pill"},
            "priority": 10,
            "title_template": "💊 Recordatorio Anticonceptivo",
            "message_template": "👋 Hola! {patient_name}.\n\nHola {patient_name}, es hora de tomar tu pastilla anticonceptiva.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nEs hora de tomar tu pastilla anticonceptiva.",
            "channel": "dual",
            "send_time": "08:00"
        },
        {
            "notification_type": "contraceptive_rest_start",
            "trigger_condition": {"type": "contraceptive", "subtype": "placebo"},
            "priority": 11,
            "title_template": "💊 Inicio de Descanso",
            "message_template": "👋 Hola! {patient_name}.\n\nHoy comienzas tus días de descanso o placebo.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nHoy comienzas tus días de descanso.",
            "channel": "dual",
            "send_time": "08:00"
        },
        {
            "notification_type": "contraceptive_rest_end",
            "trigger_condition": {"type": "contraceptive", "subtype": "new_pack"},
            "priority": 12,
            "title_template": "📅 Fin de Descanso",
            "message_template": "👋 Hola! {patient_name}.\n\nTu periodo de descanso termina hoy. Mañana inicia un nuevo envase.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nTu periodo de descanso termina hoy.",
            "channel": "dual",
            "send_time": "08:00"
        },
        {
            "notification_type": "contraceptive_missed",
            "trigger_condition": {"event": "pill_missed"},
            "priority": 5,
            "title_template": "⚠️ Pastilla Olvidada",
            "message_template": "👋 Hola! {patient_name}.\n\nParece que olvidaste registrar tu pastilla. ¡Tómala lo antes posible!",
            "message_text_template": "👋 Hola! {patient_name}.\n\nParece que olvidaste registrar tu pastilla.",
            "channel": "dual",
            "send_time": "20:00"
        },
        # ===== DOCTOR ADMINISTRATIVE (Asistente Virtual) (6 rules) =====
        {
            "notification_type": "doctor_daily_agenda",
            "trigger_condition": {"role": "doctor"},
            "priority": 50,
            "title_template": "🌅 Resumen Matutino",
            "message_template": "👋 Hola! {patient_name}.\n\n¡Buenos días, Dra! Hoy tienes {appointment_count} citas programadas. La primera es a las {first_appointment_time}.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nResumen Matutino: {appointment_count} citas hoy.",
            "channel": "dual",
            "send_time": "07:30"
        },
        {
            "notification_type": "doctor_pending_stories",
            "trigger_condition": {"role": "doctor"},
            "priority": 51,
            "title_template": "📝 Historias Pendientes",
            "message_template": "👋 Hola! {patient_name}.\n\nTienes {pending_count} historias clínicas del día de hoy esperando por tus notas finales.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nRecordatorio: {pending_count} historias pendientes.",
            "channel": "dual",
            "send_time": "20:00"
        },
        {
            "notification_type": "doctor_low_agenda",
            "trigger_condition": {"role": "doctor"},
            "priority": 52,
            "title_template": "⚠️ Alerta de Agenda",
            "message_template": "👋 Hola! {patient_name}.\n\nTu agenda de la próxima semana está al {occupancy_percent}%. ¿Deseas enviar recordatorios de chequeo anual?",
            "message_text_template": "👋 Hola! {patient_name}.\n\nBaja ocupación próxima semana ({occupancy_percent}%).",
            "channel": "dual",
            "send_time": "17:00"
        },
        {
            "notification_type": "doctor_new_appointment",
            "trigger_condition": {"role": "doctor", "event": "new_appointment"},
            "priority": 53,
            "title_template": "📅 Nueva Cita Agendada",
            "message_template": "👋 Hola! {patient_name}.\n\nHola {doctor_name}, tienes una nueva cita de {patient_name} para el {appointment_date}.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nNueva cita de {patient_name} para el {appointment_date}.",
            "channel": "dual",
            "send_time": "08:00"
        },
        {
            "notification_type": "doctor_preconsulta_completed",
            "trigger_condition": {"role": "doctor", "event": "preconsulta_completed"},
            "priority": 54,
            "title_template": "📝 Preconsulta Completada",
            "message_template": """<div style="font-family: sans-serif; max-width: 650px; margin: 0 auto; background-color: #f9fafb; padding: 20px; border-radius: 12px; border: 1px solid #e5e7eb;">
    <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #4F46E5; margin: 0;">Preconsulta Completada</h2>
        <p style="color: #6b7280; margin: 5px 0;">{patient_name} ha completado su formulario de preconsulta</p>
    </div>
    
    <div style="background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <p style="margin-top: 0;"><strong>Cita:</strong> {appointment_date}</p>
        
        <!-- Información Personal -->
        <div style="margin-top: 15px; padding: 15px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
            <h3 style="margin-top:0; color: #1e3a8a; font-size: 15px; text-transform: uppercase;">Información Personal y Médica</h3>
            <div style="color: #374151; font-size: 14px; line-height: 1.5;">
                {summary_personal}
            </div>
        </div>

        <!-- Historia Gineco-Obstétrica -->
        <div style="margin-top: 15px; padding: 15px; background-color: #fdf2f8; border-left: 4px solid #ec4899; border-radius: 4px;">
            <h3 style="margin-top:0; color: #831843; font-size: 15px; text-transform: uppercase;">Historia Gineco-Obstétrica</h3>
            <div style="color: #374151; font-size: 14px; line-height: 1.5;">
                {summary_gineco}
            </div>
        </div>

        <!-- Examen Funcional -->
        <div style="margin-top: 15px; padding: 15px; background-color: #f3f4f6; border-left: 4px solid #4b5563; border-radius: 4px;">
            <h3 style="margin-top:0; color: #1f2937; font-size: 15px; text-transform: uppercase;">Examen Funcional</h3>
            <div style="color: #374151; font-size: 14px; line-height: 1.5;">
                {summary_funcional}
            </div>
        </div>

        <!-- Hábitos -->
        <div style="margin-top: 15px; padding: 15px; background-color: #ecfdf5; border-left: 4px solid #10b981; border-radius: 4px;">
            <h3 style="margin-top:0; color: #064e3b; font-size: 15px; text-transform: uppercase;">Hábitos Psicobiológicos</h3>
            <div style="color: #374151; font-size: 14px; line-height: 1.5;">
                {summary_habitos}
            </div>
        </div>

    </div>

    <div style="text-align: center; margin-top: 30px;">
        <a href="https://gynsys.net/dashboard/consultation" 
           style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
           Ver Dashboard
        </a>
    </div>
</div>""",
            "message_text_template": "{patient_name} ha completado su preconsulta para la cita del {appointment_date}.",
            "channel": "dual",
            "send_time": "08:00"
        },
        {
            "notification_type": "doctor_new_contact_message",
            "trigger_condition": {"role": "doctor", "event": "new_contact_message"},
            "priority": 55,
            "title_template": "📨 Nuevo Mensaje de Contacto",
            "message_template": "👋 Hola! {patient_name}.\n\nHas recibido un nuevo mensaje de {patient_name}: {message_preview}",
            "message_text_template": "👋 Hola! {patient_name}.\n\nNuevo mensaje de contacto de {patient_name}.",
            "channel": "dual",
            "send_time": "08:00"
        },
        {
            "notification_type": "doctor_new_online_consultation",
            "trigger_condition": {"role": "doctor", "event": "new_online_consultation"},
            "priority": 56,
            "title_template": "📹 Nueva Consulta Online",
            "message_template": "👋 Hola! {patient_name}.\n\nHola {doctor_name}, tienes una nueva consulta online con {patient_name} para el {appointment_date}.",
            "message_text_template": "👋 Hola! {patient_name}.\n\nNueva consulta online de {patient_name} para el {appointment_date}.",
            "channel": "dual",
            "send_time": "08:00"
        },
        {
            "notification_type": "doctor_unified_onboarding",
            "trigger_condition": {"role": "doctor", "event": "unified_onboarding"},
            "priority": 57,
            "title_template": "🚀 Onboarding Unificado Finalizado",
            "message_template": "👋 Hola! {patient_name}.\n\nHola {doctor_name}, {patient_name} ha finalizado el onboarding unificado (Cita + Preconsulta).",
            "message_text_template": "👋 Hola! {patient_name}.\n\nOnboarding unificado finalizado por {patient_name}.",
            "channel": "dual",
            "send_time": "08:00"
        },
    ]

    for rule_data in standard_rules:
        rule = NotificationRule(
            tenant_id=tenant_id,
            **rule_data
        )
        db.add(rule)
    
    db.commit()
