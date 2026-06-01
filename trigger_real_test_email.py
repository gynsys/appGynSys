import subprocess
import base64

script = """
import json
from app.db.base import SessionLocal
from app.db.models.doctor import Doctor
from app.db.models.appointment import Appointment
from app.services.notifications.processor import trigger_doctor_event
from app.services.summary_generator import GeneradorResumenes

db = SessionLocal()

# Encontrar al doctor Pablo
doctor = db.query(Doctor).filter(Doctor.email.ilike('%1212pemc@gmail.com%')).first()
if not doctor:
    doctor = db.query(Doctor).filter(Doctor.slug_url == 'pablo-e-mota-c').first()

if doctor:
    # Buscar cualquier cita que tenga preconsulta
    appointment = db.query(Appointment).filter(
        Appointment.preconsulta_answers.isnot(None)
    ).order_by(Appointment.created_at.desc()).first()

    if appointment:
        print(f"Usando paciente real: {appointment.patient_name} (Cita ID: {appointment.id})")
        
        # Parse answers
        answers = appointment.preconsulta_answers
        if isinstance(answers, str):
            answers = json.loads(answers)
            
        # Generar resumenes reales
        gen = GeneradorResumenes(answers)
        resumenes = gen.generar_todo(appointment.patient_name)
        
        summary_personal = f"<p>{resumenes['general']}</p><p>{resumenes['antecedentes']}</p>"
        summary_gineco = f"<p>{resumenes['gineco']}</p>" if resumenes.get('gineco') else "Sin datos registrados."
        summary_funcional = f"<p>{resumenes['funcional']}</p>" if resumenes.get('funcional') else "Sin hallazgos reportados."
        summary_habitos = f"<p>{resumenes['estilo_vida']}</p>" if resumenes.get('estilo_vida') else "Sin datos registrados."
        
        date_str = appointment.appointment_date.strftime("%d/%m/%Y %H:%M") if appointment.appointment_date else "Fecha por definir"

        context = {
            "event": "preconsulta_completed",
            "doctor_name": doctor.nombre_completo,
            "patient_name": appointment.patient_name,
            "appointment_date": date_str,
            "patient_data": answers,
            "summary_html": "", # Ignorado por la nueva plantilla
            "summary_personal": summary_personal,
            "summary_gineco": summary_gineco,
            "summary_funcional": summary_funcional,
            "summary_habitos": summary_habitos
        }
        
        success = trigger_doctor_event(
            doctor_id=doctor.id,
            notification_type="doctor_preconsulta_completed",
            context=context,
            db=db
        )
        print("Resultado del disparo:", success)
    else:
        print("No se encontro ninguna cita con preconsulta en toda la DB.")
else:
    print("No se encontro ningun doctor para la prueba")
"""
b64 = base64.b64encode(script.encode('utf-8')).decode('utf-8')
cmd = f"docker exec appgynsys-backend-1 python -c \"import base64; exec(base64.b64decode('{b64}').decode('utf-8'))\""
subprocess.run(["python", "ssh_runner.py", cmd])
