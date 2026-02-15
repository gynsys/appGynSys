# app/seeds/notification_rules.py
from sqlalchemy.orm import Session
from app.db.models.notification import NotificationRule, NotificationType, NotificationChannel

def seed_notification_rules(db: Session, tenant_id: int):
    """
    Seed the 19 standard notification rules for a specific doctor (tenant).
    """
    standard_rules = [
        # --- RHYTHM METHOD: POST-PERIOD SAFE DAYS (5) ---
        {
            "name": "Método del Ritmo: Día Seguro (Post-periodo 1/5)",
            "notification_type": NotificationType.CYCLE_PHASE,
            "trigger_condition": {"cycle_day": 6},
            "channel": NotificationChannel.DUAL,
            "message_template": "✅ Día Seguro: Te encuentras en tus días no fértiles. ¡Disfruta tu día! (Día 1/5 fase post-periodo)"
        },
        {
            "name": "Método del Ritmo: Día Seguro (Post-periodo 2/5)",
            "notification_type": NotificationType.CYCLE_PHASE,
            "trigger_condition": {"cycle_day": 7},
            "channel": NotificationChannel.DUAL,
            "message_template": "✅ Día Seguro: Continúas en tu fase no fértil. (Día 2/5 fase post-periodo)"
        },
        {
            "name": "Método del Ritmo: Día Seguro (Post-periodo 3/5)",
            "notification_type": NotificationType.CYCLE_PHASE,
            "trigger_condition": {"cycle_day": 8},
            "channel": NotificationChannel.DUAL,
            "message_template": "✅ Día Seguro: Sigues en días de baja probabilidad de embarazo. (Día 3/5 fase post-periodo)"
        },
        {
            "name": "Método del Ritmo: Día Seguro (Post-periodo 4/5)",
            "notification_type": NotificationType.CYCLE_PHASE,
            "trigger_condition": {"cycle_day": 9},
            "channel": NotificationChannel.DUAL,
            "message_template": "✅ Día Seguro: Penúltimo día de tu fase segura post-periodo. (Día 4/5)"
        },
        {
            "name": "Método del Ritmo: Día Seguro (Post-periodo 5/5)",
            "notification_type": NotificationType.CYCLE_PHASE,
            "trigger_condition": {"cycle_day": 10},
            "channel": NotificationChannel.DUAL,
            "message_template": "✅ Día Seguro: Último día de tu fase segura antes de entrar en ventana fértil. (Día 5/5)"
        },

        # --- RHYTHM METHOD: PRE-PERIOD SAFE DAYS (5) ---
        {
            "name": "Método del Ritmo: Día Seguro (Pre-periodo 1/5)",
            "notification_type": NotificationType.CYCLE_PHASE,
            "trigger_condition": {"days_before_period": 5},
            "channel": NotificationChannel.DUAL,
            "message_template": "✅ Día Seguro: Tu ventana fértil ha terminado. Entras en días no fértiles. (Día 1/5 pre-periodo)"
        },
        {
            "name": "Método del Ritmo: Día Seguro (Pre-periodo 2/5)",
            "notification_type": NotificationType.CYCLE_PHASE,
            "trigger_condition": {"days_before_period": 4},
            "channel": NotificationChannel.DUAL,
            "message_template": "✅ Día Seguro: Continúas en fase no fértil. (Día 2/5 pre-periodo)"
        },
        {
            "name": "Método del Ritmo: Día Seguro (Pre-periodo 3/5)",
            "notification_type": NotificationType.CYCLE_PHASE,
            "trigger_condition": {"days_before_period": 3},
            "channel": NotificationChannel.DUAL,
            "message_template": "✅ Día Seguro: Sigues en días de baja probabilidad. ¡Recuerda registrar tus síntomas! (Día 3/5 pre-periodo)"
        },
        {
            "name": "Método del Ritmo: Día Seguro (Pre-periodo 4/5)",
            "notification_type": NotificationType.CYCLE_PHASE,
            "trigger_condition": {"days_before_period": 2},
            "channel": NotificationChannel.DUAL,
            "message_template": "✅ Día Seguro: Fase pre-menstrual. Baja probabilidad de embarazo. (Día 4/5 pre-periodo)"
        },
        {
            "name": "Método del Ritmo: Día Seguro (Pre-periodo 5/5)",
            "notification_type": NotificationType.CYCLE_PHASE,
            "trigger_condition": {"days_before_period": 1},
            "channel": NotificationChannel.DUAL,
            "message_template": "✅ Día Seguro: Tu periodo debería llegar mañana. Sigues en fase no fértil. (Día 5/5 pre-periodo)"
        },

        # --- FERTILE WINDOW & OVULATION (2) ---
        {
            "name": "Inicio de Ventana Fértil",
            "notification_type": NotificationType.CYCLE_PHASE,
            "trigger_condition": {"is_fertile_start": True},
            "channel": NotificationChannel.DUAL,
            "message_template": "❤️ Ventana Fértil: Hoy comienza tu periodo de mayor fertilidad. ¡Tenlo en cuenta!"
        },
        {
            "name": "Día de Ovulación",
            "notification_type": NotificationType.CYCLE_PHASE,
            "trigger_condition": {"is_ovulation_day": True},
            "channel": NotificationChannel.DUAL,
            "message_template": "🥚 Ovulación: Hoy es tu día pico de fertilidad. Momento ideal si buscas concebir."
        },

        # --- CONTRACEPTIVES (3) ---
        {
            "name": "Recordatorio Anticonceptivo (Activa)",
            "notification_type": NotificationType.SYSTEM,
            "trigger_condition": {"type": "contraceptive", "subtype": "active_pill"},
            "channel": NotificationChannel.DUAL,
            "message_template": "💊 Recordatorio: Es hora de tomar tu pastilla anticonceptiva. (Día {pill_number})"
        },
        {
            "name": "Recordatorio Anticonceptivo (Placebo)",
            "notification_type": NotificationType.SYSTEM,
            "trigger_condition": {"type": "contraceptive", "subtype": "placebo"},
            "channel": NotificationChannel.DUAL,
            "message_template": "💊 Recordatorio: Pastilla de descanso (placebo). No olvides mantener la rutina."
        },
        {
            "name": "Inicio de Nuevo Envase",
            "notification_type": NotificationType.SYSTEM,
            "trigger_condition": {"type": "contraceptive", "subtype": "new_pack"},
            "channel": NotificationChannel.DUAL,
            "message_template": "📅 ¡Nuevo Ciclo!: Hoy comienzas un nuevo envase de anticonceptivos. ¡Mantén la constancia!"
        },

        # --- FOLLOW-UP & CHECKS (4) ---
        {
            "name": "¿Llegó tu periodo? (Confirmación 1)",
            "notification_type": NotificationType.CUSTOM,
            "trigger_condition": {"event": "period_confirmation", "day_late": 1},
            "channel": NotificationChannel.DUAL,
            "message_template": "📅 Confirmación: Tu periodo tiene 1 día de retraso según las predicciones. ¿Ha llegado ya? Regístralo en la App."
        },
        {
            "name": "¿Llegó tu periodo? (Confirmación 2)",
            "notification_type": NotificationType.CUSTOM,
            "trigger_condition": {"event": "period_confirmation", "day_late": 3},
            "channel": NotificationChannel.DUAL,
            "message_template": "📅 Seguimiento: Ya son 3 días de retraso. No olvides actualizar tu calendario para mejorar las predicciones."
        },
        {
            "name": "Vigilar Síntomas PMS",
            "notification_type": NotificationType.SYMPTOM_ALERT,
            "trigger_condition": {"days_before_period": 3},
            "channel": NotificationChannel.DUAL,
            "message_template": "💆‍♀️ Autocuidado: Tu periodo se acerca (3 días). Podrías notar síntomas premenstruales. ¡Descansa y mantente hidratada!"
        },
        {
            "name": "Recordatorio de Chequeo Anual",
            "notification_type": NotificationType.SYSTEM,
            "trigger_condition": {"event": "annual_checkup"}, # Logic to be added in processor for this specific event
            "channel": NotificationChannel.DUAL,
            "message_template": "🩺 Salud Femenina: Ha pasado un año desde tu último control o registro. Es un excelente momento para agendar tu chequeo ginecológico anual."
        }
    ]

    for rule_data in standard_rules:
        # Check if rule with same name already exists for this tenant
        exists = db.query(NotificationRule).filter(
            NotificationRule.tenant_id == tenant_id,
            NotificationRule.name == rule_data["name"]
        ).first()
        
        if not exists:
            rule = NotificationRule(
                tenant_id=tenant_id,
                **rule_data
            )
            db.add(rule)
    
    db.commit()
