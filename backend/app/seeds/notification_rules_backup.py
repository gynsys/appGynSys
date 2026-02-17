# app/seeds/notification_rules.py
from sqlalchemy.orm import Session
from app.db.models.notification import NotificationRule

def seed_notification_rules(db: Session, tenant_id: int):
    """
    Seed ALL notification rules for a specific doctor (tenant).
    All rules are indexed by notification_type.
    """
    # WIPE existing rules for this tenant to ensure clean state
    db.query(NotificationRule).filter(NotificationRule.tenant_id == tenant_id).delete()
    db.commit()

    standard_rules = [
        # ===== CALCULADORA MENSTRUAL (24 NOTIFICACIONES) =====
        
        # --- Fase de Periodo (Días 1-7) ---
        {
            "notification_type": "day_1_period_start",
            "trigger_condition": {"cycle_day": 1},
            "priority": 100,
            "title_template": "Día 1 - Inicio Periodo",
            "message_template": "🩸 Hoy inicia tu periodo. Registra tu flujo y síntomas para un seguimiento preciso.",
            "message_text_template": "Día 1 - Inicio de tu periodo",
            "channel": "dual",
            "send_time": "08:00"
        },
        {
            "notification_type": "day_2_symptom_check",
            "trigger_condition": {"cycle_day": 2},
            "priority": 101,
            "title_template": "Día 2 - Chequeo de Dolor",
            "message_template": "¿Cómo te sientes hoy? Registra dolor, flujo y otros síntomas.",
            "message_text_template": "Día 2 - ¿Cómo te sientes?",
            "channel": "push",
            "send_time": "09:00"
        },
        {
            "notification_type": "day_3_hydration",
            "trigger_condition": {"cycle_day": 3},
            "priority": 102,
            "title_template": "Día 3 - Hidratación",
            "message_template": "💧 Recuerda beber mucha agua para ayudar con los cólicos.",
            "message_text_template": "Día 3 - Mantente hidratada",
            "channel": "push",
            "send_time": "10:00"
        },
        {
            "notification_type": "day_4_mood_track",
            "trigger_condition": {"cycle_day": 4},
            "priority": 103,
            "title_template": "Día 4 - Estado de Ánimo",
            "message_template": "¿Cómo está tu ánimo hoy? Registra tus emociones.",
            "message_text_template": "Día 4 - Registro de ánimo",
            "channel": "push",
            "send_time": "11:00"
        },
        {
            "notification_type": "day_5_flow_decrease",
            "trigger_condition": {"cycle_day": 5},
            "priority": 104,
            "title_template": "Día 5 - Fin de Chequeo",
            "message_template": "Tu flujo debería estar disminuyendo. ¿Cómo va tu periodo?",
            "message_text_template": "Día 5 - Chequeo de flujo",
            "channel": "push",
            "send_time": "08:30"
        },
        
        # --- Fase Folicular (Días 6-13) ---
        {
            "notification_type": "day_6_energy_boost",
            "trigger_condition": {"cycle_day": 6},
            "priority": 105,
            "title_template": "Día 6 - Energía en Aumento",
            "message_template": "✨ Tu energía debería aumentar. Buen momento para ejercitarte.",
            "message_text_template": "Día 6 - Momento de ejercicio",
            "channel": "push",
            "send_time": "07:00"
        },
        {
            "notification_type": "day_7_period_end",
            "trigger_condition": {"cycle_day": 7},
            "priority": 106,
            "title_template": "Día 7 - Fin de Periodo",
            "message_template": "Tu periodo debería estar terminando. ¡Inicia una nueva fase!",
            "message_text_template": "Día 7 - Fin del periodo",
            "channel": "push",
            "send_time": "08:00"
        },
        {
            "notification_type": "day_8_skin_care",
            "trigger_condition": {"cycle_day": 8},
            "priority": 107,
            "title_template": "Día 8 - Piel Radiante",
            "message_template": "🌸 Tu piel está en su mejor momento. Cuídala bien.",
            "message_text_template": "Día 8 - Cuida tu piel",
            "channel": "push",
            "send_time": "09:00"
        },
        {
            "notification_type": "day_9_fertile_approaching",
            "trigger_condition": {"cycle_day": 9},
            "priority": 108,
            "title_template": "Día 9 - Ventana Fértil Cerca",
            "message_template": "❤️ Se aproxima tu ventana fértil. Estate atenta.",
            "message_text_template": "Día 9 - Fertilidad próxima",
            "channel": "dual",
            "send_time": "08:00"
        },
        {
            "notification_type": "day_10_fertile_start",
            "trigger_condition": {"cycle_day": 10},
            "priority": 109,
            "title_template": "Día 10 - Ventana Fértil",
            "message_template": "❤️‍🔥 Inicia tu ventana fértil. Alta probabilidad de concepción.",
            "message_text_template": "Día 10 - Ventana fértil inicia",
            "channel": "dual",
            "send_time": "08:00"
        },
        {
            "notification_type": "day_11_high_fertility",
            "trigger_condition": {"cycle_day": 11},
            "priority": 110,
            "title_template": "Día 11 - Fertilidad Alta",
            "message_template": "🔥 Fertilidad muy alta. Momento ideal para concebir.",
            "message_text_template": "Día 11 - Alta fertilidad",
            "channel": "dual",
            "send_time": "08:00"
        },
        {
            "notification_type": "day_12_peak_fertility",
            "trigger_condition": {"cycle_day": 12},
            "priority": 111,
            "title_template": "Día 12 - Pico de Fertilidad",
            "message_template": "🔥🔥 Pico máximo de fertilidad. Mayor probabilidad de embarazo.",
            "message_text_template": "Día 12 - Pico de fertilidad",
            "channel": "dual",
            "send_time": "08:00"
        },
        {
            "notification_type": "day_13_ovulation",
            "trigger_condition": {"cycle_day": 13},
            "priority": 112,
            "title_template": "Día 13 - Posible Ovulación",
            "message_template": "🥚 Probable día de ovulación. Registra síntomas.",
            "message_text_template": "Día 13 - Ovulación probable",
            "channel": "dual",
            "send_time": "08:00"
        },
        {
            "notification_type": "day_14_ovulation_peak",
            "trigger_condition": {"cycle_day": 14},
            "priority": 113,
            "title_template": "Día 14 - Ovulación",
            "message_template": "🥚 Día típico de ovulación (ciclo 28 días).",
            "message_text_template": "Día 14 - Ovulación",
            "channel": "dual",
            "send_time": "08:00"
        },
        
        # --- Fase Lútea (Días 15-28) ---
        {
            "notification_type": "day_15_fertile_end",
            "trigger_condition": {"cycle_day": 15},
            "priority": 114,
            "title_template": "Día 15 - Fin Ventana Fértil",
            "message_template": "✅ Termina tu ventana fértil.",
            "message_text_template": "Día 15 - Fin de fertilidad",
            "channel": "push",
            "send_time": "08:00"
        },
        {
            "notification_type": "day_16_implantation_window",
            "trigger_condition": {"cycle_day": 16},
            "priority": 115,
            "title_template": "Día 16 - Posible Implantación",
            "message_template": "Si hubo concepción, puede iniciar la implantación.",
            "message_text_template": "Día 16 - Ventana de implantación",
            "channel": "push",
            "send_time": "09:00"
        },
        {
            "notification_type": "day_21_progesterone_peak",
            "trigger_condition": {"cycle_day": 21},
            "priority": 116,
            "title_template": "Día 21 - Pico de Progesterona",
            "message_template": "Niveles altos de progesterona. Puedes sentirte más cansada.",
            "message_text_template": "Día 21 - Pico hormonal",
            "channel": "push",
            "send_time": "10:00"
        },
        {
            "notification_type": "day_22_pms_start",
            "trigger_condition": {"cycle_day": 22},
            "priority": 117,
            "title_template": "Día 22 - Posible SPM",
            "message_template": "💙 Pueden iniciar síntomas premenstruales. Cuídate.",
            "message_text_template": "Día 22 - Posible SPM",
            "channel": "push",
            "send_time": "09:00"
        },
        {
            "notification_type": "day_24_mood_changes",
            "trigger_condition": {"cycle_day": 24},
            "priority": 118,
            "title_template": "Día 24 - Cambios de Ánimo",
            "message_template": "Registra tu estado de ánimo y síntomas emocionales.",
            "message_text_template": "Día 24 - Registro emocional",
            "channel": "push",
            "send_time": "11:00"
        },
        {
            "notification_type": "day_25_breast_tenderness",
            "trigger_condition": {"cycle_day": 25},
            "priority": 119,
            "title_template": "Día 25 - Sensibilidad Mamaria",
            "message_template": "¿Sensibilidad o dolor en los senos? Registra tus síntomas.",
            "message_text_template": "Día 25 - Chequeo de síntomas",
            "channel": "push",
            "send_time": "10:00"
        },
        {
            "notification_type": "day_26_period_preparation",
            "trigger_condition": {"cycle_day": 26},
            "priority": 120,
            "title_template": "Día 26 - Preparación",
            "message_template": "Tu periodo debería llegar en 2-3 días. Prepárate.",
            "message_text_template": "Día 26 - Periodo próximo",
            "channel": "dual",
            "send_time": "08:00"
        },
        {
            "notification_type": "day_27_cramps_alert",
            "trigger_condition": {"cycle_day": 27},
            "priority": 121,
            "title_template": "Día 27 - Posibles Cólicos",
            "message_template": "Pueden iniciar cólicos premenstruales.",
            "message_text_template": "Día 27 - Alerta de cólicos",
            "channel": "push",
            "send_time": "09:00"
        },
        {
            "notification_type": "day_28_period_tomorrow",
            "trigger_condition": {"cycle_day": 28},
            "priority": 122,
            "title_template": "Día 28 - Periodo Mañana",
            "message_template": "📅 Tu periodo debería llegar mañana. ¿Ya llegó?",
            "message_text_template": "Día 28 - Periodo por llegar",
            "channel": "dual",
            "send_time": "18:00"
        },
        {
            "notification_type": "period_late_1_day",
            "trigger_condition": {"event": "period_late", "days": 1},
            "priority": 123,
            "title_template": "1 Día de Retraso",
            "message_template": "📅 Tu periodo tiene 1 día de retraso. ¿Ya llegó?",
            "message_text_template": "1 día de retraso",
            "channel": "dual",
            "send_time": "09:00"
        },
        
        # ===== PRENATAL (46 NOTIFICACIONES) =====
        
        # Semanas 1-10 (Primer Trimestre)
        {
            "notification_type": "prenatal_week_1",
            "trigger_condition": {"gestation_week": 1},
            "priority": 200,
            "title_template": "Semana 1 - Inicio del Embarazo",
            "message_template": "🤱 Semana 1: Se inicia el conteo desde tu último periodo.",
            "message_text_template": "Semana 1 del embarazo",
            "channel": "dual",
            "send_time": "09:00"
        },
        {
            "notification_type": "prenatal_week_2",
            "trigger_condition": {"gestation_week": 2},
            "priority": 201,
            "title_template": "Semana 2 - Ovulación",
            "message_template": "Semana 2: Probable concepción esta semana.",
            "message_text_template": "Semana 2 del embarazo",
            "channel": "dual",
            "send_time": "09:00"
        },
        {
            "notification_type": "prenatal_week_3",
            "trigger_condition": {"gestation_week": 3},
            "priority": 202,
            "title_template": "Semana 3 - Fertilización",
            "message_template": "👶 Semana 3: El óvulo fertilizado viaja al útero.",
            "message_text_template": "Semana 3 del embarazo",
            "channel": "dual",
            "send_time": "09:00"
        },
        {
            "notification_type": "prenatal_week_4",
            "trigger_condition": {"gestation_week": 4},
            "priority": 203,
            "title_template": "Semana 4 - Implantación",
            "message_template": "Semana 4: El embrión se implanta en el útero.",
            "message_text_template": "Semana 4 del embarazo",
            "channel": "dual",
            "send_time": "09:00"
        },
        {
            "notification_type": "prenatal_week_5",
            "trigger_condition": {"gestation_week": 5},
            "priority": 204,
            "title_template": "Semana 5 - Primera Falta",
            "message_template": "Semana 5: Primera falta de periodo. Puedes hacer una prueba de embarazo.",
            "message_text_template": "Semana 5 del embarazo",
            "channel": "dual",
            "send_time": "09:00"
        },
        {
            "notification_type": "prenatal_week_6",
            "trigger_condition": {"gestation_week": 6},
            "priority": 205,
            "title_template": "Semana 6 - Latido Cardíaco",
            "message_template": "💓 Semana 6: El corazón comienza a latir.",
            "message_text_template": "Semana 6 del embarazo",
            "channel": "dual",
            "send_time": "09:00"
        },
        {
            "notification_type": "prenatal_week_7",
            "trigger_condition": {"gestation_week": 7},
            "priority": 206,
            "title_template": "Semana 7 - Desarrollo Cerebral",
            "message_template": "Semana 7: El cerebro se desarrolla rápidamente.",
            "message_text_template": "Semana 7 del embarazo",
            "channel": "dual",
            "send_time": "09:00"
        },
        {
            "notification_type": "prenatal_week_8",
            "trigger_condition": {"gestation_week": 8},
            "priority": 207,
            "title_template": "Semana 8 - Brazos y Piernas",
            "message_template": "Semana 8: Se forman brazos y piernas.",
            "message_text_template": "Semana 8 del embarazo",
            "channel": "dual",
            "send_time": "09:00"
        },
        {
            "notification_type": "prenatal_week_9",
            "trigger_condition": {"gestation_week": 9},
            "priority": 208,
            "title_template": "Semana 9 - Dedos y Rasgos",
            "message_template": "Semana 9: Se forman los dedos y rasgos faciales.",
            "message_text_template": "Semana 9 del embarazo",
            "channel": "dual",
            "send_time": "09:00"
        },
        {
            "notification_type": "prenatal_week_10",
            "trigger_condition": {"gestation_week": 10},
            "priority": 209,
            "title_template": "Semana 10 - Fin de Embrión",
            "message_template": "Semana 10: El embrión ahora es un feto. 🎉",
            "message_text_template": "Semana 10 del embarazo",
            "channel": "dual",
            "send_time": "09:00"
        },
        
        # Continuar con semanas 11-40...
        {
            "notification_type": "prenatal_week_12",
            "trigger_condition": {"gestation_week": 12},
            "priority": 212,
            "title_template": "Semana 12 - Ecografía Genética",
            "message_template": "📸 Semana 12: Momento ideal para ecografía genética.",
            "message_text_template": "Semana 12 - Ecografía sugerida",
            "channel": "dual",
            "send_time": "09:00"
        },
        {
            "notification_type": "prenatal_week_13",
            "trigger_condition": {"gestation_week": 13},
            "priority": 213,
            "title_template": "Semana 13 - Segundo Trimestre",
            "message_template": "🎊 ¡Entraste al segundo trimestre! Disminuyen las náuseas.",
            "message_text_template": "Semana 13 del embarazo",
            "channel": "dual",
            "send_time": "09:00"
        },
        {
            "notification_type": "prenatal_week_16",
            "trigger_condition": {"gestation_week": 16},
            "priority": 216,
            "title_template": "Semana 16 - Sexo del Bebé",
            "message_template": "Semana 16: Ya se puede determinar el sexo en ecografía.",
            "message_text_template": "Semana 16 del embarazo",
            "channel": "dual",
            "send_time": "09:00"
        },
        {
            "notification_type": "prenatal_week_20",
            "trigger_condition": {"gestation_week": 20},
            "priority": 220,
            "title_template": "Semana 20 - Ecografía Morfológica",
            "message_template": "📸 Semana 20: Ecografía morfológica - revisión completa del bebé.",
            "message_text_template": "Semana 20 - Ecografía morfológica",
            "channel": "dual",
            "send_time": "09:00"
        },
        {
            "notification_type": "prenatal_week_24",
            "trigger_condition": {"gestation_week": 24},
            "priority": 224,
            "title_template": "Semana 24 - Viabilidad",
            "message_template": "Semana 24: Si naciera ahora, tendría posibilidades de sobrevivir.",
            "message_text_template": "Semana 24 del embarazo",
            "channel": "dual",
            "send_time": "09:00"
        },
        {
            "notification_type": "prenatal_week_27",
            "trigger_condition": {"gestation_week": 27},
            "priority": 227,
            "title_template": "Semana 27 - Tercer Trimestre",
            "message_template": "🎊 ¡Entraste al tercer trimestre! La recta final.",
            "message_text_template": "Semana 27 del embarazo",
            "channel": "dual",
            "send_time": "09:00"
        },
        {
            "notification_type": "prenatal_week_28",
            "trigger_condition": {"gestation_week": 28},
            "priority": 228,
            "title_template": "Semana 28 - Test de Glucosa",
            "message_template": "🩸 Semana 28: Momento para test de glucosa (diabetes gestacional).",
            "message_text_template": "Semana 28 - Test de glucosa",
            "channel": "dual",
            "send_time": "09:00"
        },
        {
            "notification_type": "prenatal_week_32",
            "trigger_condition": {"gestation_week": 32},
            "priority": 232,
            "title_template": "Semana 32 - Ecografía de Crecimiento",
            "message_template": "📸 Semana 32: Ecografía para verificar crecimiento.",
            "message_text_template": "Semana 32 - Ecografía",
            "channel": "dual",
            "send_time": "09:00"
        },
        {
            "notification_type": "prenatal_week_35",
            "trigger_condition": {"gestation_week": 35},
            "priority": 235,
            "title_template": "Semana 35 - Test Estreptococo",
            "message_template": "🩺 Semana 35: Test de Estreptococo Grupo B.",
            "message_text_template": "Semana 35 - Test estreptococo",
            "channel": "dual",
            "send_time": "09:00"
        },
        {
            "notification_type": "prenatal_week_36",
            "trigger_condition": {"gestation_week": 36},
            "priority": 236,
            "title_template": "Semana 36 - Bolso del Hospital",
            "message_template": "🎒 Semana 36: Prepara tu bolso para el hospital.",
            "message_text_template": "Semana 36 - Prepara bolso",
            "channel": "dual",
            "send_time": "09:00"
        },
        {
            "notification_type": "prenatal_week_37",
            "trigger_condition": {"gestation_week": 37},
            "priority": 237,
            "title_template": "Semana 37 - Término Temprano",
            "message_template": "🎉 Semana 37: ¡Tu bebé ya es de término! Puede nacer en cualquier momento.",
            "message_text_template": "Semana 37 - Término temprano",
            "channel": "dual",
            "send_time": "09:00"
        },
        {
            "notification_type": "prenatal_week_38",
            "trigger_condition": {"gestation_week": 38},
            "priority": 238,
            "title_template": "Semana 38 - Contracciones",
            "message_template": "Semana 38: Estate atenta a contracciones regulares.",
            "message_text_template": "Semana 38 - Alerta contracciones",
            "channel": "dual",
            "send_time": "09:00"
        },
        {
            "notification_type": "prenatal_week_39",
            "trigger_condition": {"gestation_week": 39},
            "priority": 239,
            "title_template": "Semana 39 - Fecha Probable",
            "message_template": "Semana 39: Muy cerca de la fecha probable de parto.",
            "message_text_template": "Semana 39 del embarazo",
            "channel": "dual",
            "send_time": "09:00"
        },
        {
            "notification_type": "prenatal_week_40",
            "trigger_condition": {"gestation_week": 40},
            "priority": 240,
            "title_template": "Semana 40 - Fecha de Parto",
            "message_template": "🎊 Semana 40: ¡Fecha probable de parto! ¿Ya nació el bebé?",
            "message_text_template": "Semana 40 - Fecha de parto",
            "channel": "dual",
            "send_time": "09:00"
        },
        {
            "notification_type": "prenatal_week_41",
            "trigger_condition": {"gestation_week": 41},
            "priority": 241,
            "title_template": "Semana 41 - Monitoreo Fetal",
            "message_template": "Semana 41: Tu médico puede sugerir inducción del parto.",
            "message_text_template": "Semana 41 - Posible inducción",
            "channel": "dual",
            "send_time": "09:00"
        },
        
        # Hitos y alertas prenatales
        {
            "notification_type": "prenatal_first_ultrasound",
            "trigger_condition": {"event": "first_ultrasound"},
            "priority": 250,
            "title_template": "📸 Primera Ecografía",
            "message_template": "Agenda tu primera ecografía (entre semanas 6-8).",
            "message_text_template": "Primera ecografía sugerida",
            "channel": "email",
            "send_time": "10:00"
        },
        {
            "notification_type": "prenatal_genetic_test",
            "trigger_condition": {"event": "genetic_test"},
            "priority": 251,
            "title_template": "🧬 Test Genético",
            "message_template": "Considera realizar pruebas genéticas (NIPT) entre semanas 10-13.",
            "message_text_template": "Test genético disponible",
            "channel": "email",
            "send_time": "10:00"
        },
        {
            "notification_type": "prenatal_anatomy_scan",
            "trigger_condition": {"event": "anatomy_scan"},
            "priority": 252,
            "title_template": "📸 Ecografía Anatómica",
            "message_template": "Ecografía anatómica completa (semana 18-22).",
            "message_text_template": "Ecografía anatómica",
            "channel": "email",
            "send_time": "10:00"
        },
        {
            "notification_type": "prenatal_glucose_test",
            "trigger_condition": {"event": "glucose_test"},
            "priority": 253,
            "title_template": "🍬 Test de Glucosa",
            "message_template": "Test de tolerancia a la glucosa (semana 24-28).",
            "message_text_template": "Test de glucosa",
            "channel": "dual",
            "send_time": "09:00"
        },
        {
            "notification_type": "prenatal_tdap_vaccine",
            "trigger_condition": {"event": "tdap_vaccine"},
            "priority": 254,
            "title_template": "💉 Vacuna Tdap",
            "message_template": "Vacuna contra tosferina (Tdap) - semana 27-36.",
            "message_text_template": "Vacuna Tdap sugerida",
            "channel": "email",
            "send_time": "10:00"
        },
        {
            "notification_type": "prenatal_group_b_strep",
            "trigger_condition": {"event": "group_b_strep"},
            "priority": 255,
            "title_template": "🦠 Test Estreptococo B",
            "message_template": "Test de Estreptococo Grupo B (semana 35-37).",
            "message_text_template": "Test estreptococo B",
            "channel": "dual",
            "send_time": "09:00"
        },
        {
            "notification_type": "prenatal_kick_counts",
            "trigger_condition": {"event": "kick_counts"},
            "priority": 256,
            "title_template": "👶 Conteo de Patadas",
            "message_template": "Inicia el conteo diario de movimientos fetales (semana 28+).",
            "message_text_template": "Conteo de movimientos",
            "channel": "push",
            "send_time": "19:00"
        },
        {
            "notification_type": "prenatal_reduced_movement",
            "trigger_condition": {"event": "reduced_movement"},
            "priority": 5,
            "title_template": "⚠️ Movimientos Reducidos",
            "message_template": "Si notas movimientos fetales reducidos, contacta a tu médico inmediatamente.",
            "message_text_template": "Alerta: Movimientos reducidos",
            "channel": "dual",
            "send_time": "08:00"
        },
        {
            "notification_type": "prenatal_bleeding",
            "trigger_condition": {"event": "bleeding_alert"},
            "priority": 1,
            "title_template": "🚨 Sangrado",
            "message_template": "Sangrado durante el embarazo requiere atención médica inmediata.",
            "message_text_template": "Alerta: Sangrado",
            "channel": "dual",
            "send_time": "08:00"
        },
        {
            "notification_type": "prenatal_severe_headache",
            "trigger_condition": {"event": "severe_headache"},
            "priority": 2,
            "title_template": "🤕 Dolor de Cabeza Severo",
            "message_template": "Dolor de cabeza severo puede ser signo de preeclampsia. Consulta a tu médico.",
            "message_text_template": "Alerta: Dolor de cabeza",
            "channel": "dual",
            "send_time": "08:00"
        },
        {
            "notification_type": "prenatal_vision_changes",
            "trigger_condition": {"event": "vision_changes"},
            "priority": 3,
            "title_template": "👁️ Cambios en la Visión",
            "message_template": "Cambios en la visión pueden indicar preeclampsia. Contacta a tu médico.",
            "message_text_template": "Alerta: Visión borrosa",
            "channel": "dual",
            "send_time": "08:00"
        },
        {
            "notification_type": "prenatal_contractions",
            "trigger_condition": {"event": "regular_contractions"},
            "priority": 10,
            "title_template": "💪 Contracciones Regulares",
            "message_template": "Contracciones regulares cada 5-10 minutos. Puede ser momento de ir al hospital.",
            "message_text_template": "Contracciones regulares",
            "channel": "dual",
            "send_time": "08:00"
        },
        {
            "notification_type": "prenatal_water_break",
            "trigger_condition": {"event": "water_break"},
            "priority": 5,
            "title_template": "💧 Ruptura de Bolsa",
            "message_template": "Si rompiste bolsa, contacta a tu médico y ve al hospital.",
            "message_text_template": "Alerta: Ruptura de bolsa",
            "channel": "dual",
            "send_time": "08:00"
        },
        {
            "notification_type": "prenatal_swelling",
            "trigger_condition": {"event": "sudden_swelling"},
            "priority": 15,
            "title_template": "🦶 Hinchazón Súbita",
            "message_template": "Hinchazón súbita en manos, cara o piernas puede ser preeclampsia.",
            "message_text_template": "Alerta: Hinchazón",
            "channel": "dual",
            "send_time": "08:00"
        },
        {
            "notification_type": "prenatal_daily_tip",
            "trigger_condition": {"type": "daily_tip"},
            "priority": 100,
            "title_template": "💡 Consejo del Día",
            "message_template": "Tip para la semana {gestation_week}: {tip_content}",
            "message_text_template": "Nuevo consejo prenatal",
            "channel": "push",
            "send_time": "10:00"
        },
        {
            "notification_type": "prenatal_nutrition",
            "trigger_condition": {"type": "nutrition_tip"},
            "priority": 101,
            "title_template": "🥗 Nutrición Prenatal",
            "message_template": "Recuerda consumir ácido fólico, hierro y calcio diariamente.",
            "message_text_template": "Tip de nutrición",
            "channel": "push",
            "send_time": "08:30"
        },
        {
            "notification_type": "prenatal_exercise",
            "trigger_condition": {"type": "exercise_tip"},
            "priority": 102,
            "title_template": "🏃‍♀️ Ejercicio Prenatal",
            "message_template": "El ejercicio moderado es beneficioso. Camina 30 minutos diarios.",
            "message_text_template": "Tip de ejercicio",
            "channel": "push",
            "send_time": "07:00"
        },
        {
            "notification_type": "prenatal_hydration",
            "trigger_condition": {"type": "hydration_reminder"},
            "priority": 103,
            "title_template": "💧 Hidratación",
            "message_template": "Bebe al menos 8 vasos de agua al día durante el embarazo.",
            "message_text_template": "Recuerda hidratarte",
            "channel": "push",
            "send_time": "12:00"
        },
        {
            "notification_type": "prenatal_mental_health",
            "trigger_condition": {"type": "mental_health"},
            "priority": 104,
            "title_template": "🧘‍♀️ Salud Mental",
            "message_template": "Tu salud mental es importante. Practica mindfulness y descansa.",
            "message_text_template": "Cuida tu salud mental",
            "channel": "push",
            "send_time": "20:00"
        },
        {
            "notification_type": "prenatal_sleep",
            "trigger_condition": {"type": "sleep_tip"},
            "priority": 105,
            "title_template": "😴 Descanso",
            "message_template": "Duerme de lado izquierdo para mejorar la circulación.",
            "message_text_template": "Tip de descanso",
            "channel": "push",
            "send_time": "21:00"
        },
        {
            "notification_type": "prenatal_baby_size",
            "trigger_condition": {"type": "baby_size"},
            "priority": 106,
            "title_template": "📏 Tamaño del Bebé",
            "message_template": "Semana {gestation_week}: Tu bebé mide aproximadamente {baby_size}.",
            "message_text_template": "Tamaño del bebé",
            "channel": "dual",
            "send_time": "09:30"
        },
        
        # ===== SISTEMA (10+ NOTIFICACIONES) =====
        {
            "notification_type": "system_welcome",
            "trigger_condition": {"event": "user_registered"},
            "priority": 300,
            "title_template": "👋 Bienvenida a la App",
            "message_template": "¡Bienvenida! Completa tu perfil para comenzar.",
            "message_text_template": "Bienvenida a la app",
            "channel": "email",
            "send_time": "08:00"
        },
        {
            "notification_type": "system_profile_incomplete",
            "trigger_condition": {"event": "profile_incomplete"},
            "priority": 301,
            "title_template": "📝 Completa tu Perfil",
            "message_template": "Completa tu perfil para obtener predicciones más precisas.",
            "message_text_template": "Completa tu perfil",
            "channel": "push",
            "send_time": "10:00"
        },
        {
            "notification_type": "system_log_period",
            "trigger_condition": {"event": "period_not_logged"},
            "priority": 302,
            "title_template": "🩸 Registra tu Periodo",
            "message_template": "¿Ya te llegó el periodo? Regístralo para mantener tu calendario actualizado.",
            "message_text_template": "Registra tu periodo",
            "channel": "push",
            "send_time": "18:00"
        },
        {
            "notification_type": "system_backup_reminder",
            "trigger_condition": {"event": "backup_needed"},
            "priority": 303,
            "title_template": "💾 Respalda tus Datos",
            "message_template": "Crea un respaldo de tu información para no perderla.",
            "message_text_template": "Respalda tus datos",
            "channel": "email",
            "send_time": "10:00"
        },
        {
            "notification_type": "system_update_available",
            "trigger_condition": {"event": "app_update"},
            "priority": 304,
            "title_template": "🆕 Actualización Disponible",
            "message_template": "Nueva versión disponible con mejoras y nuevas funciones.",
            "message_text_template": "Actualización disponible",
            "channel": "push",
            "send_time": "12:00"
        },
        {
            "notification_type": "system_data_sync",
            "trigger_condition": {"event": "sync_failed"},
            "priority": 305,
            "title_template": "⚠️ Error de Sincronización",
            "message_template": "No pudimos sincronizar tus datos. Verifica tu conexión.",
            "message_text_template": "Error de sincronización",
            "channel": "push",
            "send_time": "08:00"
        },
        {
            "notification_type": "system_appointment_reminder",
            "trigger_condition": {"event": "appointment_tomorrow"},
            "priority": 306,
            "title_template": "📅 Cita Médica Mañana",
            "message_template": "Recuerda: Tienes cita médica mañana a las {appointment_time}.",
            "message_text_template": "Cita médica mañana",
            "channel": "dual",
            "send_time": "19:00"
        },
        {
            "notification_type": "system_medication_reminder",
            "trigger_condition": {"event": "medication_time"},
            "priority": 307,
            "title_template": "💊 Hora de Medicamento",
            "message_template": "Hora de tomar tu medicamento: {medication_name}.",
            "message_text_template": "Hora de medicamento",
            "channel": "push",
            "send_time": "08:00"
        },
        {
            "notification_type": "system_annual_checkup",
            "trigger_condition": {"event": "annual_checkup"},
            "priority": 308,
            "title_template": "🩺 Chequeo Anual",
            "message_template": "Ha pasado un año desde tu último chequeo ginecológico. Agenda tu cita.",
            "message_text_template": "Chequeo anual pendiente",
            "channel": "email",
            "send_time": "09:00"
        },
        {
            "notification_type": "system_pap_smear",
            "trigger_condition": {"event": "pap_smear_due"},
            "priority": 309,
            "title_template": "🔬 Papanicolaou Pendiente",
            "message_template": "Es momento de tu Papanicolaou anual. Agenda tu cita.",
            "message_text_template": "Papanicolaou pendiente",
            "channel": "email",
            "send_time": "09:00"
        },
        {
            "notification_type": "system_mammogram",
            "trigger_condition": {"event": "mammogram_due"},
            "priority": 310,
            "title_template": "🩻 Mamografía Pendiente",
            "message_template": "Según tu edad, es recomendable realizar una mamografía.",
            "message_text_template": "Mamografía recomendada",
            "channel": "email",
            "send_time": "09:00"
        },
        {
            "notification_type": "system_privacy_update",
            "trigger_condition": {"event": "privacy_policy_update"},
            "priority": 311,
            "title_template": "🔒 Actualización de Privacidad",
            "message_template": "Hemos actualizado nuestra política de privacidad.",
            "message_text_template": "Política de privacidad actualizada",
            "channel": "email",
            "send_time": "10:00"
        },
        {
            "notification_type": "system_inactive_user",
            "trigger_condition": {"event": "inactive_30_days"},
            "priority": 312,
            "title_template": "👋 Te Extrañamos",
            "message_template": "Hace un mes que no usas la app. ¿Todo bien? Estamos aquí para ayudarte.",
            "message_text_template": "Te extrañamos",
            "channel": "email",
            "send_time": "10:00"
        },
        {
            "notification_type": "contraceptive_daily",
            "trigger_condition": {"type": "contraceptive", "subtype": "active_pill"},
            "priority": 10,
            "title_template": "💊 Recordatorio Anticonceptivo",
            "message_template": "Hola {patient_name}, es hora de tomar tu pastilla anticonceptiva (Día {pill_number}).",
            "message_text_template": "Es hora de tomar tu pastilla anticonceptiva.",
            "channel": "dual",
            "send_time": "08:00"
        },
        {
            "notification_type": "contraceptive_rest_start",
            "trigger_condition": {"type": "contraceptive", "subtype": "placebo", "cycle_day": 22},
            "priority": 11,
            "title_template": "💊 Inicio de Descanso",
            "message_template": "Hoy comienzas tus días de descanso o placebo. Mantén la rutina.",
            "message_text_template": "Hoy comienzas tus días de descanso o placebo.",
            "channel": "dual",
            "send_time": "08:00"
        },
        {
            "notification_type": "contraceptive_rest_end",
            "trigger_condition": {"type": "contraceptive", "subtype": "placebo", "cycle_day": 28},
            "priority": 12,
            "title_template": "📅 Fin de Descanso",
            "message_template": "Tu periodo de descanso termina hoy. Mañana inicia un nuevo envase.",
            "message_text_template": "Tu periodo de descanso termina hoy.",
            "channel": "dual",
            "send_time": "08:00"
        },
        {
            "notification_type": "contraceptive_missed",
            "trigger_condition": {"event": "pill_missed"},
            "priority": 5,
            "title_template": "⚠️ Pastilla Olvidada",
            "message_template": "Parece que olvidaste registrar tu pastilla. ¡Tómala lo antes posible!",
            "message_text_template": "Parece que olvidaste registrar tu pastilla.",
            "channel": "push",
            "send_time": "20:00"
        },
    ]

    for rule_data in standard_rules:
        # Check by notification_type + tenant_id
        exists = db.query(NotificationRule).filter(
            NotificationRule.tenant_id == tenant_id,
            NotificationRule.notification_type == rule_data["notification_type"]
        ).first()
        
        if not exists:
            rule = NotificationRule(
                tenant_id=tenant_id,
                **rule_data
            )
            db.add(rule)
    
    db.commit()


if __name__ == "__main__":
    import sys
    import argparse
    from app.db.base import SessionLocal

    parser = argparse.ArgumentParser(description="Seed notification rules for a tenant.")
    parser.add_argument("tenant_id", type=int, help="ID of the doctor/tenant")
    
    args = parser.parse_args()
    
    db = SessionLocal()
    try:
        print(f"Seeding notification rules for tenant ID: {args.tenant_id}...")
        seed_notification_rules(db, args.tenant_id)
        count = db.query(NotificationRule).filter(NotificationRule.tenant_id == args.tenant_id).count()
        print(f"Success: {count} rules seeded.")
    except Exception as e:
        print(f"Error seeding rules: {e}")
        sys.exit(1)
    finally:
        db.close()
