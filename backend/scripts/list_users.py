"""
Script to list all users in the database.
"""
import sys
from pathlib import Path

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.db.models.doctor import Doctor
from app.db.models.user import User # Assuming User model needs to be imported

# Create engine and sessionmaker globally or pass them
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def list_users():
    """List all users and doctors."""
    print(f"Database URL: {settings.DATABASE_URL}")
    
    db = SessionLocal() # Use 'db' as the session variable
    try:
        # List Users
        users = db.query(User).all()
        print(f"Found {len(users)} users:")
        for u in users:
            print(f" - ID: {u.id}")
            print(f"   Email: '{u.email}'")
            print(f"   Role: {u.role}")
            print(f"   Active: {u.is_active}")
            print("-" * 20)
        
        print("\n" + "="*20 + "\n") # Separator
        
        # List Doctors
        doctors = db.query(Doctor).all()
        print(f"Found {len(doctors)} doctors:")
        for d in doctors:
            print(f" - ID: {d.id}")
            print(f"   Email: '{d.email}'")
            print(f"   Name: {d.nombre_completo}") # Assuming 'nombre_completo' is a Doctor attribute
            print("-" * 20)

    except Exception as e:
        print(f"❌ Error listing users/doctors: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    list_users()
