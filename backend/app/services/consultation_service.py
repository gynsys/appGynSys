from sqlalchemy.orm import Session
from app.schemas.consultation import ConsultationCreate
from app.db.models.consultation import Consultation
from app.db.models.appointment import Appointment
from app.utils.history_number import get_or_create_history_number

class ConsultationService:
    @staticmethod
    def create(db: Session, consultation_in: ConsultationCreate, doctor_id: int) -> Consultation:
        """
        Creates a new consultation record, updates the appointment status,
        and handles related business logic.
        """
        
        # 1. Create Consultation record
        db_consultation = Consultation(
            doctor_id=doctor_id,
            # Patient Snapshot
            patient_name=consultation_in.full_name,
            patient_ci=consultation_in.ci,
            patient_age=consultation_in.age,
            patient_phone=consultation_in.phone,
            
            # Pre-consultation
            reason_for_visit=consultation_in.reason_for_visit,
            family_history_mother=consultation_in.family_history_mother,
            family_history_father=consultation_in.family_history_father,
            personal_history=consultation_in.personal_history,
            supplements=consultation_in.supplements,
            surgical_history=consultation_in.surgical_history,
            obstetric_history_summary=consultation_in.summary_gyn_obstetric,
            functional_exam_summary=consultation_in.summary_functional_exam,
            habits_summary=consultation_in.summary_habits,
            
            # Doctor Inputs
            physical_exam=consultation_in.admin_physical_exam,
            ultrasound=consultation_in.admin_ultrasound,
            diagnosis=consultation_in.admin_diagnosis,
            plan=consultation_in.admin_plan,
            observations=consultation_in.admin_observations,
            
            # Metadata - Auto-generate history number
            history_number=get_or_create_history_number(
                db=db,
                patient_ci=consultation_in.ci,
                doctor_id=doctor_id
            ),
            
            # Initial PDF path (will be dynamic)
            pdf_path="dynamic"
        )
        
        db.add(db_consultation)
        db.commit()
        db.refresh(db_consultation)
        
        # 2. Update Appointment Status if provided
        if consultation_in.appointment_id:
            try:
                appointment = db.query(Appointment).filter(Appointment.id == consultation_in.appointment_id).first()
                if appointment:
                    appointment.status = "completed"
                    db.add(appointment) # Ensure it's in the session
                    db.commit()
            except Exception as e:
                pass
                # We don't raise here to avoid rolling back the consultation creation
                # but in a strict transaction, we might want to.
                
        return db_consultation

    @staticmethod
    def get_history_data(db: Session, consultation_id: int) -> dict:
        """
        Fetches all consultation data for a patient to reconstruct their medical history.
        Used by both PDF generators and HTML/JSON views.
        """
        # 1. Get the target consultation
        consultation = db.query(Consultation).filter(Consultation.id == consultation_id).first()
        if not consultation:
            return None

        # 2. Fetch ALL consultations for this patient (same CI and doctor)
        all_consultations = db.query(Consultation).filter(
            Consultation.patient_ci == consultation.patient_ci,
            Consultation.doctor_id == consultation.doctor_id
        ).order_by(Consultation.created_at.asc()).all()

        # 3. Use the most recent one for demographics
        latest = all_consultations[-1] if all_consultations else consultation
        
        return {
            "id": latest.id,
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
            "address": getattr(latest, 'address', "") or "", 
            "occupation": getattr(latest, 'occupation', "") or "",
            "doctor_id": latest.doctor_id,
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

    @staticmethod
    def get_consultation_data(db: Session, consultation_id: int) -> dict:
        """
        Fetches data for a SINGLE consultation (Medical Report).
        Used for HTML/JSON views of individual reports.
        """
        consultation = db.query(Consultation).filter(Consultation.id == consultation_id).first()
        if not consultation:
            return None

        return {
            "id": consultation.id,
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
            "history_number": consultation.history_number,
            "address": getattr(consultation, 'address', "") or "", 
            "occupation": getattr(consultation, 'occupation', "") or "",
            "doctor_id": consultation.doctor_id,
            "assets": [
                {
                    "id": a.id,
                    "file_path": a.file_path,
                    "file_name": a.file_name,
                    "file_type": a.file_type,
                    "file_size_bytes": a.file_size_bytes,
                    "created_at": a.created_at
                }
                for a in consultation.assets
            ] if consultation.assets else [],
            "physical_exam": consultation.physical_exam,
            "ultrasound": consultation.ultrasound,
            "diagnosis": consultation.diagnosis,
            "plan": consultation.plan,
            "observations": consultation.observations,
            "created_at": consultation.created_at,
            "is_single_report": True
        }
