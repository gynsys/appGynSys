from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.db.models.doctor import Doctor

def check_doctor():
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = SessionLocal()

    # Try to find by slug
    slug = "mariel-herrera"
    doctor = session.query(Doctor).filter(Doctor.slug_url == slug).first()
    
    if doctor:
        print(f"Found doctor by slug '{slug}':")
        print(f"  Name: {doctor.nombre_completo}")
        print(f"  Email: {doctor.email}")
        print(f"  Status: {doctor.status}")
        print(f"  Is Active: {doctor.is_active}")
    else:
        print(f"Doctor with slug '{slug}' NOT found.")
        
        # Try to find by name similar to Mariel
        doctors = session.query(Doctor).filter(Doctor.nombre_completo.ilike("%Mariel%")).all()
        if doctors:
            print("Found doctors with similar name:")
            for d in doctors:
                print(f"  Name: {d.nombre_completo} | Slug: {d.slug_url} | Status: {d.status}")
        else:
            print("No doctors found with name 'Mariel'.")

if __name__ == "__main__":
    check_doctor()
