import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add app directory to sys.path
sys.path.append(os.getcwd())

from app.core.config import settings
from app.db.models.doctor import Doctor
from app.db.models.cycle_user import CycleUser

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def list_all():
    db = SessionLocal()
    try:
        print(f"Database URL: {settings.DATABASE_URL}")
        
        # List Doctors
        doctors = db.query(Doctor).all()
        print(f"Found {len(doctors)} doctors:")
        for d in doctors:
            print(f" - ID: {d.id}, Email: '{d.email}', Name: {d.nombre_completo}")
            print("-" * 20)
        
        print("\n" + "="*20 + "\n")
        
        # List CycleUsers
        users = db.query(CycleUser).all()
        print(f"Found {len(users)} cycle users:")
        for u in users:
            print(f" - ID: {u.id}, Email: '{u.email}', Name: {u.nombre_completo}")
            print("-" * 20)

    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    list_all()
