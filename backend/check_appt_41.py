import sys
sys.path.append('/app')
from app.db.base import SessionLocal
from app.db.models.appointment import Appointment

db = SessionLocal()
appt = db.query(Appointment).filter(Appointment.id == 41).first()

if appt:
    print(f"✅ Appointment 41 found: {appt.patient_name}")
    if appt.preconsulta_answers:
        print(f"✅ preconsulta_answers length: {len(appt.preconsulta_answers)} characters")
        print(f"First 500 chars:\n{appt.preconsulta_answers[:500]}")
    else:
        print("❌ preconsulta_answers is NULL")
else:
    print("❌ Appointment 41 not found")
