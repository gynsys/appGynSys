import sys
import os
import json
from dotenv import load_dotenv

# Load .env from backend folder
base_dir = os.path.join(os.getcwd(), 'backend')
load_dotenv(os.path.join(base_dir, '.env'))

sys.path.append(base_dir)

try:
    from app.db.base import SessionLocal
    from app.db.models.notification import NotificationRule
    
    db = SessionLocal()
    rules = db.query(NotificationRule).filter(
        NotificationRule.notification_type.in_(['doctor_new_appointment', 'doctor_new_online_consultation'])
    ).all()
    
    data = []
    for r in rules:
        data.append({
            "id": r.id,
            "tenant_id": r.tenant_id,
            "type": r.notification_type,
            "title": r.title_template,
            "message": r.message_template,
            "is_edited": r.is_edited
        })
    print(json.dumps(data, indent=2))
    db.close()
except Exception as e:
    print(f"Error: {e}")
