"""
Celery tasks for Diffusion Campaigns.
"""
from app.core.celery_app import celery_app
from app.db.base import SessionLocal
from app.db.models.campaign import DiffusionCampaign, CampaignContact
from app.db.models.patient import Patient
from app.db.models.cycle_user import CycleUser
from app.db.models.notification import PendingNotification
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

@celery_app.task
def process_diffusion_campaign(campaign_id: int):
    """
    Background task to expand a campaign into individual notifications.
    """
    db = SessionLocal()
    try:
        campaign = db.query(DiffusionCampaign).filter(DiffusionCampaign.id == campaign_id).first()
        if not campaign:
            logger.error(f"Campaign {campaign_id} not found")
            return

        campaign.status = "sending"
        db.commit()

        # 1. Identify recipients based on target_type
        recipients = {} # email -> {type: str, id: int, name: str, has_push: bool}

        if campaign.target_type == "selection" and campaign.selected_contact_ids:
            # Targeted Selection
            contacts = db.query(CampaignContact).filter(
                CampaignContact.tenant_id == campaign.tenant_id,
                CampaignContact.id.in_(campaign.selected_contact_ids),
                CampaignContact.is_active == True
            ).all()
            
            for c in contacts:
                email = c.email.strip().lower()
                recipients[email] = {
                    "type": "cycle_user" if c.cycle_user_id else "patient",
                    "id": c.cycle_user_id or c.patient_id,
                    "name": c.full_name,
                    "has_push": True if c.cycle_user_id else False
                }
        else:
            # Broad targeting (all, app_users, patients)
            patients_q = db.query(Patient).filter(Patient.doctor_id == campaign.tenant_id)
            app_users_q = db.query(CycleUser).filter(CycleUser.doctor_id == campaign.tenant_id)
            
            # Sub-filters
            if campaign.target_type == "app_users":
                # Registered App Users
                for u in app_users_q.all():
                    if u.email:
                        email = u.email.strip().lower()
                        recipients[email] = {
                            "type": "cycle_user",
                            "id": u.id,
                            "name": u.nombre_completo,
                            "has_push": True
                        }
                # Sync'ed manual contacts for App
                manual_app_q = db.query(CampaignContact).filter(
                    CampaignContact.tenant_id == campaign.tenant_id,
                    CampaignContact.is_active == True,
                    CampaignContact.source == "sync_cycle"
                )
                for mc in manual_app_q.all():
                    m_email = mc.email.strip().lower()
                    if m_email not in recipients:
                        recipients[m_email] = {
                            "type": "cycle_user",
                            "id": mc.cycle_user_id,
                            "name": mc.full_name,
                            "has_push": True if mc.cycle_user_id else False
                        }
            elif campaign.target_type == "patients":
                # Registered Patients
                for p in patients_q.all():
                    if p.email:
                        email = p.email.strip().lower()
                        recipients[email] = {
                            "type": "patient",
                            "id": p.id,
                            "name": p.name,
                            "has_push": False
                        }
                # Manual and Synced manual contacts for Patients
                manual_pat_q = db.query(CampaignContact).filter(
                    CampaignContact.tenant_id == campaign.tenant_id,
                    CampaignContact.is_active == True,
                    CampaignContact.source.in_(["manual", "sync_patient"])
                )
                for mc in manual_pat_q.all():
                    m_email = mc.email.strip().lower()
                    if m_email not in recipients:
                        recipients[m_email] = {
                            "type": "patient",
                            "id": mc.patient_id,
                            "name": mc.full_name,
                            "has_push": False
                        }
            else:
                # Default: ALL
                # Add patients first (no push by default)
                for p in patients_q.all():
                    if p.email:
                        email = p.email.strip().lower()
                        recipients[email] = {
                            "type": "patient",
                            "id": p.id,
                            "name": p.name,
                            "has_push": False
                        }
                # Overwrite with app users (better data + push support)
                for u in app_users_q.all():
                    if u.email:
                        email = u.email.strip().lower()
                        recipients[email] = {
                            "type": "cycle_user",
                            "id": u.id,
                            "name": u.nombre_completo,
                            "has_push": True
                        }
                
                # Manual external contacts (not from Patient or CycleUser)
                manual_contacts = db.query(CampaignContact).filter(
                    CampaignContact.tenant_id == campaign.tenant_id,
                    CampaignContact.is_active == True,
                    CampaignContact.source == "manual"
                ).all()
                for mc in manual_contacts:
                    m_email = mc.email.strip().lower()
                    if m_email not in recipients:
                        recipients[m_email] = {
                            "type": "patient", # Treated as direct email recipient
                            "id": None,
                            "name": mc.full_name,
                            "has_push": False
                        }

        # 2. Create PendingNotifications
        sent_count = 0
        push_count = 0
        email_count = 0

        for email, data in recipients.items():
            # SAFETY CHECK: Skip if email is missing or malformed
            if not email or "@" not in email:
                logger.warning(f"Skipping campaign recipient {data['name']} (ID: {data['id']}) due to invalid email: '{email}'")
                continue

            pending = PendingNotification(
                subject=campaign.subject,
                body=campaign.content_html,
                message_text=campaign.content_text or campaign.subject,
                # Enviar inmediatamente (o en el próximo procesado)
                scheduled_for=datetime.utcnow(),
                channel="dual" if data["has_push"] else "email",
                status="pending",
                doctor_id=campaign.tenant_id,
                # Snapshot de correo: ESTO ES LO QUE PROTEGE EL ENVÍO CONTRA CAMBIOS EN EL PERFIL
                recipient_email_direct=email,
                recipient_name_direct=data["name"]
            )
            
            # Link to internal record if exists (for push and metadata)
            if data["type"] == "cycle_user" and data["id"]:
                pending.recipient_id = data["id"]
            
            db.add(pending)
            sent_count += 1
            if data["has_push"]:
                push_count += 1
            email_count += 1

        # 3. Update Campaign Stats
        campaign.status = "sent"
        campaign.sent_at = datetime.utcnow()
        campaign.stats = {
            "sent_count": sent_count,
            "push_count": push_count,
            "email_count": email_count
        }
        db.commit()
        logger.info(f"Campaign {campaign_id} processed: {sent_count} recipients.")

    except Exception as e:
        logger.error(f"Error processing campaign {campaign_id}: {e}", exc_info=True)
        if campaign:
            campaign.status = "failed"
            db.commit()
    finally:
        db.close()
