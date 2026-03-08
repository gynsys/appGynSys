import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add app directory to sys.path
sys.path.append(os.getcwd())

from app.core.config import settings
from app.db.models.doctor import Doctor
from app.db.models.cycle_user import CycleUser
from app.db.models.push_subscription import PushSubscription
from app.db.models.notification import NotificationLog, PendingNotification

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def check_user_subscriptions(email):
    db = SessionLocal()
    try:
        print(f"--- Checking for email: {email} ---")
        print(f"VAPID_PUBLIC_KEY: [{settings.VAPID_PUBLIC_KEY}]")
        print(f"VAPID_PRIVATE_KEY: [{settings.VAPID_PRIVATE_KEY}]")
        
        # Check Doctors
        doctor = db.query(Doctor).filter(Doctor.email == email).first()
        if doctor:
            print(f"Found Doctor: ID={doctor.id}, Name={doctor.nombre_completo}")
            subs = db.query(PushSubscription).filter(PushSubscription.doctor_id == doctor.id).all()
            print(f"Push Subscriptions for Doctor: {len(subs)}")
            for s in subs:
                print(f"  - ID: {s.id}, Created: {s.created_at}, Endpoint: {s.endpoint[:50]}...")
            
            # Check Logs
            logs = db.query(NotificationLog).filter(NotificationLog.doctor_id == doctor.id).order_by(NotificationLog.sent_at.desc()).limit(5).all()
            print(f"Recent Notification Logs for Doctor (last 5): {len(logs)}")
            for l in logs:
                print(f"  - Sent at: {l.sent_at}, Type: {l.notification_type}, Channel: {l.channel_used}, Status: {l.status}")

            # Check Pending
            pending = db.query(PendingNotification).filter(PendingNotification.doctor_id == doctor.id).all()
            print(f"Pending Notifications for Doctor: {len(pending)}")
            for p in pending:
                print(f"  - Scheduled: {p.scheduled_for}, Status: {p.status}, Channel: {p.channel}")
        else:
            print("Doctor not found with this email.")

        # Check CycleUsers
        user = db.query(CycleUser).filter(CycleUser.email == email).first()
        if user:
            print(f"Found CycleUser: ID={user.id}, Name={user.nombre_completo}")
            subs = db.query(PushSubscription).filter(PushSubscription.user_id == user.id).all()
            print(f"Push Subscriptions for CycleUser: {len(subs)}")
            for s in subs:
                print(f"  - ID: {s.id}, Created: {s.created_at}, Endpoint: {s.endpoint[:50]}...")
            
            # Check Logs
            logs = db.query(NotificationLog).filter(NotificationLog.recipient_id == user.id).order_by(NotificationLog.sent_at.desc()).limit(5).all()
            print(f"Recent Notification Logs (last 5): {len(logs)}")
            for l in logs:
                print(f"  - Sent at: {l.sent_at}, Type: {l.notification_type}, Channel: {l.channel_used}, Status: {l.status}")

            # Check Pending
            pending = db.query(PendingNotification).filter(PendingNotification.recipient_id == user.id).all()
            print(f"Pending Notifications: {len(pending)}")
            for p in pending:
                print(f"  - Scheduled: {p.scheduled_for}, Type: {p.status}, Channel: {p.channel}")
        else:
            print("CycleUser not found with this email.")

    finally:
        db.close()

if __name__ == "__main__":
    email = sys.argv[1] if len(sys.argv) > 1 else "dramarielh@gmail.com"
    check_user_subscriptions(email)
