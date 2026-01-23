"""
Script to reset the admin password to a specific value.
"""
import sys
from pathlib import Path

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.db.models.doctor import Doctor
from app.core.security import hash_password

def reset_password():
    """Reset admin password."""

    # Create engine
    engine = create_engine(settings.DATABASE_URL)

    # Create session
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = SessionLocal()

    email = "admin@gynsys.com"
    new_password = "12345678"

    try:
        # Check if user exists
        user = session.query(Doctor).filter(Doctor.email == email).first()
        
        if user:
            # Update the password hash
            user.password_hash = hash_password(new_password)
            session.commit()
            print(f"✅ Password updated for user: {user.email}")
            print(f"   New Password: {new_password}")
        else:
            print(f"❌ User not found: {email}")
            
            # Create if not exists (optional, but good for "fix it" scripts)
            print("Creating user...")
            admin_data = {
                "email": email,
                "password_hash": hash_password(new_password),
                "nombre_completo": "Administrador GynSys",
                "especialidad": "Administración",
                "biografia": "Usuario administrador del sistema GynSys",
                "slug_url": "admin-gynsys",
                "role": "admin",
                "is_active": True,
                "is_verified": True
            }
            admin_user = Doctor(**admin_data)
            session.add(admin_user)
            session.commit()
            print(f"✅ Admin user created with password: {new_password}")

    except Exception as e:
        session.rollback()
        print(f"❌ Error updating password: {e}")
        raise
    finally:
        session.close()

if __name__ == "__main__":
    reset_password()
