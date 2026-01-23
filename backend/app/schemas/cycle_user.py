"""
Pydantic schemas for CycleUser (cycle predictor users).
"""
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


class CycleUserBase(BaseModel):
    email: EmailStr
    nombre_completo: str
    cycle_avg_length: Optional[int] = 28
    period_avg_length: Optional[int] = 5


class CycleUserCreate(CycleUserBase):
    password: str
    doctor_slug: str  # To identify which doctor/tenant they belong to


class CycleUserUpdate(BaseModel):
    nombre_completo: Optional[str] = None
    email: Optional[EmailStr] = None
    cycle_avg_length: Optional[int] = None
    period_avg_length: Optional[int] = None


class CycleUserInDB(CycleUserBase):
    id: int
    doctor_id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CycleUserResponse(CycleUserBase):
    id: int
    is_active: bool
    created_at: datetime
    theme_primary_color: Optional[str] = None

    class Config:
        from_attributes = True
