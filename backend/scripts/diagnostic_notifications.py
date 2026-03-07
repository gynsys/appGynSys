import sys
import os
from datetime import datetime, timedelta

# Avoid path issues
sys.path.append(os.getcwd())

from app.db.base import SessionLocal
from app.db.models.notification import PendingNotification, NotificationLog
from app.services.notifications.base import push_circuit

def check_notifications():
    db = SessionLocal()
    print("=== NOTIFICATION SYSTEM DIAGNOSTIC ===")
    
    # 1. Circuit Breaker State
    print(f"\n[Circuit Breaker]")
    print(f"State: {push_circuit.state.value}")
    print(f"Failures: {push_circuit.failure_count}/{push_circuit.failure_threshold}")
    
    # 2. Total Counts
    pending = db.query(PendingNotification).filter(PendingNotification.status == "pending").count()
    failed = db.query(PendingNotification).filter(PendingNotification.status == "failed").count()
    processing = db.query(PendingNotification).filter(PendingNotification.status == "processing").count()
    
    print(f"\n[Queue Status]")
    print(f"Pending: {pending}")
    print(f"Failed: {failed}")
    print(f"Processing: {processing}")
    
    # 3. Recent Failures (last 24h)
    yesterday = datetime.utcnow() - timedelta(days=1)
    recent_failed = db.query(PendingNotification).filter(
        PendingNotification.status == "failed",
        PendingNotification.updated_at >= yesterday
    ).all()
    
    print(f"\n[Recent Failures (Last 24h): {len(recent_failed)}]")
    for n in recent_failed[:10]:
        print(f"  - ID: {n.id}, Type: {n.notification_type}, Error: {n.error_message[:100]}")
    
    # 4. Recent Logs (successfully sent)
    recent_logs = db.query(NotificationLog).filter(
        NotificationLog.sent_at >= yesterday
    ).order_by(NotificationLog.sent_at.desc()).all()
    
    print(f"\n[Recent Successfully Sent (Last 24h): {len(recent_logs)}]")
    for log in recent_logs[:10]:
        print(f"  - ID: {log.id}, Sent At: {log.sent_at}, Type: {log.notification_type}")
        
    db.close()

if __name__ == "__main__":
    check_notifications()
