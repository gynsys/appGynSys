from app.db.base import SessionLocal
from app.db.models.doctor import Doctor

db = SessionLocal()
doctors = db.query(Doctor).all()

print(f"DOCTORS_FOUND: {len(doctors)}")
for d in doctors:
    # Use nombre_completo as found in the model
    print(f"ID: {d.id}, Name: {d.nombre_completo}, Email: {d.email}, Role: {d.role}, IsActive: {d.is_active}")
