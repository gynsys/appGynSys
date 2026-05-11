from app.db.base import SessionLocal
from app.db.models.doctor import Doctor
from app.db.models.scheduled_appointment import ScheduledAppointment
from datetime import datetime, timedelta
import logging

# Disable unnecessary logging
logging.basicConfig(level=logging.INFO)

db = SessionLocal()
doctor = db.query(Doctor).filter(Doctor.slug_url == 'mariel-herrera').first()
if doctor:
    # Create a test appointment for 3 days from now
    target_date = datetime.now() + timedelta(days=3)
    
    # Remove previous tests if any to avoid clutter
    db.query(ScheduledAppointment).filter(
        ScheduledAppointment.patient_ci == "TEST-REMIT-01"
    ).delete()
    
    test_appt = ScheduledAppointment(
        doctor_id=doctor.id,
        patient_name="PACIENTE PRUEBA (SISTEMA)",
        patient_ci="TEST-REMIT-01",
        patient_email=doctor.email, # Send to the doctor for testing
        scheduled_date=target_date,
        interval_type="1_mes",
        notes="ESTA ES UNA PRUEBA TÉCNICA: Verificación de recordatorio automático a 3 días.",
        status="pending"
    )
    db.add(test_appt)
    db.commit()
    print(f"--- PRUEBA INICIADA ---")
    print(f"1. Cita de prueba creada para: {doctor.email}")
    print(f"2. Fecha programada: {target_date.strftime('%Y-%m-%d %H:%M')}")
    
    # Trigger the task
    print("3. Ejecutando tarea de Celery (check_scheduled_reminders)...")
    from app.tasks.scheduled_appointment_reminders import check_scheduled_reminders
    check_scheduled_reminders()
    print("--- PRUEBA FINALIZADA ---")
    print("Revise su correo para confirmar la recepción del recordatorio.")
else:
    print("ERROR: Doctor 'mariel-herrera' no encontrado.")
db.close()
