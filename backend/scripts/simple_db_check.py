import sys
import os
sys.path.append(os.getcwd())
from app.db.base import SessionLocal
from app.db.models.push_subscription import PushSubscription
from app.db.models.notification import PendingNotification

def simple_check():
    db = SessionLocal()
    subs_count = db.query(PushSubscription).count()
    pending_count = db.query(PendingNotification).filter(PendingNotification.status == "pending").count()
    failed_count = db.query(PendingNotification).filter(PendingNotification.status == "failed").count()
    
    print(f"Total Subscriptions: {subs_count}")
    print(f"Total Pending: {pending_count}")
    print(f"Total Failed: {failed_count}")
    
    if failed_count > 0:
        last_failed = db.query(PendingNotification).filter(PendingNotification.status == "failed").order_by(PendingNotification.updated_at.desc()).first()
        print(f"Last Failed Error: {last_failed.error_message}")
        
    db.close()

if __name__ == "__main__":
    simple_check()
