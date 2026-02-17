# app/seeds/notification_rules.py
from sqlalchemy.orm import Session
from app.db.models.notification import NotificationRule

def seed_notification_rules(db: Session, tenant_id: int):
    """
    Seed exactly the 19 standard notification rules for a specific doctor (tenant).
    Wipes existing rules for this tenant first to ensure a clean state.
    """
    # WIPE existing rules for this tenant
    db.query(NotificationRule).filter(NotificationRule.tenant_id == tenant_id).delete()
    db.commit()

    standard_rules = [
        # --- Contraceptive (4) ---
        {
            "notification_type": "contraceptive_daily",
            "trigger_condition": {"type": "contraceptive", "subtype": "active_pill"},
            "priority": 10,
            "title_template": "Píldora Anticonceptiva",
            "message_template": "💊 Es hora de tomar tu píldora diaria {patient_name}.",
            "message_text_template": "Es hora de tu píldora. No olvides registrarla.",
            "channel": "dual",
            "send_time": "21:00"
        },
        {
            "notification_type": "contraceptive_rest_start",
            "trigger_condition": {"type": "contraceptive", "subtype": "placebo"},
            "priority": 11,
            "title_template": "Inicio de Descanso",
            "message_template": "☕ Has iniciado el periodo de descanso/placebo. Tu periodo debería llegar pronto.",
            "message_text_template": "Inicias periodo de descanso.",
            "channel": "dual",
            "send_time": "09:00"
        },
        {
            "notification_type": "contraceptive_rest_end",
            "trigger_condition": {"type": "contraceptive", "subtype": "new_pack"},
            "priority": 12,
            "title_template": "Nuevo Paquete",
            "message_template": "🆕 Hoy debes iniciar un nuevo paquete de anticonceptivos.",
            "message_text_template": "Inicia tu nuevo paquete hoy.",
            "channel": "dual",
            "send_time": "09:00"
        },
        {
            "notification_type": "contraceptive_missed",
            "trigger_condition": {"event": "contraceptive_missed"},
            "priority": 5,
            "title_template": "⚠️ Olvido de Píldora",
            "message_template": "Olvidas registrar tu píldora de ayer. Recuerda tomarla lo antes posible.",
            "message_text_template": "Olvidaste tu píldora. Revisa las instrucciones de uso.",
            "channel": "dual",
            "send_time": "08:30"
        },

        # --- Cycle (6) ---
        {
            "notification_type": "period_prediction",
            "trigger_condition": {"days_before_period": 3},
            "priority": 20,
            "title_template": "Periodo Próximo",
            "message_template": "📅 Tu periodo debería llegar en unos 3 días. Prepárate.",
            "message_text_template": "3 días para tu periodo.",
            "channel": "dual",
            "send_time": "08:00"
        },
        {
            "notification_type": "period_start",
            "trigger_condition": {"cycle_day": 1},
            "priority": 21,
            "title_template": "Inicio de Periodo",
            "message_template": "🩸 Hoy inicia tu periodo según tus predicciones. ¡Regístralo!",
            "message_text_template": "Inicio de periodo. Regístralo en la app.",
            "channel": "dual",
            "send_time": "08:00"
        },
        {
            "notification_type": "period_confirmation_0",
            "trigger_condition": {"event": "period_confirmation", "day_late": 1},
            "priority": 22,
            "title_template": "¿Llegó tu periodo?",
            "message_template": "📅 Según lo previsto, tu periodo inició ayer. ¿Ya lo registraste?",
            "message_text_template": "Confirma el inicio de tu periodo.",
            "channel": "dual",
            "send_time": "09:00"
        },
        {
            "notification_type": "period_confirmation_1",
            "trigger_condition": {"event": "period_confirmation", "day_late": 2},
            "priority": 23,
            "title_template": "Recordatorio de Periodo",
            "message_template": "Tienes 2 días de retraso. No olvides registrar si ya inició.",
            "message_text_template": "Confirma el inicio de tu periodo.",
            "channel": "dual",
            "send_time": "09:00"
        },
        {
            "notification_type": "period_confirmation_2",
            "trigger_condition": {"event": "period_confirmation", "day_late": 3},
            "priority": 24,
            "title_template": "Seguimiento de Ciclo",
            "message_template": "3 días de retraso registrados. ¿Todo bien? Actualiza tu calendario.",
            "message_text_template": "Actualiza tu calendario menstrual.",
            "channel": "dual",
            "send_time": "09:00"
        },
        {
            "notification_type": "period_irregular",
            "trigger_condition": {"event": "period_late", "days": 7},
            "priority": 25,
            "title_template": "Ciclo Irregular",
            "message_template": "Tu periodo tiene un retraso significativo. Considera contactar a tu médico.",
            "message_text_template": "Retraso importante detectado.",
            "channel": "dual",
            "send_time": "10:00"
        },

        # --- Fertility (4) ---
        {
            "notification_type": "fertile_window_start",
            "trigger_condition": {"is_fertile_start": True},
            "priority": 30,
            "title_template": "Ventana Fértil",
            "message_template": "💚 Has iniciado tu periodo fértil. Alta probabilidad de embarazo.",
            "message_text_template": "Inicio de ventana fértil.",
            "channel": "dual",
            "send_time": "08:00"
        },
        {
            "notification_type": "fertility_peak",
            "trigger_condition": {"is_ovulation_day": True},
            "priority": 31,
            "title_template": "Pico de Fertilidad",
            "message_template": "🔥 Hoy es tu día de mayor fertilidad. ¡Aprovecha!",
            "message_text_template": "Pico máximo de fertilidad hoy.",
            "channel": "dual",
            "send_time": "08:00"
        },
        {
            "notification_type": "ovulation_day",
            "trigger_condition": {"is_ovulation_day": True},
            "priority": 32,
            "title_template": "Día de Ovulación",
            "message_template": "🥚 Hoy es tu día estimado de ovulación.",
            "message_text_template": "Día de ovulación detectado.",
            "channel": "dual",
            "send_time": "08:00"
        },
        {
            "notification_type": "fertile_window_end",
            "trigger_condition": {"is_fertile_end": True},
            "priority": 33,
            "title_template": "Fin Ventana Fértil",
            "message_template": "✅ Tu ventana fértil termina hoy.",
            "message_text_template": "Fin del periodo fértil.",
            "channel": "dual",
            "send_time": "08:00"
        },

        # --- Pregnancy (4) ---
        {
            "notification_type": "prenatal_weekly",
            "trigger_condition": {"gestation_week_start": 1, "gestation_week_end": 42},
            "priority": 40,
            "title_template": "Semana {gestation_week} de Embarazo",
            "message_template": "🤰 ¡Felicidades! Has entrado en la semana {gestation_week}. Tu bebé sigue creciendo.",
            "message_text_template": "Semana {gestation_week} de gestación iniciada.",
            "channel": "dual",
            "send_time": "09:00"
        },
        {
            "notification_type": "prenatal_milestone",
            "trigger_condition": {"event": "ultrasound_reminder"},
            "priority": 41,
            "title_template": "Hito Gestacional",
            "message_template": "📸 Es momento de programar o asistir a tu próximo chequeo prenatal.",
            "message_text_template": "Recordatorio de control prenatal.",
            "channel": "dual",
            "send_time": "10:00"
        },
        {
            "notification_type": "prenatal_daily_tip",
            "trigger_condition": {"type": "daily_tip"},
            "priority": 42,
            "title_template": "Tip del Día Prenatal",
            "message_template": "💡 Recomendación para tu bienestar hoy: {tip_content}",
            "message_text_template": "Tienes un nuevo consejo para tu embarazo.",
            "channel": "dual",
            "send_time": "08:30"
        },
        {
            "notification_type": "prenatal_alert",
            "trigger_condition": {"event": "symptom_alert"},
            "priority": 43,
            "title_template": "Alerta de Salud",
            "message_template": "⚠️ Basado en tus síntomas registrados, te sugerimos contactar a tu médico.",
            "message_text_template": "Alerta de síntomas prenatales detectada.",
            "channel": "dual",
            "send_time": "08:00"
        },

        # --- Health (1) ---
        {
            "notification_type": "annual_checkup",
            "trigger_condition": {"event": "annual_checkup"},
            "priority": 50,
            "title_template": "Chequeo Anual",
            "message_template": "🌸 Es hora de tu chequeo ginecológico anual. Agenda tu cita.",
            "message_text_template": "Recordatorio de chequeo anual.",
            "channel": "dual",
            "send_time": "10:00"
        }
    ]

    for rule_data in standard_rules:
        rule = NotificationRule(
            tenant_id=tenant_id,
            **rule_data
        )
        db.add(rule)
    
    db.commit()

# Support for standalone execution if needed (though usually called from seed_notification_rules script)
if __name__ == "__main__":
    import sys
    from app.db.base import SessionLocal
    db = SessionLocal()
    try:
        if len(sys.argv) > 1:
            tenant_id = int(sys.argv[1])
            seed_notification_rules(db, tenant_id)
            print(f"✅ Rules seeded for tenant {tenant_id}")
        else:
            print("❌ Missing tenant_id argument")
    finally:
        db.close()
