
import sys
from pathlib import Path

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.db.models.doctor import Doctor
from app.core.security import verify_password

def check_admin():
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = SessionLocal()

    user = session.query(Doctor).filter(Doctor.email == "admin@gynsys.com").first()
    
    if user:
        print(f"User found: {user.email}")
        print(f"Role: {user.role}")
        print(f"Hash: {user.password_hash}")
        
        is_valid = verify_password("admin123", user.password_hash)
        print(f"Password 'admin123' valid: {is_valid}")
    else:
        print("User admin@gynsys.com NOT found")

if __name__ == "__main__":
    check_admin()
