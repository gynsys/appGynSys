"""
Pydantic schemas for Doctor entity.
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class DoctorBase(BaseModel):
    """Base schema with common doctor fields."""
    email: EmailStr
    nombre_completo: str
    especialidad: Optional[str] = None
    biografia: Optional[str] = None


class DoctorCreate(DoctorBase):
    """Schema for creating a new doctor."""
    password: str = Field(..., min_length=8)
    slug_url: Optional[str] = None  # Auto-generated if not provided


class DoctorUpdate(BaseModel):
    """Schema for updating doctor information."""
    nombre_completo: Optional[str] = None
    especialidad: Optional[str] = None
    biografia: Optional[str] = None
    logo_url: Optional[str] = None
    photo_url: Optional[str] = None
    theme_primary_color: Optional[str] = None
    password: Optional[str] = Field(None, min_length=8)


class DoctorInDB(DoctorBase):
    """Schema for internal use (includes sensitive data)."""
    id: int
    slug_url: str
    logo_url: Optional[str] = None
    photo_url: Optional[str] = None
    theme_primary_color: Optional[str] = None
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DoctorPublic(DoctorBase):
    """Schema for public API (excludes sensitive information)."""
    id: int
    slug_url: str
    logo_url: Optional[str] = None
    photo_url: Optional[str] = None
    theme_primary_color: Optional[str] = None
    especialidad: Optional[str] = None
    biografia: Optional[str] = None

    class Config:
        from_attributes = True

