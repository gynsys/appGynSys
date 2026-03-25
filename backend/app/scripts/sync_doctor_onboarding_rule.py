
from app.db.base import SessionLocal
from app.db.models.notification import NotificationRule
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def sync_rule():
    db = SessionLocal()
    try:
        # Check if rule exists
        rule = db.query(NotificationRule).filter(
            NotificationRule.notification_type == "doctor_unified_onboarding",
            NotificationRule.tenant_id.is_(None)
        ).first()

        if not rule:
            logger.info("Creating missing notification rule: doctor_unified_onboarding")
            new_rule = NotificationRule(
                notification_type="doctor_unified_onboarding",
                tenant_id=None,
                trigger_condition={"role": "doctor", "event": "unified_onboarding"},
                priority=57,
                title_template="🚀 Onboarding Unificado Finalizado",
                message_template="Hola {doctor_name}, {patient_name} ha finalizado el onboarding unificado (Cita + Preconsulta).",
                message_text_template="Onboarding unificado finalizado por {patient_name}.",
                channel="dual",
                send_time="08:00",
                is_active=True
            )
            db.add(new_rule)
            db.commit()
            logger.info("Rule created successfully.")
        else:
            logger.info("Rule doctor_unified_onboarding already exists.")
    finally:
        db.close()

if __name__ == "__main__":
    sync_rule()
