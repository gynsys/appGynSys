"""
User endpoints for authenticated doctors to manage their own account.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Annotated

from app.db.base import get_db
from app.db.models.doctor import Doctor
from app.schemas.doctor import DoctorInDB, DoctorUpdate
from app.core.security import hash_password
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()


@router.get("/me", response_model=DoctorInDB)
async def get_current_user_info(
    current_user: Annotated[Doctor, Depends(get_current_user)]
):
    """
    Get current authenticated user's information.
    """
    return current_user


@router.put("/me", response_model=DoctorInDB)
async def update_current_user(
    doctor_update: DoctorUpdate,
    current_user: Annotated[Doctor, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """
    Update current authenticated user's information.
    """
    # Update fields if provided
    if doctor_update.nombre_completo is not None:
        current_user.nombre_completo = doctor_update.nombre_completo
    if doctor_update.especialidad is not None:
        current_user.especialidad = doctor_update.especialidad
    if doctor_update.biografia is not None:
        current_user.biografia = doctor_update.biografia
    if doctor_update.logo_url is not None:
        current_user.logo_url = doctor_update.logo_url
    if doctor_update.photo_url is not None:
        current_user.photo_url = doctor_update.photo_url
    if doctor_update.theme_primary_color is not None:
        current_user.theme_primary_color = doctor_update.theme_primary_color
    if doctor_update.password is not None:
        current_user.password_hash = hash_password(doctor_update.password)
    
    db.commit()
    db.refresh(current_user)
    
    return current_user

