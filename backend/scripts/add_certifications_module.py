import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add the parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.base import Base
from app.db.models.module import Module
from app.db.models.tenant_module import TenantModule
from app.db.models.doctor import Doctor
from app.core.config import settings

# Database connection
engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def add_certifications_module():
    db = SessionLocal()
    try:
        print("🔍 Checking 'certifications' Module...")

        # 1. Define Module
        cert_module = {
            "code": "certifications",
            "name": "Acreditaciones",
            "description": "Sección para mostrar sus títulos y certificados.",
            "is_active": True
        }

        # 2. Upsert Module
        existing_mod = db.query(Module).filter(Module.code == cert_module["code"]).first()
        module_id = None
        
        if not existing_mod:
            new_mod = Module(**cert_module)
            db.add(new_mod)
            db.commit()
            db.refresh(new_mod)
            module_id = new_mod.id
            print(f"   [+] Created module: {cert_module['code']}")
        else:
            existing_mod.is_active = True
            db.commit()
            module_id = existing_mod.id
            print(f"   [=] Module exists: {cert_module['code']}")
        
        # 3. Enable for ALL Doctors
        print("\n🔍 Enabling 'certifications' for ALL Doctors...")
        
        doctors = db.query(Doctor).all()
        assignments_count = 0
        
        for doctor in doctors:
            # Check if association already exists
            exists = db.query(TenantModule).filter(
                TenantModule.tenant_id == doctor.id, 
                TenantModule.module_id == module_id
            ).first()
            
            if not exists:
                new_tm = TenantModule(
                    tenant_id=doctor.id,
                    module_id=module_id,
                    is_enabled=True # Enabled by default like other standard sections
                )
                db.add(new_tm)
                assignments_count += 1
                
        db.commit()
        print(f"✅ Assignments complete. Added {assignments_count} permissions.")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    add_certifications_module()
