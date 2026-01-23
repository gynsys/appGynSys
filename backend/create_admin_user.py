from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.db.models.doctor import Doctor
from app.core.security import hash_password

def create_super_admin():
    print("Checking/Creating Super Admin user...")
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = SessionLocal()

    email = "admin@appgynsys.com"
    password = "adminpassword123" 
    slug = "super-admin"

    try:
        existing = session.query(Doctor).filter(Doctor.email == email).first()
        if existing:
            print(f"Super Admin {email} already exists.")
            # Ensure role is admin
            if existing.role != "admin":
                print("Promoting user to admin role...")
                existing.role = "admin"
                existing.is_verified = True
                existing.is_active = True
                session.commit()
            return

        print("Creating new Super Admin...")
        admin = Doctor(
            email=email,
            password_hash=hash_password(password),
            nombre_completo="Super Administrador",
            slug_url=slug,
            is_active=True,
            is_verified=True,
            status="active",
            role="admin",
            plan_id=1 # Assuming plan 1 exists from seed_admin or seed_mariel
        )
        session.add(admin)
        session.commit()
        print(f"✅ Super Admin created: {email} / {password}")

    except Exception as e:
        print(f"❌ Error creating admin: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    create_super_admin()
