from app.db.base import get_db
from app.db.models.notification import PendingNotification
from datetime import datetime

def check_channel():
    db_gen = get_db()
    db = next(db_gen)
    try:
        p = db.query(PendingNotification).filter(PendingNotification.id == 16).first()
        if p:
            print(f"ID: {p.id}")
            print(f"Channel: {p.channel}")
            print(f"Notification Rule ID: {p.notification_rule_id}")
        else:
            print("Notification ID 16 not found.")
    finally:
        try:
            next(db_gen)
        except StopIteration:
            pass

if __name__ == "__main__":
    check_channel()
