from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.db.models.doctor import Doctor
from app.core.security import hash_password

def create_mariel():
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = SessionLocal()

    # Check if exists
    slug = "mariel-herrera"
    existing = session.query(Doctor).filter(Doctor.slug_url == slug).first()
    
    if existing:
        print(f"Doctor {slug} already exists.")
        return

    # Create
    doctor = Doctor(
        email="dramarielh@gmail.com",
        password_hash=hash_password("mariel123"), # Default password
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
    print(f"Created doctor: {doctor.nombre_completo} ({doctor.email})")
    print("Password: mariel123")

if __name__ == "__main__":
    create_mariel()
