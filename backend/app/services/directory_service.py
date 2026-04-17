from sqlalchemy.orm import Session
from app.db.models.patient import Patient
from app.db.models.campaign import CampaignContact
from app.db.models.appointment import Appointment
import logging

logger = logging.getLogger(__name__)

def sync_onboarding_to_directory(appointment: Appointment, db: Session):
    """
    Sincroniza los datos de una preconsulta finalizada con el Directorio (Patient)
    y la Lista de Difusión (CampaignContact).
    """
    try:
        email = appointment.patient_email.lower().strip() if appointment.patient_email else None
        
        # 1. Sincronizar con el Directorio Clínico (Paciente)
        # Nota: La tabla patients tiene email único global en el modelo actual.
        db_patient = None
        if email:
            db_patient = db.query(Patient).filter(Patient.email == email).first()
            
        if not db_patient:
            db_patient = Patient(
                name=appointment.patient_name,
                email=email,
                phone=appointment.patient_phone,
                doctor_id=appointment.doctor_id
            )
            db.add(db_patient)
            db.flush() # Para obtener el ID
        else:
            # Actualizar datos de contacto si han cambiado
            db_patient.name = appointment.patient_name
            db_patient.phone = appointment.patient_phone
            # No cambiamos el doctor_id si ya existe (un paciente podría estar vinculado a otro doctor originalmente)
            # pero en este sistema parece que cada doctor tiene su "vista" o el paciente es compartido.
        
        # 2. Sincronizar con la Lista de Difusión (CampaignContact) - El "Directorio Relacional"
        # Esta tabla sí es por tenant_id (doctor)
        if email:
            db_contact = db.query(CampaignContact).filter(
                CampaignContact.tenant_id == appointment.doctor_id,
                CampaignContact.email == email
            ).first()
            
            if not db_contact:
                db_contact = CampaignContact(
                    tenant_id=appointment.doctor_id,
                    full_name=appointment.patient_name,
                    email=email,
                    phone=appointment.patient_phone,
                    ci=appointment.patient_dni,
                    patient_id=db_patient.id,
                    source="sync_onboarding",
                    is_active=True
                )
                db.add(db_contact)
            else:
                # Actualizar contacto existente
                db_contact.full_name = appointment.patient_name
                db_contact.phone = appointment.patient_phone
                db_contact.ci = appointment.patient_dni
                db_contact.patient_id = db_patient.id
                db_contact.is_active = True
                
        db.commit()
        logger.info(f"Sincronización de directorio exitosa para {appointment.patient_name}")
        return True
    except Exception as e:
        db.rollback()
        logger.error(f"Error sincronizando directorio en onboarding: {e}", exc_info=True)
        return False
