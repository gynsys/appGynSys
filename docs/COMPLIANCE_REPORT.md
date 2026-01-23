# Compliance & Data-Privacy Audit Report (GDPR/HIPAA)

## 1. Data Encryption

### Findings
- **Unencrypted Sensitive Data**: The following fields in `app/db/models` are stored as plain text:
    - `Patient.name`, `Patient.email`, `Patient.phone`
    - `Patient.medical_history`
    - `Consultation.diagnosis`, `Consultation.plan`, `Consultation.physical_exam`
- **Risk**: In the event of a database dump leak, all patient medical history is exposed.

### Recommendations
- Implement application-level encryption (e.g., using `cryptography.fernet`) for `medical_history` and `diagnosis` fields.
- Alternatively, use database-level encryption (TDE) if supported by the deployment environment.

## 2. Data Sovereignty & Rights

### Findings
- **Missing Endpoints**:
    - `/download-my-data`: No endpoint exists to allow users/patients to export their data in a portable format (JSON/CSV).
    - `/delete-my-account`: No endpoint exists for "Right to be Forgotten" (hard delete).
- **Consent**: No explicit consent timestamp recording found in the `Patient` model.

### Recommendations
- Add `consent_at` timestamp to `Patient` model.
- Implement the missing endpoints.

## 3. Fix Implementation

### New Router: `app/api/v1/endpoints/compliance.py`

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.base import get_db
from app.api.v1.endpoints.auth import get_current_user
from app.db.models.patient import Patient
from app.db.models.user import User

router = APIRouter()

@router.get("/download-my-data")
def download_my_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export all data related to the current user."""
    # Logic to gather all user data
    patient_data = db.query(Patient).filter(Patient.email == current_user.email).first()
    if not patient_data:
        raise HTTPException(status_code=404, detail="Patient data not found")
    
    return {
        "user_info": {
            "email": current_user.email,
            "name": current_user.full_name
        },
        "medical_data": {
            "history": patient_data.medical_history,
            # ... include other fields
        }
    }

@router.delete("/delete-my-account")
def delete_my_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Hard delete user account and related data."""
    # Cascade delete logic
    db.delete(current_user)
    db.commit()
    return {"message": "Account permanently deleted"}
```
