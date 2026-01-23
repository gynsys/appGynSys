from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.db.models.module import Module
from app.db.models.doctor import Doctor
from app.db.models.tenant_module import TenantModule

def enable_modules_for_mariel():
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = SessionLocal()

    # Find Mariel
    slug = "mariel-herrera"
    doctor = session.query(Doctor).filter(Doctor.slug_url == slug).first()
    
    if not doctor:
        print(f"Doctor {slug} not found.")
        return

    print(f"Found doctor: {doctor.nombre_completo} (ID: {doctor.id})")

    # Get all active modules
    modules = session.query(Module).filter(Module.is_active == True).all()
    print(f"Found {len(modules)} active modules.")

    for module in modules:
        print(f"Checking module: {module.name} (ID: {module.id})")
        
        # Check if already enabled
        existing = session.query(TenantModule).filter(
            TenantModule.tenant_id == doctor.id,
            TenantModule.module_id == module.id
        ).first()
        
        if existing:
            print(f"  - Module already assigned. Enabled: {existing.is_enabled}")
            if not existing.is_enabled:
                existing.is_enabled = True
                print("  - Re-enabled module.")
        else:
            print("  - Assigning module...")
            tm = TenantModule(
                tenant_id=doctor.id,
                module_id=module.id,
                is_enabled=True
            )
            session.add(tm)
    
    session.commit()
    print("Done.")

if __name__ == "__main__":
    enable_modules_for_mariel()
