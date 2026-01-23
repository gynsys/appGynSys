from sqlalchemy.orm import Session
from sqlalchemy import extract
from datetime import datetime
from app.db.models.consultation import Consultation


def get_or_create_history_number(db: Session, patient_ci: str, doctor_id: int) -> str:
    """
    Get existing medical history number for patient+doctor, or create a new one.
    
    Format: HM-{YEAR}-D{DOCTOR_ID:03d}-P{SEQ:04d}
    Example: HM-2026-D001-P0042
    
    Logic:
    - One unique number per patient (based on CI) per doctor
    - Reused across all consultations for the same patient
    - Sequential numbering within doctor/year
    
    Args:
        db: Database session
        patient_ci: Patient's CI/DNI
        doctor_id: Doctor's ID
        
    Returns:
        str: Medical history number (e.g., "HM-2026-D001-P0042")
    """
    current_year = datetime.now().year
    
    # Check if patient already has a history number with this doctor
    existing = db.query(Consultation).filter(
        Consultation.patient_ci == patient_ci,
        Consultation.doctor_id == doctor_id
    ).first()
    
    if existing and existing.history_number and existing.history_number.startswith('HM-'):
        # Patient already has a valid history number, reuse it
        return existing.history_number
    
    # Count existing unique patients (by CI) for this doctor in current year
    # This ensures sequential numbering even if we're reusing numbers
    unique_patients = db.query(Consultation.patient_ci).filter(
        Consultation.doctor_id == doctor_id,
        extract('year', Consultation.created_at) == current_year,
        Consultation.patient_ci.isnot(None)
    ).distinct().count()
    
    # Next sequential number
    next_seq = unique_patients + 1
    
    # Generate new history number
    history_number = f"HM-{current_year}-D{doctor_id:03d}-P{next_seq:04d}"
    
    return history_number
