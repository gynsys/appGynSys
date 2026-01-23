
import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add current directory to path to allow imports
sys.path.append(os.getcwd())

from app.db.base import Base
from app.db.models.doctor import Doctor
from app.db.models.cycle_user import CycleUser
from app.core.config import settings

# Setup DB connection
# Looking for database URL in settings or environment
DATABASE_URL = "postgresql://postgres:postgres@localhost/appgynsys" # Defaulting for local dev, verify if this matches env
# If settings has it, better to use that, but importing settings might trigger other things.
# Let's try to assume standard dev defaults first or read from .env if possible, 
# but for now I'll hardcode the likely dev string or try to import it.

try:
    from app.core.config import settings
    DATABASE_URL = settings.DATABASE_URL
except Exception as e:
    print(f"Could not import settings: {e}")

print(f"Connecting to DB: {DATABASE_URL}")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

def check_user(email_fragment, tenant_slug):
    print(f"\n--- Checking for Tenant: {tenant_slug} ---")
    doctor = db.query(Doctor).filter(Doctor.slug_url == tenant_slug).first()
    
    if not doctor:
        print(f"❌ Tenant '{tenant_slug}' NOT FOUND.")
        return

    print(f"✅ Tenant Found: {doctor.nombre_completo} (ID: {doctor.id})")
    
    print(f"\n--- Checking for User with email containing: {email_fragment} ---")
    # Search for user roughly
    users = db.query(CycleUser).filter(CycleUser.email.ilike(f"%{email_fragment}%")).all()
    
    if not users:
        print(f"❌ No users found matching email fragment '{email_fragment}'")
    else:
        for user in users:
            print(f"\nUser Found: {user.email} (ID: {user.id})")
            print(f"  - Name: {user.nombre_completo}")
            print(f"  - Associated Doctor ID: {user.doctor_id}")
            print(f"  - Active: {user.is_active}")
            print(f"  - Password Hash Present: {'Yes' if user.password_hash else 'NO'}")
            
            if user.doctor_id != doctor.id:
                 print(f"  ⚠️ WARNING: User is associated with Doctor ID {user.doctor_id}, but requested tenant is {doctor.id}.")
            else:
                 print(f"  ✅ Association: Correct (Matches Tenant)")

if __name__ == "__main__":
    check_user("milano", "mariel-herrera")
