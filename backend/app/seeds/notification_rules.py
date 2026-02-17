# app/seeds/notification_rules.py
from sqlalchemy.orm import Session
from app.db.models.notification import NotificationRule

def seed_notification_rules(db: Session, tenant_id: int):
    """
    Seed exactly the 19 standard notification rules for a specific doctor (tenant).
    Wipes existing rules for this tenant first.
    """
    # WIPE existing rules for this tenant to ensure clean state
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
