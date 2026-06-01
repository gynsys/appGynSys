import subprocess

cmd = """
docker exec appgynsys-backend-1 python -c "
import sys
import os
sys.path.insert(0, '/app')
from app.db.base import SessionLocal
from app.db.models.doctor import Doctor
from app.tasks.email_tasks import send_tenant_approval_email

db = SessionLocal()
doctor = db.query(Doctor).filter(Doctor.slug_url == 'endogen').first()
if doctor:
    send_tenant_approval_email.delay(
        doctor.email,
        doctor.nombre_completo,
        doctor.slug_url
    )
    print(f'Email queued for {doctor.email}')
else:
    print('Doctor not found')
db.close()
"
"""

ssh_cmd = [
    "ssh", 
    "-i", "C:/Users/pablo/.ssh/id_ed25519", 
    "root@167.172.115.154", 
    cmd
]
try:
    result = subprocess.run(ssh_cmd, capture_output=True, text=True, check=True, encoding='utf-8')
    print("OUTPUT:")
    print(result.stdout)
except subprocess.CalledProcessError as e:
    print(f"Error executing SSH command: {e.stderr}")
    print(f"STDOUT: {e.stdout}")
