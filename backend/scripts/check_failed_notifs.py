import sys
import os
# Add app directory to sys.path
sys.path.append(os.getcwd())

from app.db.base import SessionLocal
from app.db.models.notification import PendingNotification

def check_failed(doctor_id=None):
    db = SessionLocal()
    try:
        query = db.query(PendingNotification).filter(PendingNotification.status == 'failed')
        if doctor_id:
            query = query.filter(PendingNotification.doctor_id == doctor_id)
        
        failed = query.all()
        print(f"Total Failed for Doctor {doctor_id}: {len(failed)}")
        for f in failed:
            print(f"ID: {f.id}, Rule ID: {f.notification_rule_id}, Scheduled: {f.scheduled_for}")
            print(f"Subject: {f.subject}")
            print(f"Error: {f.last_error}")
            print("-" * 20)
    finally:
        db.close()

if __name__ == "__main__":
    doc_id = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    check_failed(doc_id)
