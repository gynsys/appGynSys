from sqlalchemy.orm import Session
from app.schemas.consultation import ConsultationCreate, ConsultationUpdate
from app.db.models.consultation import Consultation
from app.db.models.appointment import Appointment
from app.utils.history_number import get_or_create_history_number
from app.utils.medical_report_builder import build_narrative_summary

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
            address=consultation_in.address,
            occupation=consultation_in.occupation,
            patient_email=getattr(consultation_in, 'email', None),
            
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
    def clone(db: Session, consultation_id: int, consultation_update: ConsultationUpdate, doctor_id: int) -> Consultation:
        """
        Clones an existing consultation into a new record, applying updates.
        Used for 'Save As' functionality.
        """
        # 1. Get original
        original = db.query(Consultation).filter(
            Consultation.id == consultation_id,
            Consultation.doctor_id == doctor_id
        ).first()
        
        if not original:
            return None

        # 2. Map schema updates to DB fields
        update_data = consultation_update.dict(exclude_unset=True)
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

        # 3. Create new record based on original
        new_consultation = Consultation(
            doctor_id=doctor_id,
            patient_id=original.patient_id,
            patient_name=original.patient_name,
            patient_ci=original.patient_ci,
            patient_age=original.patient_age,
            patient_phone=original.patient_phone,
            patient_email=original.patient_email,
            address=original.address,
            occupation=original.occupation,
            
            reason_for_visit=original.reason_for_visit,
            family_history_mother=original.family_history_mother,
            family_history_father=original.family_history_father,
            personal_history=original.personal_history,
            supplements=original.supplements,
            surgical_history=original.surgical_history,
            obstetric_history_summary=original.obstetric_history_summary,
            functional_exam_summary=original.functional_exam_summary,
            habits_summary=original.habits_summary,
            
            physical_exam=original.physical_exam,
            ultrasound=original.ultrasound,
            diagnosis=original.diagnosis,
            plan=original.plan,
            observations=original.observations,
            
            history_number=original.history_number,
            pdf_path="dynamic"
        )

        # 4. Apply updates
        for key, value in update_data.items():
            db_key = field_mapping.get(key, key)
            if hasattr(new_consultation, db_key):
                setattr(new_consultation, db_key, value)

        db.add(new_consultation)
        db.commit()
        db.refresh(new_consultation)
        
        return new_consultation

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
        
        # --- DYNAMIC SUMMARY REGENERATION ---
        # Try to find raw answers from Appointment to regenerate summaries
        from app.services.summary_generator import GeneradorResumenes
        
        # We build the response dictionary first with stored data
        res = {
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
            "all_consultations": ConsultationService.merge_consultations(all_consultations, newest_first=True)
        }

        # 4. Get patient email if not in latest consultation
        email = getattr(latest, 'patient_email', "") or ""
        if not email:
            appt = db.query(Appointment).filter(
                Appointment.patient_dni == latest.patient_ci,
                Appointment.patient_email.is_not(None)
            ).order_by(Appointment.created_at.desc()).first()
            if appt:
                email = appt.patient_email
        res["email"] = email

        # Inject dynamic summaries (OVERWRITES stale data if raw answers found)

        # Inject dynamic summaries (OVERWRITES stale data if raw answers found)
        GeneradorResumenes.inyectar_dinamicamente(
            db=db, 
            data=res, 
            patient_ci=latest.patient_ci, 
            doctor_id=latest.doctor_id,
            patient_name=latest.patient_name
        )

        return res

    @staticmethod
    def get_consultation_data(db: Session, consultation_id: int) -> dict:
        """
        Fetches data for a SINGLE consultation (Medical Report).
        Used for HTML/JSON views of individual reports.
        """
        consultation = db.query(Consultation).filter(Consultation.id == consultation_id).first()
        if not consultation:
            return None

        # --- DYNAMIC SUMMARY REGENERATION ---
        from app.services.summary_generator import GeneradorResumenes
        
        res = {
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

        # Get patient email if not in consultation
        email = getattr(consultation, 'patient_email', "") or ""
        if not email:
            appt = db.query(Appointment).filter(
                Appointment.patient_dni == consultation.patient_ci,
                Appointment.patient_email.is_not(None)
            ).order_by(Appointment.created_at.desc()).first()
            if appt:
                email = appt.patient_email
        res["email"] = email

        # Inject dynamic summaries (OVERWRITES stale data if raw answers found)
        GeneradorResumenes.inyectar_dinamicamente(
            db=db, 
            data=res, 
            patient_ci=consultation.patient_ci, 
            doctor_id=consultation.doctor_id,
            patient_name=consultation.patient_name
        )

        # Build narrative summary (individual report only)
        # Note: we use our 'res' dict to benefit from injected summaries
        from app.utils.medical_report_builder import build_narrative_summary
        res.update(build_narrative_summary({
            "full_name": res.get("full_name"),
            "ci": res.get("ci"),
            "age": res.get("age"),
            "reason_for_visit": res.get("reason_for_visit"),
            "admin_ultrasound": res.get("ultrasound"),
            "admin_physical_exam": res.get("physical_exam"),
            "admin_diagnosis": res.get("diagnosis"),
            "admin_plan": res.get("plan"),
            "admin_observations": res.get("observations"),
            "summary_gyn_obstetric": res.get("summary_gyn_obstetric"),
            "summary_functional_exam": res.get("summary_functional_exam"),
        }))

        return res

    @staticmethod
    def merge_consultations(consultations_list: list, newest_first: bool = False) -> list:
        """
        Groups consultation records within a 3-day window into unified 'sessions'.
        Useful for cleaning up fragmented history views.
        Expects consultations_list sorted by created_at ASC (SQLAlchemy objects or dicts with created_at).
        """
        merged = []
        for c in consultations_list:
            is_merged = False
            
            # Extract values handle both Obj and Dict
            c_data = {
                "created_at": getattr(c, 'created_at', None) or (c.get('created_at') if isinstance(c, dict) else None),
                "physical_exam": getattr(c, 'physical_exam', None) or (c.get('physical_exam') if isinstance(c, dict) else None),
                "ultrasound": getattr(c, 'ultrasound', None) or (c.get('ultrasound') if isinstance(c, dict) else None),
                "diagnosis": getattr(c, 'diagnosis', None) or (c.get('diagnosis') if isinstance(c, dict) else None),
                "plan": getattr(c, 'plan', None) or (c.get('plan') if isinstance(c, dict) else None),
                "observations": getattr(c, 'observations', None) or (c.get('observations') if isinstance(c, dict) else None),
            }

            if merged:
                last = merged[-1]
                diff = abs((c_data["created_at"] - last["created_at"]).total_seconds())
                if diff < 3 * 24 * 60 * 60: # 3 days threshold
                    
                    def is_placeholder(val):
                        if not val: return True
                        v = str(val).lower()
                        return "no registrado" in v or "no realizado" in v or "sin registro" in v

                    if is_placeholder(last.get("diagnosis")): last["diagnosis"] = c_data["diagnosis"]
                    if is_placeholder(last.get("plan")): last["plan"] = c_data["plan"]
                    if is_placeholder(last.get("physical_exam")): last["physical_exam"] = c_data["physical_exam"]
                    if is_placeholder(last.get("ultrasound")): last["ultrasound"] = c_data["ultrasound"]
                    if not last.get("observations") or is_placeholder(last.get("observations")): 
                        last["observations"] = c_data["observations"]
                    
                    if c_data["created_at"] > last["created_at"]:
                        last["created_at"] = c_data["created_at"]
                    
                    is_merged = True
            
            if not is_merged:
                merged.append(c_data)
        
        return merged[::-1] if newest_first else merged
