from typing import List, Optional
from sqlalchemy.orm import Session
from app.db.models.service import Service
from app.schemas.service import ServiceCreate, ServiceUpdate

def get_service(db: Session, service_id: int) -> Optional[Service]:
    return db.query(Service).filter(Service.id == service_id).first()

def get_services_by_doctor(db: Session, doctor_id: int, skip: int = 0, limit: int = 100) -> List[Service]:
    return db.query(Service).filter(Service.doctor_id == doctor_id).order_by(Service.order).offset(skip).limit(limit).all()

def get_active_services_by_doctor(db: Session, doctor_id: int) -> List[Service]:
    return db.query(Service).filter(Service.doctor_id == doctor_id, Service.is_active == True).order_by(Service.order).all()

def create_service(db: Session, service: ServiceCreate, doctor_id: int) -> Service:
    db_service = Service(**service.model_dump(), doctor_id=doctor_id)
    db.add(db_service)
    db.commit()
    db.refresh(db_service)
    return db_service

def update_service(db: Session, db_service: Service, service_update: ServiceUpdate) -> Service:
    update_data = service_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_service, key, value)
    db.add(db_service)
    db.commit()
    db.refresh(db_service)
    return db_service

def delete_service(db: Session, service_id: int) -> Service:
    db_service = db.query(Service).filter(Service.id == service_id).first()
    if db_service:
        db.delete(db_service)
        db.commit()
    return db_service
