from app.db.base import SessionLocal
from app.db.models.notification import NotificationRule
import json

def check_rule():
    db = SessionLocal()
    try:
        rule = db.query(NotificationRule).filter(
            NotificationRule.tenant_id == None,
            NotificationRule.notification_type == 'doctor_new_appointment',
            NotificationRule.is_active == True
        ).first()
        
        if not rule:
            print("No global rule found for 'doctor_new_appointment'")
            return
            
        print(f"Rule ID: {rule.id}")
        print(f"Title Template: {rule.title_template}")
        print(f"Text Template: {rule.message_text_template}")
        print(f"HTML Template: {rule.message_template}")
        
    finally:
        db.close()

if __name__ == "__main__":
    check_rule()
