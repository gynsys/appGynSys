"""
Appointment model - represents patient appointments with doctors.
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class Appointment(Base):
    """
    Appointment model representing a scheduled appointment between a patient and a doctor.
    """
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign key to doctor (tenant)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False, index=True)
    
    # Patient information
    patient_name = Column(String, nullable=False)
    patient_email = Column(String, nullable=True)
    patient_phone = Column(String, nullable=True)
    
    # New fields for Preconsultation data capture
    occupation = Column(String, nullable=True)
    residence = Column(String, nullable=True)
    patient_dni = Column(String, nullable=True)
    patient_age = Column(Integer, nullable=True)
    
    # Appointment details
    appointment_date = Column(DateTime(timezone=True), nullable=False)
    appointment_type = Column(String, nullable=True)  # e.g., "Ginecológica", "Prenatal"
    reason_for_visit = Column(String, nullable=True)  # e.g., "Control Ginecológico", "Dolor pélvico"
    notes = Column(Text, nullable=True)
    
    # Status
    status = Column(String, default="scheduled")  # scheduled, confirmed, cancelled, completed
    
    # Pre-consultation Data
    preconsulta_answers = Column(Text, nullable=True)  # JSON string of answers
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationship
    doctor = relationship("Doctor", backref="appointments")

