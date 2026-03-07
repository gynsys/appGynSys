"""
Appointment endpoints for managing appointments.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Annotated, List, Union

from app.core.config import settings
from app.db.base import get_db
from app.db.models.doctor import Doctor
from app.db.models.appointment import Appointment
from app.schemas.appointment import AppointmentInDB, AppointmentUpdate, AppointmentCreate
from app.api.v1.endpoints.auth import get_current_user
from app.cycle_predictor.router import get_current_actor
from app.db.models.cycle_user import CycleUser
from app.tasks.email_tasks import send_appointment_notification_email, send_appointment_status_update, send_preconsulta_completed_notification, send_platform_registration_invitation
from app.services.summary_generator import ClinicalSummaryGenerator
from datetime import datetime, timedelta
import logging
import json

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/public", response_model=AppointmentInDB, status_code=status.HTTP_201_CREATED)
async def create_public_appointment(
    appointment_data: AppointmentCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new appointment (public endpoint for patients).
    Patients can create appointments without authentication.
    """
    # Verify that the doctor exists
    doctor = db.query(Doctor).filter(Doctor.id == appointment_data.doctor_id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )
    
    if not doctor.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Doctor is not accepting appointments"
        )
    
    db_appointment = Appointment(**appointment_data.model_dump())
    db.add(db_appointment)
    db.commit()
    db.refresh(db_appointment)
    
    # Send notification email to doctor
    try:
        # Format date safely
        date_str = db_appointment.appointment_date.strftime("%d/%m/%Y %H:%M") if db_appointment.appointment_date else "Fecha por definir"
        
        send_appointment_notification_email.delay(
            doctor_email=doctor.email,
            doctor_name=doctor.nombre_completo,
            patient_name=db_appointment.patient_name,
            appointment_date=date_str,
            appointment_type=db_appointment.appointment_type or "No especificado",
            reason=db_appointment.reason_for_visit or "No especificado",
            phone=db_appointment.patient_phone or "No especificado"
        )
    except Exception as e:
        pass
    
    return db_appointment


@router.post("/", response_model=AppointmentInDB, status_code=status.HTTP_201_CREATED)
async def create_appointment(
    appointment_data: AppointmentCreate,
    current_user: Annotated[Doctor, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """
    Create a new appointment.
    Only the doctor can create appointments for their own account.
    """
    # Verify that the appointment is for the current doctor
    if appointment_data.doctor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot create appointment for another doctor"
        )
    
    db_appointment = Appointment(**appointment_data.model_dump())
    db.add(db_appointment)
    db.commit()
    db.refresh(db_appointment)
    
    return db_appointment


@router.get("/", response_model=List[AppointmentInDB])
async def get_appointments(
    current_actor: Annotated[Union[Doctor, CycleUser], Depends(get_current_actor)],
    db: Session = Depends(get_db)
):
    """
    Get all appointments for the current actor.
    If Doctor: all appointments for their account.
    If CycleUser: appointments matching their email or CI.
    """
    if isinstance(current_actor, Doctor):
        appointments = db.query(Appointment).filter(
            Appointment.doctor_id == current_actor.id
        ).all()
    else:
        # For CycleUser, search by email or CI
        # Usually CycleUser.email is the best link
        appointments = db.query(Appointment).filter(
            (Appointment.patient_email == current_actor.email) | 
            (Appointment.patient_dni == current_actor.ci)
        ).all()
    
    return appointments


@router.get("/{appointment_id}", response_model=AppointmentInDB)
async def get_appointment(
    appointment_id: int,
    current_user: Annotated[Doctor, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """
    Get a specific appointment by ID.
    """
    appointment = db.query(Appointment).filter(
        Appointment.id == appointment_id,
        Appointment.doctor_id == current_user.id
    ).first()
    
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    return appointment


@router.put("/{appointment_id}", response_model=AppointmentInDB)
async def update_appointment(
    appointment_id: int,
    appointment_update: AppointmentUpdate,
    current_user: Annotated[Doctor, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """
    Update an appointment.
    """
    appointment = db.query(Appointment).filter(
        Appointment.id == appointment_id,
        Appointment.doctor_id == current_user.id
    ).first()
    
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    # Check for status change
    old_status = appointment.status

    # Update fields
    update_data = appointment_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(appointment, field, value)
    
    db.commit()
    db.refresh(appointment)
    
    # Send email if status changed
    if "status" in update_data and update_data["status"] != old_status:
        # Check for recurrence logic (If patient has previous history, don't send preconsulta link)
        is_recurrent = False

        # Check 0: Current appointment already has answers (pre-filled by chatbot)
        if appointment.preconsulta_answers is not None:
            is_recurrent = True

        if not is_recurrent and appointment.patient_dni:
            # Check for Previous Answers (Scoped to THIS doctor)
            has_answers = db.query(Appointment).filter(
                Appointment.patient_dni == appointment.patient_dni,
                Appointment.doctor_id == appointment.doctor_id,
                Appointment.id != appointment.id,
                Appointment.preconsulta_answers.isnot(None)
            ).count() > 0

            if has_answers:
                is_recurrent = True

        # Generate preconsulta link ONLY if NOT recurrent
        preconsulta_link = None
        if not is_recurrent:
            preconsulta_link = f"{settings.FRONTEND_URL}/dr/{current_user.slug_url}/preconsulta?appointment_id={appointment.id}"
        
        # Format date safely
        date_str = appointment.appointment_date.strftime("%d/%m/%Y %H:%M") if appointment.appointment_date else "Fecha por definir"

        send_appointment_status_update.delay(
            patient_email=appointment.patient_email,
            patient_name=appointment.patient_name,
            status=appointment.status,
            appointment_date=date_str,
            doctor_name=current_user.nombre_completo,
            preconsulta_link=preconsulta_link,
        )

    return appointment



@router.delete("/{appointment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_appointment(
    appointment_id: int,
    current_user: Annotated[Doctor, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """
    Delete an appointment.
    """
    appointment = db.query(Appointment).filter(
        Appointment.id == appointment_id,
        Appointment.doctor_id == current_user.id
    ).first()
    
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    db.delete(appointment)
    db.commit()
    
    return None


@router.post("/{appointment_id}/preconsulta", status_code=status.HTTP_200_OK)
async def submit_preconsulta(
    appointment_id: int,
    answers: dict,
    db: Session = Depends(get_db)
):
    """
    Submit preconsulta answers for an appointment.
    Public endpoint (secured by appointment ID knowledge).
    """
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    
    print(f"--- SUBMIT PRECONSULTA ---")
    print(f"ID: {appointment_id}")
    print(f"Received {len(answers)} answers.")
    print(f"Patient Name in Answers: {answers.get('full_name', 'Unknown')}")
    
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    # Save answers as JSON string
    appointment.preconsulta_answers = json.dumps(answers)
    # Update status if it was just scheduled/confirmed
    if appointment.status in ["scheduled", "confirmed"]:
        appointment.status = "preconsulta_completed"
        
    db.commit()
    
    # Notify doctor
    try:
        doctor = db.query(Doctor).filter(Doctor.id == appointment.doctor_id).first()
        if doctor:
            # Generate Clinical Summary for Email
            # Generate Clinical Summary for Email
            summary_html = None
            try:
                # ADAPTING DATA FOR GENERATOR
                formatted_answers = []
                # fetch questions to map keys to text
                from app.crud import preconsultation as crud_preconsulta
                all_questions = crud_preconsulta.get_questions(db, doctor_id=appointment.doctor_id, limit=200)
                q_map = {str(q.id): q for q in all_questions}
                
                readable_map = {}
                formatted_answers = []

                for key, val in answers.items():
                    # key might be ID or variable name
                    # If ID is in map
                    q_text = ""
                    qid = key
                    if key in q_map:
                        q_text = q_map[key].text
                        # Build readable map (Snapshotted text)
                        if q_text:
                            readable_map[q_text] = val
                    
                    # Mock answer object for generator
                    formatted_answers.append({
                        "question_id": qid,
                        "text_value": val,
                        "question": {"text": q_text}
                    })

                # Pass template_data to enable Narrative Generator
                template_data = []
                for q in all_questions:
                    template_data.append({
                        "id": q.id,
                        "text": q.text,
                        "type": q.type,
                        "category": q.category,
                        "options": q.options,
                        "order": q.order
                    })

                summary_data = ClinicalSummaryGenerator.generate(appointment, formatted_answers, template_data=template_data)
                summary_html = summary_data.get('full_narrative_html')

                # SAVE GENERATED SUMMARIES TO ANSWERS JSON
                # This ensures the Frontend sees the narratives in DoctorConsultationPage
                # CRITICAL: Overwrite the frontend-sent 'obstetric_history_summary' with our full narrative
                answers['obstetric_history_summary'] = summary_data.get('summary_obstetric')
                answers['summary_gyn_obstetric'] = summary_data.get('summary_obstetric') # Keep for redundancy
                answers['summary_functional_exam'] = summary_data.get('summary_functional')
                answers['summary_habits'] = summary_data.get('summary_lifestyle')
                answers['summary_medical'] = summary_data.get('summary_medical')
                answers['summary_general'] = summary_data.get('summary_general')
                
                # Save Human Readable Snapshot (User Request)
                answers['_human_readable'] = readable_map
                
                # Re-save updated answers to DB
                appointment.preconsulta_answers = json.dumps(answers)
                db.commit()
            except Exception as e:
                print(f"Error generating summary: {e}")
                # Continue without summary
                summary_html = None

            # Backfill missing data from Appointment Record (Dashboard Logic)
            merged_data = answers.copy()
            if not merged_data.get('ci'): merged_data['ci'] = appointment.patient_dni
            if not merged_data.get('age'): merged_data['age'] = appointment.patient_age
            if not merged_data.get('email'): merged_data['email'] = appointment.patient_email
            if not merged_data.get('phone'): merged_data['phone'] = appointment.patient_phone
            if not merged_data.get('full_name'): merged_data['full_name'] = appointment.patient_name
            
            # Reason logic priority
            if not merged_data.get('reason_for_visit') and not merged_data.get('gyn_reason'):
                 merged_data['reason_for_visit'] = appointment.reason_for_visit
            
            date_str = appointment.appointment_date.strftime("%d/%m/%Y %H:%M") if appointment.appointment_date else "Fecha por definir"

            send_preconsulta_completed_notification.delay(
                doctor_email=doctor.email,
                doctor_name=doctor.nombre_completo,
                patient_name=appointment.patient_name,
                appointment_date=date_str,
                patient_data=merged_data,
                primary_color=doctor.theme_primary_color or '#4F46E5',
                summary_html=summary_html
            )

            # Correo 2: Invitar a la paciente a registrarse en la plataforma
            # Solo si la paciente tiene email y aún no tiene una cuenta registrada
            if appointment.patient_email:
                try:
                    import secrets
                    from datetime import timezone
                    from app.db.models.patient_activation_token import PatientActivationToken
                    from app.db.models.cycle_user import CycleUser as CycleUserModel

                    # Check if the patient already has an account
                    already_registered = db.query(CycleUserModel).filter(
                        CycleUserModel.email == appointment.patient_email
                    ).first()

                    if not already_registered:
                        # Generate a new 48-hour registration token
                        reg_token = secrets.token_urlsafe(48)
                        reg_token_record = PatientActivationToken(
                            email=appointment.patient_email,
                            token=reg_token,
                            doctor_id=appointment.doctor_id,
                            appointment_id=appointment.id,
                            expires_at=datetime.now(timezone.utc) + timedelta(hours=48),
                        )
                        db.add(reg_token_record)
                        db.commit()
                        registration_link = f"{settings.FRONTEND_URL}/activar-cuenta?token={reg_token}"

                        send_platform_registration_invitation.delay(
                            patient_email=appointment.patient_email,
                            patient_name=appointment.patient_name,
                            doctor_name=doctor.nombre_completo,
                            registration_link=registration_link,
                        )
                except Exception as reg_err:
                    logger.error(f"Error sending registration invitation for appointment {appointment_id}: {reg_err}", exc_info=True)
    except Exception as e:
        pass
    
    return {"status": "success", "message": "Preconsulta saved"}

