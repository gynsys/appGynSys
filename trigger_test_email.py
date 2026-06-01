import subprocess
import base64

script = """
from app.db.base import SessionLocal
from app.db.models.doctor import Doctor
from app.services.notifications.processor import trigger_doctor_event

db = SessionLocal()

# Encontrar al doctor Pablo
doctor = db.query(Doctor).filter(Doctor.email.ilike('%1212pemc@gmail.com%')).first()
if not doctor:
    doctor = db.query(Doctor).filter(Doctor.slug_url == 'pablo-e-mota-c').first()

if doctor:
    print(f"Disparando notificacion para el doctor: {doctor.nombre_completo} ({doctor.email})")
    context = {
        "event": "preconsulta_completed",
        "doctor_name": doctor.nombre_completo,
        "patient_name": "Paciente de Prueba 4 Secciones",
        "appointment_date": "15/08/2026 10:00",
        "patient_data": {"age": 28, "phone": "+123456789"},
        "summary_html": "", # Ignorado por la nueva plantilla
        "summary_personal": "<p>PACIENTE DE PRUEBA 4 SECCIONES, 28 años, residencia en Caracas.</p><p>Sin antecedentes médicos de interés.</p>",
        "summary_gineco": "<p>Nuligesta. Menarquía a los 12 años y sexarquía a los 18. Refiere ciclos regulares.</p>",
        "summary_funcional": "<p>La paciente refiere dispareunia leve (2/10).</p>",
        "summary_habitos": "<p>En cuanto a hábitos: no fuma, no consume alcohol.</p>"
    }
    
    success = trigger_doctor_event(
        doctor_id=doctor.id,
        notification_type="doctor_preconsulta_completed",
        context=context,
        db=db
    )
    print("Resultado del disparo:", success)
else:
    print("No se encontro ningun doctor para la prueba")
"""
b64 = base64.b64encode(script.encode('utf-8')).decode('utf-8')
cmd = f"docker exec appgynsys-backend-1 python -c \"import base64; exec(base64.b64decode('{b64}').decode('utf-8'))\""
subprocess.run(["python", "ssh_runner.py", cmd])
