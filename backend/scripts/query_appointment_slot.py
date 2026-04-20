"""
Script de diagnóstico: Consulta quién tiene ocupado un horario específico
para una sede y fecha dada.

Uso: docker exec appgynsys-backend-1 python3 scripts/query_appointment_slot.py
"""
from app.db.base import SessionLocal
from app.db.models.appointment import Appointment
from datetime import datetime, timedelta, timezone

# --- PARÁMETROS DE CONSULTA ---
TARGET_LOCATION = "santa paula"
TARGET_DATE_STR = "2026-04-21"
TARGET_HOUR = 8  # 8:00 AM (UTC)

# ----------------------------------------------------------------

target_date = datetime.strptime(TARGET_DATE_STR, "%Y-%m-%d").date()

# Rango de búsqueda holgado (+/- 1 día) para cubrir posibles diferencias de zona horaria
start_dt = datetime.combine(target_date - timedelta(days=1), datetime.min.time())
end_dt = datetime.combine(target_date + timedelta(days=1), datetime.max.time())

db = SessionLocal()
try:
    appts = db.query(Appointment).filter(
        Appointment.appointment_date >= start_dt,
        Appointment.appointment_date <= end_dt,
        Appointment.location.ilike(f"%{TARGET_LOCATION}%"),
    ).all()

    print(f"\n=== Citas encontradas en '{TARGET_LOCATION}' el {TARGET_DATE_STR} ===\n")
    
    if not appts:
        print("No se encontraron citas para esta sede y fecha.")
    else:
        for appt in appts:
            dt = appt.appointment_date
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            print(f"  ID: {appt.id}")
            print(f"  Paciente: {appt.patient_name}")
            print(f"  Email:    {appt.patient_email}")
            print(f"  Teléfono: {appt.patient_phone}")
            print(f"  Hora UTC: {dt.strftime('%H:%M')} ({dt.isoformat()})")
            print(f"  Tipo:     {appt.appointment_type}")
            print(f"  Estado:   {appt.status}")
            print(f"  Doctor ID:{appt.doctor_id}")
            print("-" * 40)
finally:
    db.close()
