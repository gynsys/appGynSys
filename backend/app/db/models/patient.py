"""
Patient model - represents patients in the system.
"""
from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from app.db.base import Base


class Patient(Base):
    """
    Patient model representing a patient.
    Patients can have appointments with multiple doctors.
    """
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    
    # Patient information
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=True)
    phone = Column(String, nullable=True)
    date_of_birth = Column(DateTime(timezone=True), nullable=True)
    
    # Medical information
    medical_history = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

