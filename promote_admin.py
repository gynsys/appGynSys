from app.db.base import SessionLocal
from app.db.models.doctor import Doctor

db = SessionLocal()
# Find Pablo's user (ID 1 as seen in previous output)
doctor = db.query(Doctor).filter(Doctor.id == 1).first()

if doctor:
    print(f"Updating role for {doctor.email}...")
    doctor.role = 'admin'
    db.commit()
    print("Role updated to 'admin'")
else:
    print("Doctor with ID 1 not found")
