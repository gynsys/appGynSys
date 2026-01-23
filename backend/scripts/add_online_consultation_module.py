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
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def add_online_consultation_module():
    db = SessionLocal()
    try:
        print("🔍 Checking 'online_consultation' Module...")

        # 1. Define Module
        online_module = {
            "code": "online_consultation",
            "name": "Consultas Online (Video)",
            "description": "Permite agendar y realizar videollamadas con pacientes.",
            "is_active": True
        }

        # 2. Upsert Module
        existing_mod = db.query(Module).filter(Module.code == online_module["code"]).first()
        module_id = None
        
        if not existing_mod:
            new_mod = Module(**online_module)
            db.add(new_mod)
            db.commit()
            db.refresh(new_mod)
            module_id = new_mod.id
            print(f"   [+] Created module: {online_module['code']}")
        else:
            existing_mod.is_active = True
            db.commit()
            module_id = existing_mod.id
            print(f"   [=] Module exists: {online_module['code']}")
        
        # 3. Enable for ALL Doctors
        print("\n🔍 Enabling 'online_consultation' for ALL Doctors...")
        
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
                    is_enabled=True # Enabled by default
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
    add_online_consultation_module()
