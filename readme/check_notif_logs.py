from app.db.base import get_db
from app.db.models.notification import NotificationLog
from sqlalchemy.orm import Session

def check_logs():
    db_gen = get_db()
    db: Session = next(db_gen)
    try:
        print("\n--- ÚLTIMOS LOGS DE NOTIFICACIONES ---")
        logs = db.query(NotificationLog).order_by(NotificationLog.id.desc()).limit(15).all()
        for l in logs:
            print(f"ID: {l.id} | Type: {l.notification_type} | Status: {l.status} | Received: {l.received_at} | Clicked: {l.clicked_at}")
            if l.error_message:
                print(f"   ERROR: {l.error_message}")
    finally:
        try:
            next(db_gen)
        except StopIteration:
            pass

if __name__ == "__main__":
    check_logs()
