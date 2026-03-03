from app.db.base import SessionLocal
from app.db.models.notification import PendingNotification
from sqlalchemy import func, desc

def check_status():
    from app.core.config import settings
    print(f"Connecting to: {settings.DATABASE_URL}")
    db = SessionLocal()
    try:
        stats = db.query(PendingNotification.status, func.count(PendingNotification.id)).group_by(PendingNotification.status).all()
        print(f"Stats: {stats}")
        
        failed = db.query(PendingNotification).filter(PendingNotification.status == 'failed').order_by(desc(PendingNotification.updated_at)).limit(10).all()
        print("\nLast 10 failures:")
        for f in failed:
            detail = f.last_error[:200] if f.last_error else "No error detail"
            print(f"ID: {f.id} | Recipient: {f.recipient_id} | Error: {detail}")
            
        pending = db.query(PendingNotification).filter(PendingNotification.status == 'pending').limit(5).all()
        print("\nExample pending:")
        for p in pending:
            print(f"ID: {p.id} | Scheduled for: {p.scheduled_for}")
            
    finally:
        db.close()

if __name__ == "__main__":
    check_status()
