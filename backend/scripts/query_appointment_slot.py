"""
Script de diagnóstico: Muestra TODAS las citas para la sede santa paula
y también verifica los valores exactos del campo 'location' en la BD.
"""
from app.db.base import SessionLocal
from app.db.models.appointment import Appointment
from datetime import timezone

db = SessionLocal()
try:
    # 1. Mostrar todos los valores únicos del campo location para este doctor
    print("\n=== Valores únicos de 'location' en appointments ===\n")
    rows = db.query(Appointment.location, Appointment.doctor_id).distinct().all()
    for loc, doc_id in rows:
        print(f"  doctor_id={doc_id}  location='{loc}'")

    # 2. Buscar todas las citas que contengan 'santa paula' (case-insensitive)
    appts = db.query(Appointment).filter(
        Appointment.location.ilike("%santa paula%")
    ).all()

    print(f"\n=== Total citas en sedes que contienen 'santa paula': {len(appts)} ===\n")

    if not appts:
        print("No se encontraron citas para esta sede.")
    else:
        for appt in appts:
            dt = appt.appointment_date
            if dt and dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            hora = dt.strftime('%Y-%m-%d %H:%M UTC') if dt else 'N/A'
            print(f"  ID={appt.id} | Paciente={appt.patient_name} | Hora={hora} | Estado={appt.status} | location='{appt.location}'")

    # 3. Mostrar citas de las últimas 24h en CUALQUIER sede para verificar
    from datetime import datetime, timedelta
    now = datetime.utcnow()
    recent = db.query(Appointment).filter(
        Appointment.created_at >= now - timedelta(hours=24)
    ).all()
    print(f"\n=== Citas creadas en las últimas 24h: {len(recent)} ===\n")
    for appt in recent:
        dt = appt.appointment_date
        if dt and dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        hora = dt.strftime('%Y-%m-%d %H:%M UTC') if dt else 'N/A'
        print(f"  ID={appt.id} | location='{appt.location}' | Hora={hora} | Estado={appt.status}")

finally:
    db.close()
