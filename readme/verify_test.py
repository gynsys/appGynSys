from app.db.base import get_db
from app.db.models.notification import PendingNotification
from datetime import datetime
import time

def monitor_notifications():
    print("Iniciando monitoreo de notificaciones (últimas 5)...")
    db_gen = get_db()
    db = next(db_gen)
    try:
        rules = db.query(PendingNotification).order_by(PendingNotification.id.desc()).limit(5).all()
        for r in rules:
            print(f"ID: {r.id} | RuleID: {r.notification_rule_id} | DoctorID: {r.doctor_id} | Status: {r.status} | Created: {r.created_at}")
    finally:
        try:
            next(db_gen)
        except StopIteration:
            pass

if __name__ == "__main__":
    monitor_notifications()
