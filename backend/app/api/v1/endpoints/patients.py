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
