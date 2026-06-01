import subprocess

cmd = """
docker exec appgynsys-backend-1 python -c "
import sys
sys.path.insert(0, '/app')
from app.db.base import SessionLocal
from app.db.models.doctor import Doctor

db = SessionLocal()
doctor = db.query(Doctor).filter(Doctor.slug_url == 'endogen').first()
if doctor:
    doctor.is_clinic = True
    doctor.role = 'clinic'
    db.commit()
    print(f'Updated {doctor.slug_url}: is_clinic=True, role=clinic')
else:
    print('Doctor endogen not found')
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
