from app.db.base import SessionLocal
from app.db.models.doctor import Doctor

db = SessionLocal()
slug = "mariel-herrera"
doctor = db.query(Doctor).filter(Doctor.slug_url == slug).first()

if doctor:
    print(f"FOUND: ID={doctor.id}, Name={doctor.nombre_completo}, Slug={doctor.slug_url}, Role={doctor.role}, IsActive={doctor.is_active}")
else:
    print(f"NOT FOUND: Slug {slug} does not exist in the database.")
