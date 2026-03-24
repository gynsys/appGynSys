from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.base import get_db
from app.db.models.doctor import Doctor
from app.db.models.patient import Patient
from app.db.models.appointment import Appointment
from app.schemas.appointment import AppointmentCreate
from datetime import datetime
from typing import Any, Dict
from app.core.logging import logger

router = APIRouter()

@router.get("/config/{slug}")
def get_onboarding_config(slug: str, db: Session = Depends(get_db)):
    """
    Public endpoint to get doctor configuration for onboarding.
    """
    doctor = db.query(Doctor).filter(Doctor.slug_url == slug).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    return {
        "doctor_name": doctor.nombre_completo,
        "doctor_photo": doctor.photo_url or doctor.logo_url,
        "theme_primary_color": doctor.theme_primary_color or "#4F46E5",
        "specialty": doctor.especialidad,
        "pdf_config": doctor.pdf_config or {}
    }

@router.post("/submit/{slug}")
def submit_unified_onboarding(
    slug: str, 
    payload: Dict[str, Any], 
    db: Session = Depends(get_db)
):
    """
    Unified submission for a new patient onboarding.
    Creates Patient, Appointment (Pending), and saves Preconsulta data.
    """
    doctor = db.query(Doctor).filter(Doctor.slug_url == slug).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    # 1. Extract Administrative Data
    full_name = payload.get("full_name")
    dni = payload.get("ci") or payload.get("patient_dni")
    phone = payload.get("phone") or payload.get("patient_phone")
    email = payload.get("email") or payload.get("patient_email")
    age = payload.get("age")
    address = payload.get("address")
    occupation = payload.get("occupation")
    
    if not full_name or not dni:
        raise ValueError("Nombre y Cédula son obligatorios")
    
    # 2. Find or Create Patient
    patient = db.query(Patient).filter(Patient.dni == dni).first()
    if not patient:
        patient = Patient(
            nombre_completo=full_name,
            dni=dni,
            telefono=phone,
            email=email,
            edad=age,
            residencia=address,
            ocupacion=occupation
        )
        db.add(patient)
        db.flush()
    else:
        # Update existing patient data if missing
        if not patient.telefono: patient.telefono = phone
        if not patient.email: patient.email = email
        if not patient.residencia: patient.residencia = address
        if not patient.ocupacion: patient.ocupacion = occupation
    
    # 3. Create Appointment (Fast Track Onboarding)
    # We create a "Pending Confirmation" appointment with current date/time as placeholder
    # OR we can leave date/time empty if the model allows it.
    new_appointment = Appointment(
        doctor_id=doctor.id,
        patient_name=full_name,
        patient_dni=dni,
        patient_phone=phone,
        patient_email=email,
        patient_age=age,
        residence=address,
        occupation=occupation,
        appointment_type="Consulta Médica (Onboarding)",
        reason_for_visit="Primer Interrogatorio Unificado",
        status="pending_confirmation",
        appointment_date=datetime.now(), # Placeholder
        preconsulta_answers=payload # Save all data here
    )
    
    db.add(new_appointment)
    
    try:
        db.commit()
        db.refresh(new_appointment)
        
        # 4. Trigger Notifications (Optional but recommended)
        # TODO: Trigger email to doctor/secretary
        
        return {
            "status": "success",
            "appointment_id": new_appointment.id,
            "message": "Onboarding completado exitosamente"
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Error saving unified onboarding: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error al procesar el registro")
