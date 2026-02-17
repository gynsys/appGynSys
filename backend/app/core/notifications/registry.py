"""
Centralized Notification Registry - "Cerebro de la App"
All logic and default content resides here.
"""

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
    {
        "type": "day_2_symptom_check",
        "category": "menstrual",
        "priority": 101,
        "title": "Día 2 - Chequeo de Dolor",
        "message": "¿Cómo te sientes hoy? Registra dolor, flujo y otros síntomas.",
        "logic": lambda c: is_day(c, 2)
    },
    {
        "type": "day_3_hydration",
        "category": "menstrual",
        "priority": 102,
        "title": "Día 3 - Hidratación",
        "message": "💧 Recuerda beber mucha agua para ayudar con los cólicos.",
        "logic": lambda c: is_day(c, 3)
    },
    {
        "type": "day_4_mood_track",
        "category": "menstrual",
        "priority": 103,
        "title": "Día 4 - Estado de Ánimo",
        "message": "¿Cómo está tu ánimo hoy? Registra tus emociones.",
        "logic": lambda c: is_day(c, 4)
    },
    {
        "type": "day_5_flow_decrease",
        "category": "menstrual",
        "priority": 104,
        "title": "Día 5 - Fin de Chequeo",
        "message": "Tu flujo debería estar disminuyendo. ¿Cómo va tu periodo?",
        "logic": lambda c: is_day(c, 5)
    },
    {
        "type": "day_6_energy_boost",
        "category": "menstrual",
        "priority": 105,
        "title": "Día 6 - Energía en Aumento",
        "message": "✨ Tu energía debería aumentar. Buen momento para ejercitarte.",
        "logic": lambda c: is_day(c, 6)
    },
    {
        "type": "day_7_period_end",
        "category": "menstrual",
        "priority": 106,
        "title": "Día 7 - Fin de Periodo",
        "message": "Tu periodo debería estar terminando. ¡Inicia una nueva fase!",
        "logic": lambda c: is_day(c, 7)
    },
    {
        "type": "day_8_skin_care",
        "category": "menstrual",
        "priority": 107,
        "title": "Día 8 - Piel Radiante",
        "message": "🌸 Tu piel está en su mejor momento. Cuídala bien.",
        "logic": lambda c: is_day(c, 8)
    },
    {
        "type": "day_9_fertile_approaching",
        "category": "menstrual",
        "priority": 108,
        "title": "Día 9 - Ventana Fértil Cerca",
        "message": "❤️ Se aproxima tu ventana fértil. Estate atenta.",
        "logic": lambda c: is_day(c, 9)
    },
    {
        "type": "day_10_fertile_start",
        "category": "menstrual",
        "priority": 109,
        "title": "Día 10 - Ventana Fértil",
        "message": "❤️‍🔥 Inicia tu ventana fértil. Alta probabilidad de concepción.",
        "logic": lambda c: is_day(c, 10)
    },
    {
        "type": "day_11_high_fertility",
        "category": "menstrual",
        "priority": 110,
        "title": "Día 11 - Fertilidad Alta",
        "message": "🔥 Fertilidad muy alta. Momento ideal para concebir.",
        "logic": lambda c: is_day(c, 11)
    },
    {
        "type": "day_12_peak_fertility",
        "category": "menstrual",
        "priority": 111,
        "title": "Día 12 - Pico de Fertilidad",
        "message": "🔥🔥 Pico máximo de fertilidad. Mayor probabilidad de embarazo.",
        "logic": lambda c: is_day(c, 12)
    },
    {
        "type": "day_13_ovulation",
        "category": "menstrual",
        "priority": 112,
        "title": "Día 13 - Posible Ovulación",
        "message": "🥚 Probable día de ovulación. Registra síntomas.",
        "logic": lambda c: is_day(c, 13)
    },
    {
        "type": "day_14_ovulation_peak",
        "category": "menstrual",
        "priority": 113,
        "title": "Día 14 - Ovulación",
        "message": "🥚 Día típico de ovulación (ciclo 28 días).",
        "logic": lambda c: is_day(c, 14)
    },
    {
        "type": "day_15_fertile_end",
        "category": "menstrual",
        "priority": 114,
        "title": "Día 15 - Fin Ventana Fértil",
        "message": "✅ Termina tu ventana fértil.",
        "logic": lambda c: is_day(c, 15)
    },
    {
        "type": "day_16_implantation_window",
        "category": "menstrual",
        "priority": 115,
        "title": "Día 16 - Posible Implantación",
        "message": "Si hubo concepción, puede iniciar la implantación.",
        "logic": lambda c: is_day(c, 16)
    },
    {
        "type": "day_17_mood_watch",
        "category": "menstrual",
        "priority": 116,
        "title": "Día 17 - Observa tu Humos",
        "message": "Entras en fase lútea. Observa cambios en tu humor.",
        "logic": lambda c: is_day(c, 17)
    },
    {
        "type": "day_18_exercise_tip",
        "category": "menstrual",
        "priority": 117,
        "title": "Día 18 - Ejercicio Suave",
        "message": "Buen momento para yoga o caminatas tranquilas.",
        "logic": lambda c: is_day(c, 18)
    },
    {
        "type": "day_19_metabolism_alert",
        "category": "menstrual",
        "priority": 118,
        "title": "Día 19 - Metabolismo",
        "message": "Tu metabolismo aumenta. Puedes sentir más hambre.",
        "logic": lambda c: is_day(c, 19)
    },
    {
        "type": "day_20_rest_importance",
        "category": "menstrual",
        "priority": 119,
        "title": "Día 20 - Descanso",
        "message": "Prioriza el sueño. Tu cuerpo se prepara para el fin del ciclo.",
        "logic": lambda c: is_day(c, 20)
    },
    {
        "type": "day_21_cycle_summary",
        "category": "menstrual",
        "priority": 120,
        "title": "Día 21 - Resumen de Ciclo",
        "message": "Has tenido un ciclo regular. Revisa tus registros mensuales.",
        "logic": lambda c: is_day(c, 21)
    },
    {
        "type": "day_22_pms_start",
        "category": "menstrual",
        "priority": 121,
        "title": "Día 22 - Posible SPM",
        "message": "💙 Pueden iniciar síntomas premenstruales. Cuídate.",
        "logic": lambda c: is_day(c, 22)
    },
    {
        "type": "day_23_bloating_check",
        "category": "menstrual",
        "priority": 122,
        "title": "Día 23 - Hinchazón",
        "message": "¿Te sientes hinchada? Es normal en esta fase.",
        "logic": lambda c: is_day(c, 23)
    },
    {
        "type": "day_24_mood_changes",
        "category": "menstrual",
        "priority": 123,
        "title": "Día 24 - Cambios de Ánimo",
        "message": "Registra tu estado de ánimo y síntomas emocionales.",
        "logic": lambda c: is_day(c, 24)
    },
    {
        "type": "day_25_breast_tenderness",
        "category": "menstrual",
        "priority": 124,
        "title": "Día 25 - Sensibilidad Mamaria",
        "message": "¿Sensibilidad o dolor en los senos? Registra tus síntomas.",
        "logic": lambda c: is_day(c, 25)
    },
    {
        "type": "day_26_period_preparation",
        "category": "menstrual",
        "priority": 125,
        "title": "Día 26 - Preparación",
        "message": "Tu periodo debería llegar en 2-3 días. Prepárate.",
        "logic": lambda c: is_day(c, 26)
    },
    {
        "type": "day_27_cramps_alert",
        "category": "menstrual",
        "priority": 126,
        "title": "Día 27 - Posibles Cólicos",
        "message": "Pueden iniciar cólicos premenstruales.",
        "logic": lambda c: is_day(c, 27)
    },
    {
        "type": "day_28_period_tomorrow",
        "category": "menstrual",
        "priority": 127,
        "title": "Día 28 - Periodo Mañana",
        "message": "📅 Tu periodo debería llegar mañana. ¿Ya llegó?",
        "logic": lambda c: is_day(c, 28)
    },
    {
        "type": "period_late_1_day",
        "category": "menstrual",
        "priority": 128,
        "title": "1 Día de Retraso",
        "message": "📅 Tu periodo tiene 1 día de retraso. ¿Ya llegó?",
        "logic": lambda c: c.get("event") == "period_late" and c.get("days") == 1
    },

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
    {
        "type": "prenatal_first_ultrasound",
        "category": "prenatal",
        "priority": 250,
        "title": "📸 Primera Ecografía",
        "message": "Agenda tu primera ecografía (entre semanas 6-8).",
        "logic": lambda c: has_event(c, "first_ultrasound")
    },
    # ... I will condense the rest to save space but keeping the logic robust ...
    {
        "type": "prenatal_genetic_test", "category": "prenatal", "priority": 251,
        "title": "🧬 Test Genético", "message": "Considera realizar pruebas genéticas (NIPT) entre semanas 10-13.",
        "logic": lambda c: has_event(c, "genetic_test")
    },
    {
        "type": "prenatal_anatomy_scan", "category": "prenatal", "priority": 252,
        "title": "📸 Ecografía Anatómica", "message": "Ecografía anatómica completa (semana 18-22).",
        "logic": lambda c: has_event(c, "anatomy_scan")
    },
    {
        "type": "prenatal_glucose_test", "category": "prenatal", "priority": 253,
        "title": "🍬 Test de Glucosa", "message": "Test de tolerancia a la glucosa (semana 24-28).",
        "logic": lambda c: has_event(c, "glucose_test")
    },
    {
        "type": "prenatal_tdap_vaccine", "category": "prenatal", "priority": 254,
        "title": "💉 Vacuna Tdap", "message": "Vacuna contra tosferina (Tdap) - semana 27-36.",
        "logic": lambda c: has_event(c, "tdap_vaccine")
    },
    {
        "type": "prenatal_group_b_strep", "category": "prenatal", "priority": 255,
        "title": "🦠 Test Estreptococo B", "message": "Test de Estreptococo Grupo B (semana 35-37).",
        "logic": lambda c: has_event(c, "group_b_strep")
    },
    {
        "type": "prenatal_kick_counts", "category": "prenatal", "priority": 256,
        "title": "👶 Conteo de Patadas", "message": "Inicia el conteo diario de movimientos fetales (semana 28+).",
        "logic": lambda c: has_event(c, "kick_counts")
    },
    {
        "type": "prenatal_reduced_movement", "category": "prenatal", "priority": 5,
        "title": "⚠️ Movimientos Reducidos", "message": "Si notas movimientos fetales reducidos, contacta a tu médico inmediatamente.",
        "logic": lambda c: has_event(c, "reduced_movement")
    },
    {
        "type": "prenatal_bleeding", "category": "prenatal", "priority": 1,
        "title": "🚨 Sangrado", "message": "Sangrado durante el embarazo requiere atención médica inmediata.",
        "logic": lambda c: has_event(c, "bleeding_alert")
    },
    {
        "type": "prenatal_severe_headache", "category": "prenatal", "priority": 2,
        "title": "🤕 Dolor de Cabeza Severo", "message": "Dolor de cabeza severo puede ser signo de preeclampsia.",
        "logic": lambda c: has_event(c, "severe_headache")
    },

    # ===== SYSTEM =====
    {
        "type": "system_welcome", "category": "system", "priority": 300,
        "title": "👋 Bienvenida a la App", "message": "¡Bienvenida! Completa tu perfil para comenzar.",
        "logic": lambda c: has_event(c, "user_registered")
    },
    {
        "type": "system_profile_incomplete", "category": "system", "priority": 301,
        "title": "📝 Completa tu Perfil", "message": "Completa tu perfil para obtener predicciones más precisas.",
        "logic": lambda c: has_event(c, "profile_incomplete")
    },
    {
        "type": "system_log_period", "category": "system", "priority": 302,
        "title": "🩸 Registra tu Periodo", "message": "¿Ya te llegó el periodo? Regístralo.",
        "logic": lambda c: has_event(c, "period_not_logged")
    },
    {
        "type": "system_appointment_reminder", "category": "system", "priority": 306,
        "title": "📅 Cita Médica Mañana", "message": "Recuerda: Tienes cita médica mañana a las {appointment_time}.",
        "logic": lambda c: has_event(c, "appointment_tomorrow")
    },
    {
        "type": "system_medication_reminder", "category": "system", "priority": 307,
        "title": "💊 Hora de Medicamento", "message": "Hora de tomar tu medicamento: {medication_name}.",
        "logic": lambda c: has_event(c, "medication_time")
    },
    {
        "type": "system_annual_checkup", "category": "system", "priority": 308,
        "title": "🩺 Chequeo Anual", "message": "Ha pasado un año desde tu último chequeo ginecológico.",
        "logic": lambda c: has_event(c, "annual_checkup")
    },

    # ===== CONTRACEPTIVE =====
    {
        "type": "contraceptive_daily", "category": "contraceptive", "priority": 10,
        "title": "💊 Recordatorio Anticonceptivo", "message": "Hola {patient_name}, es hora de tomar tu pastilla anticonceptiva.",
        "logic": lambda c: c.get("type") == "contraceptive" and c.get("subtype") == "active_pill"
    },
    {
        "type": "contraceptive_rest_start", "category": "contraceptive", "priority": 11,
        "title": "💊 Inicio de Descanso", "message": "Hoy comienzas tus días de descanso o placebo.",
        "logic": lambda c: c.get("type") == "contraceptive" and c.get("subtype") == "placebo"
    }
]

# Simple mapping for quick lookup
NOTIFICATION_MAP = { n["type"]: n for n in NOTIFICATION_REGISTRY }
