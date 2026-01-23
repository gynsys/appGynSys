from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.db.models.doctor import Doctor
from app.core.security import hash_password

def create_doctor_test():
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = SessionLocal()

    email = "doctor@test.com"
    slug = "mariel-herrera"
    
    # Check if email exists
    existing_email = session.query(Doctor).filter(Doctor.email == email).first()
    if existing_email:
        print(f"Doctor with email {email} already exists.")
        return

    # Check if slug exists
    existing_slug = session.query(Doctor).filter(Doctor.slug_url == slug).first()
    if existing_slug:
        print(f"Doctor with slug {slug} already exists. Using a different slug.")
        slug = "mariel-herrera-test"

    # Create
    doctor = Doctor(
        email=email,
        password_hash=hash_password("doctor123"), 
        nombre_completo="Dra. Mariel Herrera",
        slug_url=slug,
        especialidad="Ginecología y Obstetricia",
        biografia="Especialista en salud integral de la mujer.",
        is_active=True,
        is_verified=True,
        status="active",
        role="user"
    )
    
    session.add(doctor)
    session.commit()
    print(f"Created doctor: {doctor.nombre_completo}")
    print(f"Email: {doctor.email}")
    print(f"Password: doctor123")
    print(f"Slug: {doctor.slug_url}")

if __name__ == "__main__":
    create_doctor_test()
