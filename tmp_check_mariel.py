from app.db.session import SessionLocal
from app.db.models.doctor import Doctor
from app.db.models.appointment import Appointment
from datetime import date, datetime

def check_today_activity():
    db = SessionLocal()
    try:
        # Find Mariel
        mariel = db.query(Doctor).filter(Doctor.nombre_completo.ilike("%Mariel%")).first()
        if not mariel:
            print("Mariel Herrera NOT FOUND in doctors table.")
            return

        print(f"Doctor Found: {mariel.nombre_completo} (ID: {mariel.id}, Email: {mariel.email})")
        
        # Today's date
        today = date(2026, 3, 14)
        print(f"Checking activity for date: {today}")
        
        # Check appointments
        appointments = db.query(Appointment).filter(
            Appointment.doctor_id == mariel.id
        ).all()
        
        print(f"\nTotal appointments for this doctor: {len(appointments)}")
        
        today_appointments = [a for a in appointments if a.appointment_date and a.appointment_date.date() == today]
        
        print(f"Found {len(today_appointments)} appointment(s) for today:")
        for app in today_appointments:
            print(f"- Patient: {app.patient_name}, Status: {app.status}, Time: {app.appointment_date}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_today_activity()
