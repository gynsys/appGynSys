import sys
import os
from datetime import datetime, timedelta

# Essential for identifying the 'app' module correctly inside Docker
sys.path.insert(0, "/app")
os.environ["PYTHONPATH"] = "/app"

from app.db.base import SessionLocal
from app.db.models.appointment import Appointment
from app.db.models.cycle_user import CycleUser
from app.db.models.doctor import Doctor
from app.tasks.email_tasks import check_and_send_appointment_reminders

def test_reminder_flow():
    db = SessionLocal()
    try:
        # 1. Buscar a Peta (ID 30) y a la Dra Mariel (ID 1)
        user = db.query(CycleUser).filter(CycleUser.id == 30).first()
        doctor = db.query(Doctor).filter(Doctor.id == 1).first()
        
        if not user or not doctor:
            print("❌ No se encontró al usuario o al doctor de prueba.")
            return

        print(f"✅ Preparando cita de prueba para: {user.nombre_completo}")
        
        # 2. Crear una cita para dentro de exactamente 90 minutos
        # Usamos utcnow() porque la tarea usa utcnow() para comparar
        appt_time = datetime.utcnow() + timedelta(minutes=90)
        
        test_appt = Appointment(
            doctor_id=doctor.id,
            patient_name=user.nombre_completo,
            patient_email=user.email,
            patient_phone="000-000-000",
            appointment_date=appt_time,
            appointment_type="Prueba de Sistema",
            reason_for_visit="Validación de Notificaciones T-90",
            status="scheduled",
            reminder_sent=False
        )
        
        db.add(test_appt)
        db.commit()
        db.refresh(test_appt)
        
        print(f"🚀 Cita creada (ID: {test_appt.id}) para las {test_appt.appointment_date} UTC")
        print("⏳ Ejecutando tarea de recordatorios...")
        
        # 3. Ejecutar la tarea manualmente
        check_and_send_appointment_reminders()
        
        # 4. Verificar si se marcó como enviada
        db.refresh(test_appt)
        if test_appt.reminder_sent:
            print("✨ ÉXITO: La tarea procesó la cita y marcó 'reminder_sent' como Verdadero.")
            print("📱 Revisa el teléfono de 'peta', debería haber llegado el Push.")
        else:
            print("⚠️ La tarea se ejecutó pero la cita no fue marcada como enviada. Revisa los logs.")

    except Exception as e:
        print(f"❌ ERROR: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_reminder_flow()
