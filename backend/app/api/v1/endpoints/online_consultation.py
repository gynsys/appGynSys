from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.base import get_db
from app.db.models.online_consultation_settings import OnlineConsultationSettings
from app.db.models.doctor import Doctor
from app.schemas import online_consultation as schemas
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()

@router.get("/settings/{doctor_slug}", response_model=schemas.OnlineConsultationSettings)
def get_public_settings(
    doctor_slug: str,
    db: Session = Depends(get_db)
):
    """
    Get online consultation settings for a doctor (public endpoint).
    Used by the chatbot to display pricing and configuration.
    """
    doctor = db.query(Doctor).filter(Doctor.slug_url == doctor_slug).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    settings = db.query(OnlineConsultationSettings).filter(
        OnlineConsultationSettings.doctor_id == doctor.id
    ).first()
    
    # If no settings exist, return defaults
    if not settings:
        return schemas.OnlineConsultationSettings(
            id=0,
            doctor_id=doctor.id,
            first_consultation_price=50.0,
            followup_price=40.0,
            currency="USD",
            payment_methods=["zelle", "paypal", "bank_transfer"],
            available_hours={"start": "09:00", "end": "17:00", "days": [1, 2, 3, 4, 5]},
            session_duration_minutes=45,
            is_active=True
        )
    
    return settings


@router.get("/settings", response_model=schemas.OnlineConsultationSettings)
def get_my_settings(
    db: Session = Depends(get_db),
    current_user: Doctor = Depends(get_current_user)
):
    """
    Get online consultation settings for the current doctor.
    """
    settings = db.query(OnlineConsultationSettings).filter(
        OnlineConsultationSettings.doctor_id == current_user.id
    ).first()
    
    # If no settings exist, create defaults
    if not settings:
        settings = OnlineConsultationSettings(
            doctor_id=current_user.id,
            first_consultation_price=50.0,
            followup_price=40.0,
            currency="USD",
            payment_methods=["zelle", "paypal", "bank_transfer"],
            available_hours={"start": "09:00", "end": "17:00", "days": [1, 2, 3, 4, 5]},
            session_duration_minutes=45,
            is_active=True
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)
    
    return settings


@router.put("/settings", response_model=schemas.OnlineConsultationSettings)
def update_my_settings(
    settings_update: schemas.OnlineConsultationSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: Doctor = Depends(get_current_user)
):
    """
    Update online consultation settings for the current doctor.
    """
    settings = db.query(OnlineConsultationSettings).filter(
        OnlineConsultationSettings.doctor_id == current_user.id
    ).first()
    
    # Create if doesn't exist
    if not settings:
        settings = OnlineConsultationSettings(doctor_id=current_user.id)
        db.add(settings)
    
    # Update fields
    update_data = settings_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(settings, key, value)
    
    db.commit()
    db.refresh(settings)
    return settings
