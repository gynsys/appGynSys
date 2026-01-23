from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.db.models.doctor import Doctor

def check_mariel_email():
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = SessionLocal()

    email = "dramarielh@gmail.com"
    doctor = session.query(Doctor).filter(Doctor.email == email).first()
    
    if doctor:
        print(f"Found doctor by email '{email}':")
        print(f"  Name: {doctor.nombre_completo}")
        print(f"  Slug: {doctor.slug_url}")
        print(f"  Status: {doctor.status}")
    else:
        print(f"Doctor with email '{email}' NOT found.")

if __name__ == "__main__":
    check_mariel_email()
