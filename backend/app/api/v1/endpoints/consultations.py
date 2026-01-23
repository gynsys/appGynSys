import os
from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session
from app.schemas.consultation import ConsultationCreate, ConsultationUpdate
from app.utils.pdf_generator import generate_medical_report, generate_summary_report
from app.db.base import get_db
from app.db.models.consultation import Consultation
from app.db.models.appointment import Appointment
from app.core.config import settings
from app.api.v1.endpoints.auth import get_current_user
from app.db.models.doctor import Doctor
from app.services.consultation_service import ConsultationService

router = APIRouter()

@router.post("/")
async def create_consultation(
    consultation: ConsultationCreate, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: Doctor = Depends(get_current_user)
):
    try:
        db_consultation = ConsultationService.create(
            db=db,
            consultation_in=consultation,
            doctor_id=current_user.id
        )
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    return {
        "status": "success",
        "message": "Consultation saved",
        "consultation_id": db_consultation.id,
        "pdf_url": f"/api/v1/consultations/{db_consultation.id}/history_pdf",
        "pdf_report_url": f"/api/v1/consultations/{db_consultation.id}/pdf"
    }

@router.get("/")
def get_consultations(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=0),
    db: Session = Depends(get_db)
):
    consultations = db.query(Consultation).order_by(Consultation.created_at.desc()).offset(skip).limit(limit).all()
    return consultations

@router.get("/patient/all", response_model=list)
def get_all_consultations_by_patient(
    dni: str,
    db: Session = Depends(get_db),
    current_user: Doctor = Depends(get_current_user)
):
    """
    Get ALL consultations for a specific patient (by DNI), ordered newest first.
    Used to display complete medical history in the consultation view.
    """
    consultations = db.query(Consultation).filter(
        Consultation.patient_ci == dni,
        Consultation.doctor_id == current_user.id
    ).order_by(Consultation.created_at.desc()).all()
    
    return [{
        "diagnosis": c.diagnosis,
        "plan": c.plan,
        "physical_exam": c.physical_exam,
        "observations": c.observations,
        "ultrasound": c.ultrasound,
        "created_at": c.created_at,
    } for c in consultations]

@router.get("/patient/latest", response_model=dict)
def get_latest_consultation_by_patient(
    dni: str,
    db: Session = Depends(get_db),
    current_user: Doctor = Depends(get_current_user)
):
    """
    Get the most recent consultation for a specific patient (by DNI).
    Used to display "Previous History" in the consultation view.
    """
    consultation = db.query(Consultation).filter(
        Consultation.patient_ci == dni,
        Consultation.doctor_id == current_user.id
    ).order_by(Consultation.created_at.desc()).first()

    if not consultation:
        return {}

    return {
        # Doctor Inputs (For History Card)
        "diagnosis": consultation.diagnosis,
        "plan": consultation.plan,
        "physical_exam": consultation.physical_exam,
        "observations": consultation.observations,
        "ultrasound": consultation.ultrasound,
        "created_at": consultation.created_at,

        # Patient & Summary Data (For Pre-filling)
        "patient_name": consultation.patient_name,
        "patient_ci": consultation.patient_ci,
        "patient_age": consultation.patient_age,
        "patient_phone": consultation.patient_phone,
        "reason_for_visit": consultation.reason_for_visit,
        "family_history_mother": consultation.family_history_mother,
        "family_history_father": consultation.family_history_father,
        "personal_history": consultation.personal_history,
        "supplements": consultation.supplements,
        "surgical_history": consultation.surgical_history,
        "obstetric_history_summary": consultation.obstetric_history_summary,
        "functional_exam_summary": consultation.functional_exam_summary,
        "habits_summary": consultation.habits_summary
    }

@router.put("/{consultation_id}")
def update_consultation(
    consultation_id: int,
    consultation_update: ConsultationUpdate,
    db: Session = Depends(get_db)
):
    db_consultation = db.query(Consultation).filter(Consultation.id == consultation_id).first()
    if not db_consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")
    
    update_data = consultation_update.dict(exclude_unset=True)
    
    # Map schema fields to DB model fields if names differ
    # Schema: full_name -> DB: patient_name
    # Schema: ci -> DB: patient_ci
    # Schema: age -> DB: patient_age
    # Schema: phone -> DB: patient_phone
    # Schema: summary_gyn_obstetric -> DB: obstetric_history_summary
    # Schema: summary_functional_exam -> DB: functional_exam_summary
    # Schema: summary_habits -> DB: habits_summary
    # Schema: admin_physical_exam -> DB: physical_exam
    # Schema: admin_ultrasound -> DB: ultrasound
    # Schema: admin_diagnosis -> DB: diagnosis
    # Schema: admin_plan -> DB: plan
    # Schema: admin_observations -> DB: observations
    
    field_mapping = {
        "full_name": "patient_name",
        "ci": "patient_ci",
        "age": "patient_age",
        "phone": "patient_phone",
        "summary_gyn_obstetric": "obstetric_history_summary",
        "summary_functional_exam": "functional_exam_summary",
        "summary_habits": "habits_summary",
        "admin_physical_exam": "physical_exam",
        "admin_ultrasound": "ultrasound",
        "admin_diagnosis": "diagnosis",
        "admin_plan": "plan",
        "admin_observations": "observations"
    }

    for key, value in update_data.items():
        db_key = field_mapping.get(key, key)
        if hasattr(db_consultation, db_key):
            setattr(db_consultation, db_key, value)

    try:
        db.commit()
        db.refresh(db_consultation)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating consultation: {str(e)}")

    return {"status": "success", "message": "Consultation updated", "consultation": db_consultation}

@router.delete("/{consultation_id}")
def delete_consultation(
    consultation_id: int,
    db: Session = Depends(get_db)
):
    consultation = db.query(Consultation).filter(Consultation.id == consultation_id).first()
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")
    
    db.delete(consultation)
    db.commit()
    return {"status": "success", "message": "Consultation deleted"}

@router.get("/{id}/pdf")
def get_consultation_pdf(
    id: int,
    db: Session = Depends(get_db)
):
    consultation = db.query(Consultation).filter(Consultation.id == id).first()
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")

    # Map DB model to dictionary expected by PDF generator
    # Map DB model to dictionary expected by PDF generator
    data = _map_consultation_to_data(consultation)

    # Generate PDF (Summary Report)
    pdf_buffer = generate_summary_report(data, consultation.doctor_id, db)
    
    return Response(content=pdf_buffer.getvalue(), media_type="application/pdf")

@router.get("/{id}/history_pdf")
def get_consultation_history_pdf(
    id: int,
    db: Session = Depends(get_db)
):
    # Get the requested consultation to extract patient info
    consultation = db.query(Consultation).filter(Consultation.id == id).first()
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")

    # Fetch ALL consultations for this patient (same CI and doctor)
    all_consultations = db.query(Consultation).filter(
        Consultation.patient_ci == consultation.patient_ci,
        Consultation.doctor_id == consultation.doctor_id
    ).order_by(Consultation.created_at.asc()).all()  # ASC = oldest first

    # Use the MOST RECENT consultation for preconsultation data (demographics)
    latest = all_consultations[-1] if all_consultations else consultation
    
    # Map preconsultation data from latest consultation
    data = {
        "full_name": latest.patient_name,
        "ci": latest.patient_ci,
        "age": latest.patient_age,
        "phone": latest.patient_phone,
        "reason_for_visit": latest.reason_for_visit,
        "family_history_mother": latest.family_history_mother,
        "family_history_father": latest.family_history_father,
        "personal_history": latest.personal_history,
        "supplements": latest.supplements,
        "surgical_history": latest.surgical_history,
        "summary_gyn_obstetric": latest.obstetric_history_summary,
        "summary_functional_exam": latest.functional_exam_summary,
        "summary_habits": latest.habits_summary,
        "history_number": latest.history_number,
        "address": "", 
        "occupation": "",
        
        # Add ALL consultations for cumulative display
        "all_consultations": [
            {
                "created_at": c.created_at,
                "physical_exam": c.physical_exam,
                "ultrasound": c.ultrasound,
                "diagnosis": c.diagnosis,
                "plan": c.plan,
                "observations": c.observations,
            }
            for c in all_consultations
        ]
    }

    # Generate PDF (Medical History with ALL consultations)
    pdf_buffer = generate_medical_report(data, consultation.doctor_id, db)
    
    return Response(content=pdf_buffer.getvalue(), media_type="application/pdf")

from pydantic import BaseModel, EmailStr

class SendEmailRequest(BaseModel):
    email: EmailStr

@router.post("/{id}/send-email")
def send_consultation_email(
    id: int,
    email_data: SendEmailRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    consultation = db.query(Consultation).filter(Consultation.id == id).first()
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")

    # Generate PDF in-memory to avoid self-request deadlock
    data = _map_consultation_to_data(consultation)
    pdf_buffer = generate_summary_report(data, consultation.doctor_id, db)
    pdf_bytes = pdf_buffer.getvalue()

    # URL for the report (still needed for the button)
    report_url = f"/api/v1/consultations/{consultation.id}/pdf"
    
    # Import task here to avoid circular imports if any
    from app.tasks.email_tasks import send_consultation_report_email
    
    background_tasks.add_task(
        send_consultation_report_email, 
        email=email_data.email, 
        patient_name=consultation.patient_name, 
        report_url=report_url,
        pdf_bytes=pdf_bytes
    )
    
    return {"status": "success", "message": "Email queued"}

def _map_consultation_to_data(consultation):
    return {
        "full_name": consultation.patient_name,
        "ci": consultation.patient_ci,
        "age": consultation.patient_age,
        "phone": consultation.patient_phone,
        "reason_for_visit": consultation.reason_for_visit,
        "family_history_mother": consultation.family_history_mother,
        "family_history_father": consultation.family_history_father,
        "personal_history": consultation.personal_history,
        "supplements": consultation.supplements,
        "surgical_history": consultation.surgical_history,
        "summary_gyn_obstetric": consultation.obstetric_history_summary,
        "summary_functional_exam": consultation.functional_exam_summary,
        "summary_habits": consultation.habits_summary,
        "admin_physical_exam": consultation.physical_exam,
        "admin_ultrasound": consultation.ultrasound,
        "admin_diagnosis": consultation.diagnosis,
        "admin_plan": consultation.plan,
        "admin_observations": consultation.observations,
        "history_number": consultation.history_number,
        "address": "", 
        "occupation": "",
        "created_at": consultation.created_at,
    }
