from app.db.base import SessionLocal
from app.db.models.notification import PendingNotification
import sys

def check_failed():
    db = SessionLocal()
    try:
        failed = db.query(PendingNotification).filter(PendingNotification.status == 'failed').all()
        print(f"Total Failed: {len(failed)}")
        for f in failed:
            print(f"ID: {f.id}, Rule ID: {f.notification_rule_id}, Recipient ID: {f.recipient_id}, Error: {f.last_error}")
            print("-" * 20)
    finally:
        db.close()

if __name__ == "__main__":
    check_failed()
