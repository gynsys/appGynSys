
import logging
from app.db.base import SessionLocal
from app.db.models.doctor import Doctor
from app.db.models.module import Module
from app.db.models.tenant_module import TenantModule

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def add_recommendations_module():
    session = SessionLocal()
    try:
        # 1. Check/Add "recommendations" module
        module_code = "recommendations"
        module_name = "Recomendaciones"
        module_desc = "Gestión de productos recomendados, afiliados y eBooks"

        mod = session.query(Module).filter(Module.code == module_code).first()
        if not mod:
            mod = Module(
                name=module_name,
                code=module_code,
                description=module_desc,
                is_active=True
            )
            session.add(mod)
            session.flush()
            logger.info(f"Created module: {module_code}")
        else:
            logger.info(f"Module {module_code} already exists.")

        # 2. Enable for Mariel
        doctor = session.query(Doctor).filter(Doctor.slug_url == "mariel-herrera").first()
        if not doctor:
            logger.error("Doctor 'mariel-herrera' not found.")
            return

        tm = session.query(TenantModule).filter(
            TenantModule.tenant_id == doctor.id,
            TenantModule.module_id == mod.id
        ).first()

        if not tm:
            tm = TenantModule(
                tenant_id=doctor.id,
                module_id=mod.id,
                is_enabled=True
            )
            session.add(tm)
            logger.info(f"Enabled {module_code} for doctor {doctor.slug_url}")
        else:
            if not tm.is_enabled:
                tm.is_enabled = True
                logger.info(f"Re-enabled {module_code} for doctor")
            else:
                logger.info(f"Module already enabled for doctor")

        session.commit()
        logger.info("Done!")

    except Exception as e:
        logger.error(f"Error: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    add_recommendations_module()
