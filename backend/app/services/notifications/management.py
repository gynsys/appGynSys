
from sqlalchemy.orm import Session
from app.db.models.notification import NotificationRule
from .doctor_registry import DOCTOR_NOTIFICATION_REGISTRY
from .base import logger

def sync_notification_registry_to_db(db: Session):
    """
    Ensure all notifications in DOCTOR_NOTIFICATION_REGISTRY exist as global rules in the DB.
    Idempotent: only creates missing rules.
    """
    logger.info("Syncing doctor notification registry to database...")
    
    # Get all existing global rules for doctors
    existing_types = {
        r.notification_type for r in db.query(NotificationRule.notification_type).filter(
            NotificationRule.tenant_id.is_(None),
            NotificationRule.notification_type.like("doctor_%")
        ).all()
    }
    
    created_count = 0
    for rule_def in DOCTOR_NOTIFICATION_REGISTRY:
        rtype = rule_def["type"]
        if rtype not in existing_types:
            logger.info(f"Registering new global notification type: {rtype}")
            new_rule = NotificationRule(
                notification_type=rtype,
                tenant_id=None,
                trigger_condition=rule_def.get("trigger_condition", {"role": "doctor"}),
                priority=rule_def.get("priority", 50),
                title_template=rule_def.get("title", rtype.replace("_", " ").title()),
                message_template=rule_def.get("message", ""),
                message_text_template=rule_def.get("message", ""),
                channel="dual",
                send_time="08:00",
                is_active=True
            )
            db.add(new_rule)
            created_count += 1
            existing_types.add(rtype) # Track it to avoid duplicates in loop if registry has issues
        else:
            # Force update specific templates that have changed drastically (like the HTML contact message)
            if rtype == "doctor_new_contact_message":
                existing_rule = db.query(NotificationRule).filter_by(notification_type=rtype, tenant_id=None).first()
                if existing_rule:
                    existing_rule.message_template = rule_def.get("message", existing_rule.message_template)
                    db.add(existing_rule)
                    created_count += 1
    
    if created_count > 0:
        db.commit()
        logger.info(f"Successfully registered or updated {created_count} notification types.")
    else:
        logger.info("Notification registry is already up to date in the database.")
