from sqlalchemy import create_engine, and_
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.db.models.doctor import Doctor
from app.db.models.module import Module
from app.db.models.tenant_module import TenantModule

def check_endo_status():
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = SessionLocal()

    slug = "mariel-herrera"
    doctor = session.query(Doctor).filter(Doctor.slug_url == slug).first()
    module = session.query(Module).filter(Module.code == "endometriosis_test").first()

    tm = session.query(TenantModule).filter(
        and_(TenantModule.tenant_id == doctor.id, TenantModule.module_id == module.id)
    ).first()

    print(f"Doctor: {doctor.nombre_completo}")
    print(f"Module: {module.name} ({module.code})")
    
    if tm:
        print(f"TenantModule exists. is_enabled: {tm.is_enabled}")
    else:
        print("TenantModule does NOT exist.")

if __name__ == "__main__":
    check_endo_status()
