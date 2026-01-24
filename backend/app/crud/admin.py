"""
CRUD operations for admin system models.
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.db.models import Doctor, Plan, Module, TenantModule, FAQ, Testimonial, GalleryImage
from app.schemas.admin import (
    TenantCreate, TenantUpdate, TenantStatusUpdate,
    PlanCreate, PlanUpdate,
    ModuleCreate, ModuleUpdate,
    TenantModuleCreate, TenantModuleUpdate
)


# Tenant CRUD operations (Using Doctor model as Tenant)
def get_tenant(db: Session, tenant_id: int) -> Optional[Doctor]:
    return db.query(Doctor).filter(Doctor.id == tenant_id).first()


def get_tenant_by_slug(db: Session, slug: str) -> Optional[Doctor]:
    return db.query(Doctor).filter(Doctor.slug_url == slug).first()


def get_tenant_by_email(db: Session, email: str) -> Optional[Doctor]:
    return db.query(Doctor).filter(Doctor.email == email).first()


def get_tenants(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    plan_id: Optional[int] = None
) -> List[Doctor]:
    query = db.query(Doctor).filter(Doctor.role != 'admin') # Exclude admins
    if status:
        query = query.filter(Doctor.status == status)
    if plan_id:
        query = query.filter(Doctor.plan_id == plan_id)
    return query.offset(skip).limit(limit).all()


def create_tenant(db: Session, tenant: TenantCreate) -> Doctor:
    # Map TenantCreate schema to Doctor model
    doctor_data = tenant.model_dump()
    # Handle field mapping
    if 'slug' in doctor_data:
        doctor_data['slug_url'] = doctor_data.pop('slug')
    
    # Set defaults
    doctor_data['role'] = 'user'
    doctor_data['status'] = 'approved' # Admin created tenants are approved by default
    doctor_data['is_active'] = True
    
    db_tenant = Doctor(**doctor_data)
    db.add(db_tenant)
    db.commit()
    db.refresh(db_tenant)
    return db_tenant


def update_tenant(db: Session, tenant_id: int, tenant_update: TenantUpdate) -> Optional[Doctor]:
    db_tenant = db.query(Doctor).filter(Doctor.id == tenant_id).first()
    if db_tenant:
        update_data = tenant_update.model_dump(exclude_unset=True)
        
        # Handle field mapping
        if 'slug' in update_data:
            update_data['slug_url'] = update_data.pop('slug')
            
        for field, value in update_data.items():
            if hasattr(db_tenant, field):
                setattr(db_tenant, field, value)
                
        db.commit()
        db.refresh(db_tenant)
    return db_tenant


from app.tasks.email_tasks import send_tenant_approval_email

def seed_tenant_data(db: Session, doctor: Doctor):
    """
    Populate the doctor's profile with default instructional data.
    """
    # 1. Set default Bio if empty
    if not doctor.biografia:
        doctor.biografia = (
            "En esta sección colocarás tu información personal. "
            "Describe tu perfil profesional, tu experiencia, y cualquier otro detalle "
            "que quieras compartir con tus pacientes. "
            "Puedes editar este texto desde tu panel de administración."
        )
        db.add(doctor)

    # 2. Seed FAQs if none exist
    existing_faqs = db.query(FAQ).filter(FAQ.doctor_id == doctor.id).count()
    if existing_faqs == 0:
        default_faqs = [
            {
                "question": "¿Cómo edito esta pregunta?",
                "answer": "Puedes editar esta pregunta y respuesta desde tu panel de administración en la sección de Preguntas Frecuentes."
            },
            {
                "question": "¿Qué información debo poner aquí?",
                "answer": "Aquí puedes colocar información sobre tus horarios, seguros médicos aceptados, o procedimientos comunes."
            },
             {
                "question": "¿Dónde puedo ver mis citas?",
                "answer": "Tus citas aparecerán en el calendario de tu panel de administración una vez que los pacientes comiencen a agendar."
            }
        ]
        for i, item in enumerate(default_faqs):
            faq = FAQ(
                doctor_id=doctor.id,
                question=item["question"],
                answer=item["answer"],
                display_order=i
            )
            db.add(faq)

    # 3. Seed Testimonials if none exist
    existing_testimonials = db.query(Testimonial).filter(Testimonial.doctor_id == doctor.id).count()
    if existing_testimonials == 0:
        default_testimonials = [
            {
                "patient_name": "Paciente Ejemplo",
                "content": "Este es un testimonio de ejemplo. Puedes agregar testimonios reales de tus pacientes desde el panel de administración.",
                "rating": 5,
                "is_approved": True,
                "is_featured": True
            },
            {
                "patient_name": "Juan Pérez",
                "content": "Excelente servicio. La plataforma es muy fácil de usar para agendar citas.",
                "rating": 5,
                "is_approved": True,
                "is_featured": False
            }
        ]
        for item in default_testimonials:
            testimonial = Testimonial(
                doctor_id=doctor.id,
                patient_name=item["patient_name"],
                content=item["content"],
                rating=item["rating"],
                is_approved=item["is_approved"],
                is_featured=item["is_featured"]
            )
            db.add(testimonial)
    
    # 4. Seed Gallery if none exist
    existing_gallery = db.query(GalleryImage).filter(GalleryImage.doctor_id == doctor.id).count()
    if existing_gallery == 0:
        default_gallery = [
            {
                "image_url": "https://placehold.co/800x600/e2e8f0/475569?text=Consultorio+Ejemplo",
                "title": "Consultorio",
                "description": "Sube fotos de tus instalaciones para generar confianza en tus pacientes."
            },
            {
                "image_url": "https://placehold.co/800x600/e2e8f0/475569?text=Equipo+Medico",
                "title": "Equipo Médico",
                "description": "Muestra el equipo tecnológico con el que cuentas."
            },
            {
                "image_url": "https://placehold.co/800x600/e2e8f0/475569?text=Sala+de+Espera",
                "title": "Sala de Espera",
                "description": "Un ambiente cómodo para tus pacientes."
            }
        ]
        for i, item in enumerate(default_gallery):
            image = GalleryImage(
                doctor_id=doctor.id,
                image_url=item["image_url"],
                title=item["title"],
                description=item["description"],
                display_order=i,
                is_active=True
            )
            db.add(image)

    db.commit()

def update_tenant_status(db: Session, tenant_id: int, status_update: TenantStatusUpdate) -> Optional[Doctor]:
    db_tenant = db.query(Doctor).filter(Doctor.id == tenant_id).first()
    if db_tenant:
        old_status = db_tenant.status
        new_status = status_update.status
        db_tenant.status = new_status
        
        # Update is_active based on status
        if new_status in ['active', 'approved']:
            db_tenant.is_active = True
            
            # If status changed from pending/inactive to active/approved
            if old_status not in ['active', 'approved']:
                # Seed default data (Bio, FAQs, Testimonials) ONLY on new activation
                seed_tenant_data(db, db_tenant)

                try:
                    # Ensure slug is set (it should be from registration)
                    if not db_tenant.slug_url:
                        # Fallback if slug is missing
                        from app.api.v1.endpoints.auth import generate_slug_from_name
                        db_tenant.slug_url = generate_slug_from_name(db_tenant.nombre_completo)
                        
                    # Send approval email
                    send_tenant_approval_email.delay(
                        db_tenant.email,
                        db_tenant.nombre_completo,
                        db_tenant.slug_url
                    )
                    
                    # Enable default modules for the approved tenant
                    # Get all active modules
                    active_modules = db.query(Module).filter(Module.is_active == True).all()
                    for module in active_modules:
                        # Check if relationship already exists
                        existing = db.query(TenantModule).filter(
                            and_(TenantModule.tenant_id == db_tenant.id, TenantModule.module_id == module.id)
                        ).first()
                        
                        if not existing:
                            tenant_module = TenantModule(
                                tenant_id=db_tenant.id,
                                module_id=module.id,
                                is_enabled=True
                            )
                            db.add(tenant_module)
                        else:
                            existing.is_enabled = True
                    
                    db.commit()
                except Exception as e:
                    pass
                    
        elif new_status in ['suspended', 'rejected', 'paused']:
            db_tenant.is_active = False
            
        db.commit()
        db.refresh(db_tenant)
    return db_tenant


def delete_tenant(db: Session, tenant_id: int) -> bool:
    db_tenant = db.query(Doctor).filter(Doctor.id == tenant_id).first()
    if db_tenant:
        db.delete(db_tenant)
        db.commit()
        return True
    return False


# Plan CRUD operations
def get_plan(db: Session, plan_id: int) -> Optional[Plan]:
    return db.query(Plan).filter(Plan.id == plan_id).first()


def get_plans(db: Session, skip: int = 0, limit: int = 100, active_only: bool = True) -> List[Plan]:
    query = db.query(Plan)
    if active_only:
        query = query.filter(Plan.is_active == True)
    return query.offset(skip).limit(limit).all()


def create_plan(db: Session, plan: PlanCreate) -> Plan:
    db_plan = Plan(**plan.model_dump())
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)
    return db_plan


def update_plan(db: Session, plan_id: int, plan_update: PlanUpdate) -> Optional[Plan]:
    db_plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if db_plan:
        update_data = plan_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_plan, field, value)
        db.commit()
        db.refresh(db_plan)
    return db_plan


def delete_plan(db: Session, plan_id: int) -> bool:
    db_plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if db_plan:
        db.delete(db_plan)
        db.commit()
        return True
    return False


# Module CRUD operations
def get_module(db: Session, module_id: int) -> Optional[Module]:
    return db.query(Module).filter(Module.id == module_id).first()


def get_module_by_code(db: Session, code: str) -> Optional[Module]:
    return db.query(Module).filter(Module.code == code).first()


def get_modules(db: Session, skip: int = 0, limit: int = 100, active_only: bool = True) -> List[Module]:
    query = db.query(Module)
    if active_only:
        query = query.filter(Module.is_active == True)
    return query.offset(skip).limit(limit).all()


def create_module(db: Session, module: ModuleCreate) -> Module:
    db_module = Module(**module.model_dump())
    db.add(db_module)
    db.commit()
    db.refresh(db_module)
    return db_module


def update_module(db: Session, module_id: int, module_update: ModuleUpdate) -> Optional[Module]:
    db_module = db.query(Module).filter(Module.id == module_id).first()
    if db_module:
        update_data = module_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_module, field, value)
        db.commit()
        db.refresh(db_module)
    return db_module


def delete_module(db: Session, module_id: int) -> bool:
    db_module = db.query(Module).filter(Module.id == module_id).first()
    if db_module:
        db.delete(db_module)
        db.commit()
        return True
    return False


# Tenant-Module relationship CRUD operations
def get_tenant_modules(db: Session, tenant_id: int) -> List[TenantModule]:
    return db.query(TenantModule).filter(TenantModule.tenant_id == tenant_id).all()


def get_enabled_tenant_modules(db: Session, tenant_id: int) -> List[Module]:
    """Get all enabled modules for a tenant."""
    return (
        db.query(Module)
        .join(TenantModule, and_(Module.id == TenantModule.module_id, TenantModule.tenant_id == tenant_id))
        .filter(TenantModule.is_enabled == True)
        .all()
    )


def enable_tenant_module(db: Session, tenant_id: int, module_id: int) -> TenantModule:
    """Enable a module for a tenant."""
    # Check if relationship already exists
    existing = db.query(TenantModule).filter(
        and_(TenantModule.tenant_id == tenant_id, TenantModule.module_id == module_id)
    ).first()

    if existing:
        existing.is_enabled = True
        db.commit()
        db.refresh(existing)
        return existing
    else:
        tenant_module = TenantModule(
            tenant_id=tenant_id,
            module_id=module_id,
            is_enabled=True
        )
        db.add(tenant_module)
        db.commit()
        db.refresh(tenant_module)
        return tenant_module


def disable_tenant_module(db: Session, tenant_id: int, module_id: int) -> bool:
    """Disable a module for a tenant."""
    tenant_module = db.query(TenantModule).filter(
        and_(TenantModule.tenant_id == tenant_id, TenantModule.module_id == module_id)
    ).first()

    if tenant_module:
        tenant_module.is_enabled = False
        db.commit()
        return True
    return False


def update_tenant_modules(db: Session, tenant_id: int, module_updates: List[dict]) -> List[TenantModule]:
    """Update multiple modules for a tenant at once."""
    updated_modules = []

    for update in module_updates:
        module_id = update.get("module_id")
        is_enabled = update.get("is_enabled", True)

        if is_enabled:
            tenant_module = enable_tenant_module(db, tenant_id, module_id)
        else:
            disable_tenant_module(db, tenant_id, module_id)
            # Get the updated relationship
            tenant_module = db.query(TenantModule).filter(
                and_(TenantModule.tenant_id == tenant_id, TenantModule.module_id == module_id)
            ).first()

        if tenant_module:
            updated_modules.append(tenant_module)

    return updated_modules


def get_tenant_by_email(db: Session, email: str) -> Optional[Doctor]:
    """Get tenant by email."""
    return db.query(Doctor).filter(Doctor.email == email).first()


def get_tenant_by_slug(db: Session, slug: str) -> Optional[Doctor]:
    """Get tenant by slug."""
    return db.query(Doctor).filter(Doctor.slug_url == slug).first()


def get_module_by_code(db: Session, code: str) -> Optional[Module]:
    """Get module by code."""
    return db.query(Module).filter(Module.code == code).first()