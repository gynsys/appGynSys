"""
Appointment endpoints for managing appointments.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Annotated, List

from app.db.base import get_db
from app.db.models.doctor import Doctor
from app.db.models.appointment import Appointment
from app.schemas.appointment import AppointmentCreate, AppointmentInDB, AppointmentUpdate
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()


@router.post("/public", response_model=AppointmentInDB, status_code=status.HTTP_201_CREATED)
async def create_public_appointment(
    appointment_data: AppointmentCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new appointment (public endpoint for patients).
    Patients can create appointments without authentication.
    """
    # Verify that the doctor exists
    doctor = db.query(Doctor).filter(Doctor.id == appointment_data.doctor_id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )
    
    if not doctor.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Doctor is not accepting appointments"
        )
    
    db_appointment = Appointment(**appointment_data.model_dump())
    db.add(db_appointment)
    db.commit()
    db.refresh(db_appointment)
    
    return db_appointment


@router.post("/", response_model=AppointmentInDB, status_code=status.HTTP_201_CREATED)
async def create_appointment(
    appointment_data: AppointmentCreate,
    current_user: Annotated[Doctor, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """
    Create a new appointment.
    Only the doctor can create appointments for their own account.
    """
    # Verify that the appointment is for the current doctor
    if appointment_data.doctor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot create appointment for another doctor"
        )
    
    db_appointment = Appointment(**appointment_data.model_dump())
    db.add(db_appointment)
    db.commit()
    db.refresh(db_appointment)
    
    return db_appointment


@router.get("/", response_model=List[AppointmentInDB])
async def get_appointments(
    current_user: Annotated[Doctor, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """
    Get all appointments for the current doctor.
    """
    appointments = db.query(Appointment).filter(
        Appointment.doctor_id == current_user.id
    ).all()
    
    return appointments


@router.get("/{appointment_id}", response_model=AppointmentInDB)
async def get_appointment(
    appointment_id: int,
    current_user: Annotated[Doctor, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """
    Get a specific appointment by ID.
    """
    appointment = db.query(Appointment).filter(
        Appointment.id == appointment_id,
        Appointment.doctor_id == current_user.id
    ).first()
    
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    return appointment


@router.put("/{appointment_id}", response_model=AppointmentInDB)
async def update_appointment(
    appointment_id: int,
    appointment_update: AppointmentUpdate,
    current_user: Annotated[Doctor, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """
    Update an appointment.
    """
    appointment = db.query(Appointment).filter(
        Appointment.id == appointment_id,
        Appointment.doctor_id == current_user.id
    ).first()
    
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    # Update fields
    update_data = appointment_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(appointment, field, value)
    
    db.commit()
    db.refresh(appointment)
    
    return appointment


@router.delete("/{appointment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_appointment(
    appointment_id: int,
    current_user: Annotated[Doctor, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """
    Delete an appointment.
    """
    appointment = db.query(Appointment).filter(
        Appointment.id == appointment_id,
        Appointment.doctor_id == current_user.id
    ).first()
    
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    db.delete(appointment)
    db.commit()
    
    return None

