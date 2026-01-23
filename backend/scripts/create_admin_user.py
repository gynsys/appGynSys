"""
Script to create an admin user for testing purposes.
Run this script to create an admin user with role 'admin'.
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

def create_admin_user():
    """Create an admin user for testing."""

    # Create engine
    engine = create_engine(settings.DATABASE_URL)

    # Create session
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = SessionLocal()

    try:
        # Check if admin user already exists
        existing_admin = session.query(Doctor).filter(Doctor.role == 'admin').first()
        if existing_admin:
            # Update the password hash
            existing_admin.password_hash = hash_password("admin123")
            session.commit()
            print(f"✅ Admin user password updated: {existing_admin.email}")
            return

        # Create admin user
        admin_data = {
            "email": "admin@gynsys.com",
            "password_hash": hash_password("admin123"),  # hash for "admin123"
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

        print("✅ Admin user created successfully!")
        print(f"   Email: {admin_data['email']}")
        print(f"   Password: admin")
        print(f"   Role: admin")

    except Exception as e:
        session.rollback()
        print(f"❌ Error creating admin user: {e}")
        raise
    finally:
        session.close()

if __name__ == "__main__":
    create_admin_user()