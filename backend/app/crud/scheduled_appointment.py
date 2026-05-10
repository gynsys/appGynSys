from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime

from app.db.models.scheduled_appointment import ScheduledAppointment
from app.schemas.scheduled_appointment import ScheduledAppointmentCreate, ScheduledAppointmentUpdate

def get_scheduled_appointment(db: Session, id: int) -> Optional[ScheduledAppointment]:
    return db.query(ScheduledAppointment).filter(ScheduledAppointment.id == id).first()

def get_scheduled_appointments_by_doctor(
    db: Session, 
    doctor_id: int, 
    upcoming_only: bool = False,
    skip: int = 0, 
    limit: int = 100
) -> List[ScheduledAppointment]:
    query = db.query(ScheduledAppointment).filter(ScheduledAppointment.doctor_id == doctor_id)
    
    if upcoming_only:
        query = query.filter(ScheduledAppointment.scheduled_date >= datetime.now())
    
    return query.order_by(ScheduledAppointment.scheduled_date.asc()).offset(skip).limit(limit).all()

def create_scheduled_appointment(db: Session, obj_in: ScheduledAppointmentCreate) -> ScheduledAppointment:
    db_obj = ScheduledAppointment(
        doctor_id=obj_in.doctor_id,
        patient_ci=obj_in.patient_ci,
        patient_name=obj_in.patient_name,
        patient_email=obj_in.patient_email,
        patient_phone=obj_in.patient_phone,
        original_appointment_id=obj_in.original_appointment_id,
        original_consultation_id=obj_in.original_consultation_id,
        scheduled_date=obj_in.scheduled_date,
        interval_type=obj_in.interval_type,
        notes=obj_in.notes
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update_scheduled_appointment(
    db: Session, db_obj: ScheduledAppointment, obj_in: ScheduledAppointmentUpdate
) -> ScheduledAppointment:
    update_data = obj_in.dict(exclude_unset=True)
    for field in update_data:
        setattr(db_obj, field, update_data[field])
    
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def delete_scheduled_appointment(db: Session, id: int) -> Optional[ScheduledAppointment]:
    db_obj = db.query(ScheduledAppointment).filter(ScheduledAppointment.id == id).first()
    if db_obj:
        db.delete(db_obj)
        db.commit()
    return db_obj
