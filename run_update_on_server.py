import subprocess
import base64

script = """
from app.db.base import SessionLocal
from sqlalchemy import text
db = SessionLocal()
html = '<div style="font-family: sans-serif; max-width: 650px; margin: 0 auto; background-color: #f9fafb; padding: 20px; border-radius: 12px; border: 1px solid #e5e7eb;"><div style="text-align: center; margin-bottom: 20px;"><h2 style="color: #4F46E5; margin: 0;">Preconsulta Completada</h2><p style="color: #6b7280; margin: 5px 0;">{patient_name} ha completado su formulario de preconsulta</p></div><div style="background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);"><p style="margin-top: 0;"><strong>Cita:</strong> {appointment_date}</p><div style="margin-top: 15px; padding: 15px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px;"><h3 style="margin-top:0; color: #1e3a8a; font-size: 15px; text-transform: uppercase;">Información Personal y Médica</h3><div style="color: #374151; font-size: 14px; line-height: 1.5;">{summary_personal}</div></div><div style="margin-top: 15px; padding: 15px; background-color: #fdf2f8; border-left: 4px solid #ec4899; border-radius: 4px;"><h3 style="margin-top:0; color: #831843; font-size: 15px; text-transform: uppercase;">Historia Gineco-Obstétrica</h3><div style="color: #374151; font-size: 14px; line-height: 1.5;">{summary_gineco}</div></div><div style="margin-top: 15px; padding: 15px; background-color: #f3f4f6; border-left: 4px solid #4b5563; border-radius: 4px;"><h3 style="margin-top:0; color: #1f2937; font-size: 15px; text-transform: uppercase;">Examen Funcional</h3><div style="color: #374151; font-size: 14px; line-height: 1.5;">{summary_funcional}</div></div><div style="margin-top: 15px; padding: 15px; background-color: #ecfdf5; border-left: 4px solid #10b981; border-radius: 4px;"><h3 style="margin-top:0; color: #064e3b; font-size: 15px; text-transform: uppercase;">Hábitos Psicobiológicos</h3><div style="color: #374151; font-size: 14px; line-height: 1.5;">{summary_habitos}</div></div></div><div style="text-align: center; margin-top: 30px;"><a href="https://gynsys.net/dashboard/consultation" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Ver Dashboard</a></div></div>'
db.execute(text("UPDATE notification_rules SET message_template = :html WHERE notification_type = 'doctor_preconsulta_completed'"), {'html': html})
db.commit()
"""
b64 = base64.b64encode(script.encode('utf-8')).decode('utf-8')
cmd = f"docker exec appgynsys-backend-1 python -c \"import base64; exec(base64.b64decode('{b64}').decode('utf-8'))\""
subprocess.run(["python", "ssh_runner.py", cmd])
