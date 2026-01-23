from sqlalchemy import create_engine, and_
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.db.models.doctor import Doctor
from app.db.models.module import Module
from app.db.models.tenant_module import TenantModule

def disable_endo_for_mariel():
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = SessionLocal()

    slug = "mariel-herrera"
    doctor = session.query(Doctor).filter(Doctor.slug_url == slug).first()
    
    if not doctor:
        print(f"Doctor {slug} not found.")
        return

    module_code = "endometriosis_test"
    module = session.query(Module).filter(Module.code == module_code).first()
    
    if not module:
        print(f"Module {module_code} not found.")
        return

    # Check if exists
    existing = session.query(TenantModule).filter(
        and_(TenantModule.tenant_id == doctor.id, TenantModule.module_id == module.id)
    ).first()

    if existing:
        if existing.is_enabled:
            existing.is_enabled = False
            session.commit()
            print(f"EXITO: Modulo '{module.name}' DESACTIVADO para {doctor.nombre_completo}.")
        else:
            print(f"AVISO: El modulo '{module.name}' ya estaba desactivado para {doctor.nombre_completo}.")
    else:
        print(f"AVISO: El modulo '{module.name}' no estaba asignado a {doctor.nombre_completo}.")

if __name__ == "__main__":
    disable_endo_for_mariel()
