
import logging
from app.db.base import SessionLocal
from app.db.models.doctor import Doctor
from app.db.models.module import Module
from app.db.models.tenant_module import TenantModule

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def fix_modules():
    session = SessionLocal()
    try:
        # 1. Define Standard Modules
        system_modules = [
            {"name": "Blog", "code": "blog", "desc": "Blog functionality"},
            {"name": "Endometriosis Test", "code": "endometriosis_test", "desc": "Diagnostic test"},
            {"name": "Gallery", "code": "gallery", "desc": "Image gallery"},
            {"name": "Testimonials", "code": "testimonials", "desc": "Patient reviews"},
            {"name": "FAQ", "code": "faq", "desc": "Frequently asked questions"},
            {"name": "Services", "code": "services", "desc": "Services list"},
            {"name": "Locations", "code": "locations", "desc": "Office locations"}
        ]

        logger.info("Checking/Creating generic modules...")
        db_modules = {}
        for mod_data in system_modules:
            mod = session.query(Module).filter(Module.code == mod_data['code']).first()
            if not mod:
                mod = Module(
                    name=mod_data['name'],
                    code=mod_data['code'],
                    description=mod_data['desc'],
                    is_active=True
                )
                session.add(mod)
                session.flush() # Get ID
                logger.info(f"Created module: {mod_data['code']}")
            db_modules[mod_data['code']] = mod
        
        # 2. Enable for Mariel
        doctor = session.query(Doctor).filter(Doctor.slug_url == "mariel-herrera").first()
        if not doctor:
            logger.error("Doctor 'mariel-herrera' not found.")
            return

        logger.info(f"Enabling modules for {doctor.slug_url}...")
        
        # Enable all defined modules for her
        for code, mod_obj in db_modules.items():
            tm = session.query(TenantModule).filter(
                TenantModule.tenant_id == doctor.id,
                TenantModule.module_id == mod_obj.id
            ).first()
            
            if not tm:
                tm = TenantModule(
                    tenant_id=doctor.id,
                    module_id=mod_obj.id,
                    is_enabled=True
                )
                session.add(tm)
                logger.info(f"Enabled {code} for doctor")
            else:
                if not tm.is_enabled:
                    tm.is_enabled = True
                    logger.info(f"Re-enabled {code} for doctor")

        session.commit()
        logger.info("Module configuration complete!")

    except Exception as e:
        logger.error(f"Error fixing modules: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    fix_modules()
