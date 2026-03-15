import sys
import os

# Add the directory containing the 'app' folder to sys.path
# If running from backend folder
if os.path.isdir("app"):
    sys.path.append(os.getcwd())
# If running from root folder
elif os.path.isdir("backend/app"):
    sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.db.session import SessionLocal
from app.db.models.doctor import Doctor
from app.db.models.notification import PendingNotification, NotificationLog
from sqlalchemy import func

def check_mariel_notifications():
    db = SessionLocal()
    try:
        # 1. Find Mariel's ID
        mariel = db.query(Doctor).filter(Doctor.nombre_completo.ilike("%Mariel%")).first()
        if not mariel:
            print("MARIEL HERRERA NOT FOUND.")
            return
        
        doctor_id = mariel.id
        print(f"Doctor: {mariel.nombre_completo} (ID: {doctor_id})")
        
        today = date(2026, 3, 14)
        print(f"Checking for date: {today}")
        
        # 2. Check Pending Notifications (Scheduled)
        pending = db.query(PendingNotification).filter(
            PendingNotification.doctor_id == doctor_id,
            func.date(PendingNotification.scheduled_for) == today
        ).all()
        
        print(f"\nFound {len(pending)} PENDING (scheduled) notifications for today:")
        for p in pending:
            print(f"- Type: {p.notification_rule_id}, Subject: {p.subject}, Status: {p.status}, Scheduled: {p.scheduled_for}")

        # 3. Check Notification Log (Sent)
        sent = db.query(NotificationLog).filter(
            NotificationLog.doctor_id == doctor_id,
            func.date(NotificationLog.sent_at) == today
        ).all()
        
        print(f"\nFound {len(sent)} SENT notifications for today:")
        for s in sent:
            print(f"- Type: {s.notification_type}, Title: {s.title_sent}, Status: {s.status}, Sent at: {s.sent_at}")

        # 4. Check system activity for her (appointments today)
        from app.db.models.appointment import Appointment
        apps = db.query(Appointment).filter(
            Appointment.doctor_id == doctor_id,
            func.date(Appointment.appointment_date) == today
        ).all()
        print(f"\nFound {len(apps)} appointments for today:")
        for a in apps:
            print(f"- Patient: {a.patient_name}, Time: {a.appointment_date}, Status: {a.status}")

    except Exception as e:
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    check_mariel_notifications()
