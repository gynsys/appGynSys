import sys
import os
from datetime import timedelta

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.db.base import SessionLocal
from app.services.notifications.health import get_notification_system_health
from app.db.models.notification import PendingNotification, NotificationLog

def check():
    db = SessionLocal()
    try:
        health = get_notification_system_health(db)
        print("\n--- HEALTH METRICS ---")
        for k, v in health.items():
            print(f"{k}: {v}")
            
        print("\n--- DB RAW COUNTS ---")
        counts = db.query(PendingNotification.status).all()
        from collections import Counter
        status_counts = Counter([c[0] for c in counts])
        print(f"PendingNotification Statuses: {dict(status_counts)}")
        
        pending_total = db.query(PendingNotification).count()
        print(f"Total entries in PendingNotification: {pending_total}")
        
    finally:
        db.close()

if __name__ == "__main__":
    check()
