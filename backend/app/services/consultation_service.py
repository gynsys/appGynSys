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
            medical_report_content=consultation_in.medical_report_content,
            
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
            "admin_observations": "observations",
            "medical_report_content": "medical_report_content"
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
            medical_report_content=original.medical_report_content,
            
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
            "all_consultations": ConsultationService.merge_consultations(db, all_consultations, newest_first=True)
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

        # all_consultations now has medical_report_content populated by merge_consultations(db, ...)
        return res

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
            "medical_report_content": consultation.medical_report_content,
            "created_at": consultation.created_at,
            "is_single_report": True
        }

        # 4. Inject dynamic summaries (OVERWRITES stale data if raw answers found)
        # MUST BE BEFORE build_narrative_summary to provide background strings
        from app.services.summary_generator import GeneradorResumenes
        GeneradorResumenes.inyectar_dinamicamente(
            db=db, 
            data=res, 
            patient_ci=consultation.patient_ci, 
            doctor_id=consultation.doctor_id,
            patient_name=consultation.patient_name
        )

        # --- NARRATIVE GENERATION ---
        from app.utils.medical_report_builder import build_narrative_summary
        narrative_data = build_narrative_summary({
            "full_name": res.get("full_name"),
            "ci": res.get("ci"),
            "age": res.get("age"),
            "reason_for_visit": res.get("reason_for_visit"),
            "admin_ultrasound": res.get("ultrasound"),
            "admin_physical_exam": res.get("physical_exam"),
            "admin_diagnosis": res.get("diagnosis"),
            "admin_plan": res.get("plan"),
            "admin_observations": res.get("observations"),
            "summary_general": res.get("summary_general"),
            "summary_medical": res.get("summary_medical"),
            "summary_gyn_obstetric": res.get("summary_gyn_obstetric"),
            "summary_habits": res.get("summary_habits"),
            "summary_functional_exam": res.get("summary_functional_exam"),
        })

        # --- FALLBACK PARA INFORME UNIFICADO (NARRATIVO COMPLETO REPLICA BOT) ---
        if not res.get("medical_report_content"):
            narr_data_fallback = build_narrative_summary({
                "full_name": res.get("full_name"),
                "ci": res.get("ci"),
                "age": res.get("age"),
                "reason_for_visit": res.get("reason_for_visit"),
                "admin_ultrasound": res.get("ultrasound"),
                "admin_physical_exam": res.get("physical_exam"),
                "admin_diagnosis": res.get("diagnosis"),
                "admin_plan": res.get("plan"),
                "admin_observations": res.get("observations"),
                # Functional exam keys (injected by inyectar_dinamicamente)
                "functional_dispareunia": res.get("functional_dispareunia"),
                "functional_dischezia": res.get("functional_dischezia"),
                "gyn_dysmenorrhea": res.get("gyn_dysmenorrhea"),
                "gyn_fertility_intent": res.get("gyn_fertility_intent"),
            })
            full_narrative = narr_data_fallback.get('narrative_summary', '')
            # Convert <br/> to \n for the editor/textarea
            res["medical_report_content"] = full_narrative.replace('<br/>', '\n')

        # Add the rest of narrative data to response
        res.update(narrative_data)

        # 5. Get patient email if not in consultation
        email = getattr(consultation, 'patient_email', "") or ""
        if not email:
            appt = db.query(Appointment).filter(
                Appointment.patient_dni == consultation.patient_ci,
                Appointment.patient_email.is_not(None)
            ).order_by(Appointment.created_at.desc()).first()
            if appt:
                email = appt.patient_email
        res["email"] = email

        return res

    @staticmethod
    def merge_consultations(db: Session, consultations_list: list, newest_first: bool = False) -> list:
        """
        Groups consultation records within a 3-day window into unified 'sessions'.
        Useful for cleaning up fragmented history views.
        Expects consultations_list sorted by created_at ASC (SQLAlchemy objects or dicts with created_at).
        """
        from app.utils.medical_report_builder import build_narrative_summary
        from app.services.summary_generator import GeneradorResumenes
        
        merged = []
        for c in consultations_list:
            is_merged = False
            
            # Extraction helper
            def g(obj, key):
                return getattr(obj, key, None) or (obj.get(key) if isinstance(obj, dict) else None)

            # Extract full data for both merging and narrative building
            c_data = {
                "id": g(c, "id"),
                "created_at": g(c, "created_at"),
                "patient_name": g(c, "patient_name"),
                "patient_ci": g(c, "patient_ci"),
                "patient_age": g(c, "patient_age"),
                "patient_phone": g(c, "patient_phone"),
                "doctor_id": g(c, "doctor_id"),
                "history_number": g(c, "history_number"),
                "reason_for_visit": g(c, "reason_for_visit"),
                "physical_exam": g(c, "physical_exam"),
                "ultrasound": g(c, "ultrasound"),
                "diagnosis": g(c, "diagnosis"),
                "plan": g(c, "plan"),
                "observations": g(c, "observations"),
                "medical_report_content": g(c, "medical_report_content"),
            }

            # FALLBACK NARRATIVE (Only current consultation fields, no backgrounds as requested)
            if not c_data.get("medical_report_content"):
                # REPLICA BOT LOGIC: Inject raw answers for "Interrogatorio"
                GeneradorResumenes.inyectar_dinamicamente(
                    db=db,
                    data=c_data,
                    patient_ci=c_data["patient_ci"],
                    doctor_id=c_data["doctor_id"],
                    patient_name=c_data["patient_name"]
                )
                
                narr_data = build_narrative_summary({
                    "full_name": c_data["patient_name"],
                    "ci": c_data["patient_ci"],
                    "age": c_data["patient_age"],
                    "reason_for_visit": c_data["reason_for_visit"],
                    "admin_ultrasound": c_data["ultrasound"],
                    "admin_physical_exam": c_data["physical_exam"],
                    "admin_diagnosis": c_data["diagnosis"],
                    "admin_plan": c_data["plan"],
                    "admin_observations": c_data["observations"],
                    # Functional exam keys (injected by inyectar_dinamicamente)
                    "functional_dispareunia": c_data.get("functional_dispareunia"),
                    "functional_dischezia": c_data.get("functional_dischezia"),
                    "gyn_dysmenorrhea": c_data.get("gyn_dysmenorrhea"),
                    "gyn_fertility_intent": c_data.get("gyn_fertility_intent"),
                })
                text = narr_data.get('narrative_summary', '')
                c_data["medical_report_content"] = text.replace('<br/>', '\n')

            if merged:
                last = merged[-1]
                diff = abs((c_data["created_at"] - last["created_at"]).total_seconds())
                # CRITICAL: Only merge if it's the SAME patient AND within the 3-day window
                if c_data.get("patient_ci") == last.get("patient_ci") and diff < 3 * 24 * 60 * 60: # 3 days threshold
                    
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
                    
                    # Merge medical_report_content if missing
                    if not last.get("medical_report_content"):
                         last["medical_report_content"] = c_data["medical_report_content"]
                    
                    if c_data["created_at"] > last["created_at"]:
                        last["created_at"] = c_data["created_at"]
                    
                    is_merged = True
            
            if not is_merged:
                merged.append(c_data)
        
        return merged[::-1] if newest_first else merged
