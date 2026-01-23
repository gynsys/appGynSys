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
