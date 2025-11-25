"""
Public profile endpoints for doctor profiles.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.base import get_db
from app.db.models.doctor import Doctor
from app.schemas.doctor import DoctorPublic

router = APIRouter()


@router.get("/{slug}", response_model=DoctorPublic)
async def get_doctor_profile(
    slug: str,
    db: Session = Depends(get_db)
):
    """
    Get public profile of a doctor by their slug URL.
    
    This is the public endpoint used by patients to view a doctor's digital clinic.
    Returns only public information (excludes sensitive data).
    """
    doctor = db.query(Doctor).filter(Doctor.slug_url == slug).first()
    
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor profile not found"
        )
    
    if not doctor.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor profile not found"
        )
    
    return doctor

