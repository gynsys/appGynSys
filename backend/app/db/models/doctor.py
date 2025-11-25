"""
Doctor model - represents a medical professional (tenant) in the system.
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.db.base import Base


class Doctor(Base):
    """
    Doctor model representing a medical professional.
    Each doctor is a tenant with their own customizable digital clinic.
    """
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=True)  # Nullable for Google OAuth users
    
    # Profile information
    nombre_completo = Column(String, nullable=False)
    especialidad = Column(String, nullable=True)
    biografia = Column(String, nullable=True)
    
    # Multi-tenant URL identifier
    slug_url = Column(String, unique=True, index=True, nullable=False)
    
    # Customization fields
    logo_url = Column(String, nullable=True)
    photo_url = Column(String, nullable=True)  # Doctor's profile photo
    theme_primary_color = Column(String, nullable=True)  # Hex color code
    
    # Account status
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

