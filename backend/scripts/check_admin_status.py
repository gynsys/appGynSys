from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.db.models.doctor import Doctor

def check_admin():
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = SessionLocal()

    # Assuming the admin is the one with role='admin'
    admins = session.query(Doctor).filter(Doctor.role == 'admin').all()
    
    print(f"Found {len(admins)} admins.")
    for admin in admins:
        print(f"ID: {admin.id}, Email: {admin.email}, Role: {admin.role}, Active: {admin.is_active}")

if __name__ == "__main__":
    check_admin()
