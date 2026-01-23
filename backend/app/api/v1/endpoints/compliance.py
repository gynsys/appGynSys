from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.base import get_db
from app.api.v1.endpoints.auth import get_current_user
from app.db.models.patient import Patient
# Assuming User model exists and is used for auth
# from app.db.models.user import User 

router = APIRouter()

@router.get("/download-my-data")
def download_my_data(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export all data related to the current user."""
    # Logic to gather all user data
    # This assumes the user is a patient or has a linked patient record
    patient_data = db.query(Patient).filter(Patient.email == current_user.email).first()
    
    if not patient_data:
        # If user is a doctor, maybe export their profile?
        return {
            "user_info": {
                "email": current_user.email,
                "role": "doctor" # Assuming doctor role
            },
            "message": "No patient data found for this account."
        }
    
    return {
        "user_info": {
            "email": current_user.email,
            "name": patient_data.name
        },
        "medical_data": {
            "history": patient_data.medical_history,
            "phone": patient_data.phone,
            "dob": patient_data.date_of_birth
        }
    }

@router.delete("/delete-my-account")
def delete_my_account(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Hard delete user account and related data."""
    # Cascade delete logic would typically be handled by DB foreign keys
    # But we can explicitly delete the user record
    
    # CAUTION: This is a hard delete.
    try:
        db.delete(current_user)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
        
    return {"message": "Account permanently deleted"}
