import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext

# Add the parent directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.base import Base
from app.db.models.module import Module
from app.db.models.tenant_module import TenantModule
from app.db.models.doctor import Doctor
from app.core.config import settings

# Database connection
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def fix_deployment_sync():
    db = SessionLocal()
    try:
        print("🔍 STARTING DEPLOYMENT REPAIR...")

        # --- 1. SEED ALL REQUIRED MODULES ---
        required_modules = [
            # Standard sections
            {"code": "gallery", "name": "Galería de Imágenes", "description": "Sección para mostrar fotos de su consultorio o trabajo.", "is_active": True},
            {"code": "testimonials", "name": "Testimonios", "description": "Sección para mostrar reseñas de pacientes.", "is_active": True},
            {"code": "services", "name": "Servicios", "description": "Listado de servicios médicos y procedimientos.", "is_active": True},
            {"code": "locations", "name": "Ubicaciones", "description": "Direcciones y mapas de sus consultorios.", "is_active": True},
            {"code": "faqs", "name": "Preguntas Frecuentes", "description": "Sección de preguntas y respuestas comunes.", "is_active": True},
            {"code": "certifications", "name": "Acreditaciones", "description": "Sección para mostrar sus títulos y certificados.", "is_active": True},
            # Extra Modules (SaaS)
            {"code": "blog", "name": "Blog Médico", "description": "Módulo de artículos y noticias de salud.", "is_active": True},
            {"code": "chat", "name": "Chat en Vivo", "description": "Widget de chat para comunicación con pacientes.", "is_active": True},
            {"code": "online_consultation", "name": "Telemedicina", "description": "Módulo de consultas virtuales.", "is_active": True},
            {"code": "recommendations", "name": "Recomendaciones Clínicas", "description": "Guías y recomendaciones para pacientes.", "is_active": True},
            {"code": "cycle_predictor", "name": "Predictor de Ciclo", "description": "Herramienta de seguimiento del ciclo menstrual.", "is_active": True},
            {"code": "endometriosis_test", "name": "Test de Endometriosis", "description": "Cuestionario de evaluación de endometriosis.", "is_active": True}
        ]

        print("--> 1. Syncing Modules Table...")
        module_map = {} # code -> id
        for mod_data in required_modules:
            existing = db.query(Module).filter(Module.code == mod_data["code"]).first()
            if not existing:
                new_mod = Module(**mod_data)
                db.add(new_mod)
                db.commit()
                db.refresh(new_mod)
                module_map[mod_data["code"]] = new_mod.id
                print(f"    [+] Created module: {mod_data['name']}")
            else:
                existing.is_active = True # Ensure active
                module_map[mod_data["code"]] = existing.id
                print(f"    [=] Module exists: {mod_data['name']}")
        
        db.commit()

        # --- 2. FIX MARIEL HERRERA USER ---
        print("\n--> 2. Fixing User Credentials (mariel-herrera)...")
        doctor = db.query(Doctor).filter(Doctor.slug_url == "mariel-herrera").first()
        
        target_email = "milanopabloe@gmail.com"
        target_password = "password123" # Temporary reset

        if doctor:
            print(f"    User found! Current email: {doctor.email}")
            # Update credentials
            if doctor.email != target_email:
                doctor.email = target_email
                print(f"    [!] UPDATED Email to: {target_email}")
            
            # Reset password to ensure login works
            doctor.password_hash = pwd_context.hash(target_password)
            print(f"    [!] RESET Password to: {target_password}")
            
            # Ensure admin/user role
            if doctor.role != "user" and doctor.role != "admin":
                 doctor.role = "user" # Default role
            
            db.commit()
            
            # --- 3. ENABLE MODULES FOR MARIEL ---
            print("\n--> 3. Enabling Modules for Mariel...")
            for code, mod_id in module_map.items():
                tm = db.query(TenantModule).filter(
                    TenantModule.tenant_id == doctor.id,
                    TenantModule.module_id == mod_id
                ).first()
                
                if not tm:
                    new_tm = TenantModule(tenant_id=doctor.id, module_id=mod_id, is_enabled=True)
                    db.add(new_tm)
                    print(f"    [+] Enabled: {code}")
                # else: leave enabled status as is, or force True if needed. Assuming force true for recovery.
                else:
                    tm.is_enabled = True
            
            db.commit()
            print("    ✅ All modules enabled for Mariel.")

        else:
            print("    ⚠️ Doctor 'mariel-herrera' not found! (This script runs after seed, so it should exist)")

        print("\n✅ DEPLOYMENT REPAIR COMPLETE.")

    except Exception as e:
        print(f"❌ Error in repair script: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_deployment_sync()
