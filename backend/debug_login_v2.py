
import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add current directory to path to allow imports
sys.path.append(os.getcwd())

from app.db.base import Base
from app.db.models.doctor import Doctor
from app.db.models.cycle_user import CycleUser

# Hardcoded local credentials based on config.py
# Host is localhost for local execution, not 'db' (docker)
DATABASE_URL = "postgresql://postgres:gyn13409534@localhost:5432/gynsys"

print(f"Connecting to DB: {DATABASE_URL}")

try:
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
except Exception as e:
    print(f"❌ Connection failed: {e}")
    sys.exit(1)

def check_user(email_fragment, tenant_slug):
    print(f"\n--- Checking for Tenant: {tenant_slug} ---")
    try:
        doctor = db.query(Doctor).filter(Doctor.slug_url == tenant_slug).first()
    except Exception as e:
        print(f"❌ Query failed: {e}")
        return

    if not doctor:
        print(f"❌ Tenant '{tenant_slug}' NOT FOUND.")
        # Let's list available tenants just in case
        print("Available Tenants:")
        docs = db.query(Doctor).all()
        for d in docs:
            print(f" - {d.slug_url} ({d.nombre_completo})")
        return

    print(f"✅ Tenant Found: {doctor.nombre_completo} (ID: {doctor.id})")
    
    print(f"\n--- Checking for User with email containing: {email_fragment} ---")
    users = db.query(CycleUser).filter(CycleUser.email.ilike(f"%{email_fragment}%")).all()
    
    if not users:
        print(f"❌ No users found matching email fragment '{email_fragment}'")
        # List all users for this doctor?
        print(f"All users for doctor '{doctor.nombre_completo}':")
        all_users = db.query(CycleUser).filter(CycleUser.doctor_id == doctor.id).all()
        for u in all_users:
             print(f" - {u.email}")
    else:
        for user in users:
            print(f"\nUser Found: {user.email} (ID: {user.id})")
            print(f"  - Name: {user.nombre_completo}")
            print(f"  - Associated Doctor ID: {user.doctor_id}")
            print(f"  - Active: {user.is_active}")
            print(f"  - Password Hash: {user.password_hash[:10]}..." if user.password_hash else "  - Password Hash: NONE")
            
            if user.doctor_id != doctor.id:
                 print(f"  ⚠️ WARNING: User is associatd with Doctor ID {user.doctor_id}, but requested tenant is {doctor.id}.")
            else:
                 print(f"  ✅ Association: Correct (Matches Tenant)")

if __name__ == "__main__":
    check_user("milano", "mariel-herrera")
