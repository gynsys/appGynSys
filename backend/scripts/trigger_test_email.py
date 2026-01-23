
import sys
import os
import json
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add parent dir to path to import app modules
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.db.base import Base, SessionLocal
from app.db.models.appointment import Appointment
from app.db.models.doctor import Doctor
from app.tasks.email_tasks import send_preconsulta_completed_notification

def trigger_email(patient_name_query):
    db = SessionLocal()
    try:
        # searching with ILIKE for case-insensitive match
        # We need a raw sql or filter
        print(f"Searching for patient: {patient_name_query}...")
        
        # Simple fuzzy search on python side if needed, or exact match
        appointments = db.query(Appointment).filter(Appointment.patient_name.ilike(f"%{patient_name_query}%")).all()
        
        if not appointments:
            print(f"No appointment found for patient matching '{patient_name_query}'")
            return

        # Pick the most recent one with answers
        target_appt = None
        for appt in sorted(appointments, key=lambda x: x.id, reverse=True):
            if appt.preconsulta_answers:
                target_appt = appt
                break
        
        if not target_appt:
            print("Found appointments but none satisfy 'preconsulta_answers' present.")
            return

        print(f"Found Appointment ID: {target_appt.id}, Patient: {target_appt.patient_name}")
        
        doctor = db.query(Doctor).filter(Doctor.id == target_appt.doctor_id).first()
        if not doctor:
            print("Doctor not found for appointment")
            return

        answers = json.loads(target_appt.preconsulta_answers)
        
        # Manually trigger the task synchronously
        print(f"Sending email to Doctor: {doctor.email} ({doctor.nombre_completo})")
        print(f"Primary Color: {doctor.theme_primary_color}")
        
        date_str = target_appt.appointment_date.strftime("%d/%m/%Y %H:%M") if target_appt.appointment_date else "Fecha por definir"
        
        result = send_preconsulta_completed_notification(
            doctor_email=doctor.email,
            doctor_name=doctor.nombre_completo,
            patient_name=target_appt.patient_name,
            appointment_date=date_str,
            patient_data=answers,
            primary_color=doctor.theme_primary_color or '#4F46E5'
        )
        
        print("Email task executed. Result:", result)

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) > 1:
        name = sys.argv[1]
    else:
        name = "Kira Vargas"
    trigger_email(name)
