import sys
from pathlib import Path
import os

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.db.models.doctor import Doctor
from app.core.security import hash_password

def restore_admin():
    """Restore the super admin account with a different slug."""
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = SessionLocal()

    try:
        # Check if email already exists
        email = "admin@appgynsys.com"
        existing = session.query(Doctor).filter(Doctor.email == email).first()
        
        if existing:
            existing.role = 'admin'
            existing.is_active = True
            existing.status = 'approved'
            # Update password to a known one if it was lost or changed
            existing.password_hash = hash_password("Admin.Gynsys.2024")
            session.commit()
            print(f"✅ Existing user {email} promoted to admin and password updated.")
        else:
            # Create new admin with a safe slug
            admin_user = Doctor(
                email=email,
                password_hash=hash_password("Admin.Gynsys.2024"),
                nombre_completo="Administrador de Sistema",
                especialidad="Administrador",
                biografia="Panel de Control Super Admin",
                slug_url="admin-panel-system", # Different from admin-system to avoid the landing page issue
                role="admin",
                is_active=True,
                status='approved',
                is_verified=True
            )
            session.add(admin_user)
            session.commit()
            print(f"✅ Super Admin account {email} restored with new slug.")

    except Exception as e:
        session.rollback()
        print(f"❌ Error: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    restore_admin()
