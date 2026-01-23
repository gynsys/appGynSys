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
# FIX: Use correct attribute DATABASE_URL
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def restore_all_standard_modules():
    db = SessionLocal()
    try:
        print("🔍 Checking ALL Standard Modules...")

        # 1. Define Standard Modules (Sections)
        standard_modules = [
            {
                "code": "gallery",
                "name": "Galería de Imágenes",
                "description": "Sección para mostrar fotos de su consultorio o trabajo.",
                "is_active": True
            },
            {
                "code": "testimonials",
                "name": "Testimonios",
                "description": "Sección para mostrar reseñas de pacientes.",
                "is_active": True
            },
            {
                "code": "services",
                "name": "Servicios",
                "description": "Listado de servicios médicos y procedimientos.",
                "is_active": True
            },
            {
                "code": "locations",
                "name": "Ubicaciones",
                "description": "Direcciones y mapas de sus consultorios.",
                "is_active": True
            },
            {
                "code": "faqs",
                "name": "Preguntas Frecuentes",
                "description": "Sección de preguntas y respuestas comunes.",
                "is_active": True
            },
            {
                "code": "certifications",
                "name": "Acreditaciones",
                "description": "Sección para mostrar sus títulos y certificados.",
                "is_active": True
            }
        ]

        # 2. Upsert Modules
        created_count = 0
        module_ids = {} # code -> id
        
        for mod_data in standard_modules:
            existing_mod = db.query(Module).filter(Module.code == mod_data["code"]).first()
            if not existing_mod:
                new_mod = Module(**mod_data)
                db.add(new_mod)
                db.commit()
                db.refresh(new_mod)
                module_ids[mod_data["code"]] = new_mod.id
                created_count += 1
                print(f"   [+] Created module: {mod_data['code']}")
            else:
                existing_mod.is_active = True
                db.commit()
                module_ids[mod_data["code"]] = existing_mod.id
                print(f"   [=] Module exists: {mod_data['code']}")
        
        print(f"✅ Modules check complete. Created {created_count} new modules.")

        # 3. Enable for ALL Doctors (Standard = Enabled by Default)
        print("\n🔍 Enabling Standard Modules for ALL Doctors...")
        
        doctors = db.query(Doctor).all()
        assignments_count = 0
        
        for doctor in doctors:
            # Get current enabled modules for this doctor
            # We want to check against our target standard modules
            
            for mod_code, mod_id in module_ids.items():
                # Check if relation exists
                exists = db.query(TenantModule).filter(
                    TenantModule.tenant_id == doctor.id, 
                    TenantModule.module_id == mod_id
                ).first()
                
                if not exists:
                    # Create as enabled
                    new_tm = TenantModule(
                        tenant_id=doctor.id,
                        module_id=mod_id,
                        is_enabled=True 
                    )
                    db.add(new_tm)
                    assignments_count += 1
                # If exists, we leave it as is (respecting user's choice if they disabled it previously),
                # UNLESS it's a new system enforcement, but usually 'standard' means 'available to use'.
                # Actually, standard sections usually start enabled. 
        
        db.commit()
        print(f"✅ Assignments complete. Added {assignments_count} default permissions.")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    restore_all_standard_modules()
