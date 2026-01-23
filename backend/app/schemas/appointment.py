"""
Pydantic schemas for Appointment entity.
"""
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class AppointmentBase(BaseModel):
    """Base schema with common appointment fields."""
    patient_name: str
    patient_email: Optional[EmailStr] = None
    patient_phone: Optional[str] = None
    patient_dni: Optional[str] = None
    patient_age: Optional[int] = None
    occupation: Optional[str] = None
    residence: Optional[str] = None
    appointment_date: datetime
    appointment_type: Optional[str] = None
    reason_for_visit: Optional[str] = None
    notes: Optional[str] = None


class AppointmentCreate(AppointmentBase):
    """Schema for creating a new appointment."""
    doctor_id: int


class AppointmentUpdate(BaseModel):
    """Schema for updating appointment information."""
    patient_name: Optional[str] = None
    patient_email: Optional[EmailStr] = None
    patient_phone: Optional[str] = None
    patient_dni: Optional[str] = None
    patient_age: Optional[int] = None
    occupation: Optional[str] = None
    residence: Optional[str] = None
    appointment_date: Optional[datetime] = None
    appointment_type: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None


class AppointmentInDB(AppointmentBase):
    """Schema for appointment in database."""
    id: int
    doctor_id: int
    status: str
    preconsulta_answers: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

