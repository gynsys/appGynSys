import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlalchemy import or_
from app.db.base import SessionLocal
from app.db.models.notification import NotificationRule

def check_rules():
    db = SessionLocal()
    try:
        print("--- Checking rules for 'doctor_new_appointment' ---")
        rules = db.query(NotificationRule).filter(
            NotificationRule.notification_type == 'doctor_new_appointment'
        ).all()
        
        if not rules:
            print("No rules found for this type.")
            return

        for r in rules:
            print(f"ID: {r.id} | Tenant: {r.tenant_id} | Type: {r.notification_type}")
            print(f"Title: {r.title_template}")
            print(f"Message: {r.message_template}")
            print(f"Is Edited: {r.is_edited} | Updated At: {r.updated_at}")
            print("-" * 30)
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_rules()
