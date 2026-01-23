import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add the parent directory to sys.path to ensure modules can be imported
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.base import Base
from app.db.models.module import Module
from app.db.models.tenant_module import TenantModule
from app.db.models.doctor import Doctor
from app.core.config import settings

# Database connection
engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def restore_standard_modules():
    db = SessionLocal()
    try:
        print("🔍 Checking Standard Modules...")

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
            }
        ]

        # 2. Upsert Modules
        created_count = 0
        for mod_data in standard_modules:
            existing_mod = db.query(Module).filter(Module.code == mod_data["code"]).first()
            if not existing_mod:
                new_mod = Module(**mod_data)
                db.add(new_mod)
                created_count += 1
                print(f"   [+] Created module: {mod_data['code']}")
            else:
                existing_mod.is_active = True # Ensure active
                print(f"   [=] Module exists: {mod_data['code']}")
        
        db.commit()
        print(f"✅ Modules check complete. Created {created_count} new modules.")

        # 3. Enable for ALL Doctors (Default True)
        print("\n🔍 Enabling Standard Modules for ALL Doctors...")
        
        doctors = db.query(Doctor).all()
        all_modules_objs = db.query(Module).filter(Module.code.in_([m['code'] for m in standard_modules])).all()
        
        assignments_count = 0
        for doctor in doctors:
            current_map = {tm.module_id: tm for tm in doctor.tenant_modules}
            
            for mod in all_modules_objs:
                if mod.id not in current_map:
                    # Assign it enabled by default
                    new_tm = TenantModule(
                        tenant_id=doctor.id,
                        module_id=mod.id,
                        is_enabled=True # Standard sections enabled by default
                    )
                    db.add(new_tm)
                    assignments_count += 1
        
        db.commit()
        print(f"✅ Assignments complete. Added {assignments_count} default permissions.")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    restore_standard_modules()
