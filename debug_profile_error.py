import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add backend directory to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.db.base import Base
from app.db.models.doctor import Doctor
from app.schemas.doctor import DoctorPublic

# Setup DB connection
SQLALCHEMY_DATABASE_URL = "sqlite:///./backend/gynsys.db"
# If using postgres, we might need env vars. Assuming sqlite based on previous context or checking .env
# Checking .env might be safer, but let's try sqlite first as it's common in dev.
# Actually, migration logs said "PostgresqlImpl". So it IS Postgres.
# I need to get the URL from .env or hardcode if I know it. 
# Better: Import settings.
from app.core.config import settings

def debug_doctor_fetch():
    print(f"Connecting to DB: {settings.SQLALCHEMY_DATABASE_URL}")
    engine = create_engine(settings.SQLALCHEMY_DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    try:
        slug = "mariel-herrera"
        print(f"Searching for doctor with slug: {slug}")
        doctor = db.query(Doctor).filter(Doctor.slug_url == slug).first()
        
        if not doctor:
            print("Doctor not found in DB!")
            return

        print(f"Doctor found: {doctor.nombre_completo} (ID: {doctor.id})")
        print(f"Design Template in DB: {getattr(doctor, 'design_template', 'Attr Missing')}")

        print("Attempting to validate with DoctorPublic schema...")
        try:
            # Pydantic v2 use model_validate, v1 use from_orm
            doctor_public = DoctorPublic.from_orm(doctor)
            print("✅ Validation Successful!")
            print(doctor_public.json(indent=2))
        except Exception as e:
            print("❌ Validation FAILED:")
            print(e)
            
    except Exception as e:
        print(f"BS Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    debug_doctor_fetch()
