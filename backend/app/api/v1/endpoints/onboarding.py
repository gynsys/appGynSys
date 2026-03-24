from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.base import get_db
from app.db.models.doctor import Doctor
from app.db.models.patient import Patient
from app.db.models.appointment import Appointment
from app.db.models.preconsultation import PreconsultationQuestion as PQ
from app.schemas.appointment import AppointmentCreate
from app.core.encryption import decrypt_text
from datetime import datetime
from typing import Any, Dict
import logging

logger = logging.getLogger(__name__)

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
        "id": doctor.id,
        "slug_url": doctor.slug_url,
        "doctor_name": doctor.nombre_completo,
        "doctor_photo": doctor.photo_url or doctor.logo_url,
        "theme_primary_color": doctor.theme_primary_color or "#4F46E5",
        "specialty": doctor.especialidad,
        "pdf_config": doctor.pdf_config or {}
    }

@router.get("/questions/{slug}")
def get_onboarding_questions(slug: str, db: Session = Depends(get_db)):
    """
    Public endpoint to get pre-consultation questions by doctor slug.
    """
    doctor = db.query(Doctor).filter(Doctor.slug_url == slug).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    questions = db.query(PQ).filter(PQ.doctor_id == doctor.id).order_by(PQ.order).all()
    
    # Decrypt
    results = []
    for q in questions:
        results.append({
            "id": q.id,
            "text": decrypt_text(q.text),
            "type": q.type,
            "category": q.category,
            "required": q.required,
            "options": [decrypt_text(opt) for opt in q.options] if q.options else [],
            "order": q.order
        })
        
    return results

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
    
    # 1. Extract Data from Nested Payload
    p_data = payload.get("patient_data", {})
    a_data = payload.get("appointment_data", {})
    
    full_name = p_data.get("patient_name") or p_data.get("full_name")
    dni = p_data.get("patient_dni") or p_data.get("ci")
    phone = p_data.get("patient_phone") or p_data.get("phone")
    email = p_data.get("patient_email") or p_data.get("email")
    age = p_data.get("patient_age") or p_data.get("age")
    address = p_data.get("residence") or p_data.get("address")
    occupation = p_data.get("occupation")
    
    if not full_name or not dni:
        raise HTTPException(status_code=400, detail="Nombre y Cédula son obligatorios")
    
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
    app_date_str = a_data.get("appointment_date")
    app_date = datetime.now() # Fallback
    if app_date_str:
        try:
            # Handle ISO format "2026-03-24T14:00:00.000Z"
            app_date = datetime.fromisoformat(app_date_str.replace("Z", "+00:00"))
        except Exception as e:
            logger.warning(f"Error parsing date {app_date_str}: {e}")

    new_appointment = Appointment(
        doctor_id=doctor.id,
        patient_name=full_name,
        patient_dni=dni,
        patient_phone=phone,
        patient_email=email,
        patient_age=age,
        residence=address,
        occupation=occupation,
        appointment_type=a_data.get("appointment_type", "Consulta Médica (Onboarding)"),
        reason_for_visit=a_data.get("reason_for_visit", "Primer Interrogatorio Unificado"),
        location=a_data.get("location"),
        status="pending_confirmation",
        appointment_date=app_date,
        preconsulta_answers=payload.get("answers", {}) # Save answers separately
    )
    
    db.add(new_appointment)
    
    try:
        db.commit()
        db.refresh(new_appointment)
        
        # 4. Success response
        return {
            "status": "success",
            "appointment_id": new_appointment.id,
            "message": "Onboarding completado exitosamente"
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Error saving unified onboarding: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error al procesar el registro")
