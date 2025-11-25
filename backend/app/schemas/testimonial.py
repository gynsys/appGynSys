"""
Pydantic schemas for Testimonial entity.
"""
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class TestimonialBase(BaseModel):
    """Base schema with common testimonial fields."""
    patient_name: str
    patient_email: Optional[EmailStr] = None
    content: str
    rating: Optional[int] = None  # 1-5


class TestimonialCreate(TestimonialBase):
    """Schema for creating a new testimonial."""
    doctor_id: int


class TestimonialUpdate(BaseModel):
    """Schema for updating testimonial information."""
    patient_name: Optional[str] = None
    patient_email: Optional[EmailStr] = None
    content: Optional[str] = None
    rating: Optional[int] = None
    is_approved: Optional[bool] = None
    is_featured: Optional[bool] = None


class TestimonialInDB(TestimonialBase):
    """Schema for testimonial in database."""
    id: int
    doctor_id: int
    is_approved: bool
    is_featured: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TestimonialPublic(TestimonialBase):
    """Schema for public API (only approved testimonials)."""
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

