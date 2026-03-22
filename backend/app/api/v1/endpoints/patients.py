from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.db.base import get_db
from app.db.models.appointment import Appointment

router = APIRouter()

class CheckPatientRequest(BaseModel):
    name: str
    dni: str

@router.post("/check-existence")
def check_patient_existence(
    data: CheckPatientRequest,
    db: Session = Depends(get_db)
):
    """
    Check if a patient exists by matching Name and DNI in past appointments.
    """
    # Case insensitive search for name, exact match for DNI (ignoring whitespace)
    # We use the Appointment table as a proxy for Patients since a formal Patient table might not be populated purely from chats
    appointment = db.query(Appointment).filter(
        Appointment.patient_name.ilike(f"{data.name.strip()}"),
        Appointment.patient_dni == data.dni.strip()
    ).order_by(Appointment.id.desc()).first()
    
    if appointment:
        return {
            "exists": True,
            "patient_data": {
                "patient_name": appointment.patient_name,
                "patient_dni": appointment.patient_dni,
                "patient_age": appointment.patient_age,
                "patient_phone": appointment.patient_phone,
                "patient_email": appointment.patient_email,
                "occupation": appointment.occupation,
                "residence": appointment.residence
            }
        }
    
    return {"exists": False}

@router.get("/by-email")
def get_patient_by_email(
    email: str,
    db: Session = Depends(get_db)
):
    """
    Fetch the most recent patient data by their email address.
    Also checks if the user's account is verified to enforce 1-appointment grace period.
    Useful for auto-filling chatbots for returning patients.
    """
    from app.db.models.cycle_user import CycleUser
    import secrets
    from app.tasks.email_tasks import send_cycle_user_verification_email
    import logging
    logger = logging.getLogger(__name__)

    # Priority 1: Check CycleUser verification status
    cycle_user = db.query(CycleUser).filter(CycleUser.email == email).first()
    needs_verification = False
    
    # Priority 2: Get most recent appointment data
    appointments = db.query(Appointment).filter(
        Appointment.patient_email == email
    ).order_by(Appointment.id.desc()).all()
    
    recent_appointment = appointments[0] if appointments else None
    
    if cycle_user and not cycle_user.is_verified and len(appointments) >= 1:
        needs_verification = True
        # Auto-resend the email since they are hitting the chatbot again
        new_token = secrets.token_urlsafe(32)
        cycle_user.verification_token = new_token
        db.commit()
        try:
            send_cycle_user_verification_email.delay(
                cycle_user.email, 
                cycle_user.nombre_completo, 
                new_token
            )
        except Exception as e:
            logger.error(f"Failed to auto-resend verification email on /by-email: {e}")
            
    if recent_appointment:
        return {
            "exists": True,
            "needs_verification": needs_verification,
            "patient_data": {
                "patient_name": appointment.patient_name,
                "patient_dni": appointment.patient_dni,
                "patient_age": appointment.patient_age,
                "patient_phone": appointment.patient_phone,
                "patient_email": appointment.patient_email,
                "occupation": appointment.occupation,
                "residence": appointment.residence
            }
        }
    
    return {"exists": False}
