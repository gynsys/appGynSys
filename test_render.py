import subprocess
import base64

script = """
import logging
logging.basicConfig(level=logging.DEBUG)
from app.db.base import SessionLocal
from sqlalchemy import text
from app.services.notifications.sender import safe_render_content
from app.db.models.notification import NotificationRule

db = SessionLocal()
rule = db.query(NotificationRule).filter(NotificationRule.notification_type == 'doctor_preconsulta_completed').first()
context = {
    "event": "preconsulta_completed",
    "doctor_name": "Test Doctor",
    "patient_name": "Test Patient",
    "appointment_date": "10/10/2026",
    "patient_data": {},
    "summary_html": "<p>Test summary</p>"
}
result = safe_render_content(rule, context)
print("--- RENDER RESULT ---")
print(result)
"""
b64 = base64.b64encode(script.encode('utf-8')).decode('utf-8')
cmd = f"docker exec appgynsys-backend-1 python -c \"import base64; exec(base64.b64decode('{b64}').decode('utf-8'))\""
subprocess.run(["python", "ssh_runner.py", cmd])
