"""
Celery tasks for Diffusion Campaigns.
"""
from app.core.celery_app import celery_app
from app.db.base import SessionLocal
from app.db.models.campaign import DiffusionCampaign
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

        # 1. Identify unique recipients by email
        # Get all patients for this doctor
        patients = db.query(Patient).filter(Patient.doctor_id == campaign.tenant_id).all()
        # Get all app users for this doctor (they have push)
        app_users = db.query(CycleUser).filter(CycleUser.doctor_id == campaign.tenant_id).all()

        recipients = {} # email -> {type: str, id: int, name: str, has_push: bool}

        # Add patients first (email only)
        for p in patients:
            if p.email:
                email = p.email.strip().lower()
                recipients[email] = {
                    "type": "patient",
                    "id": p.id,
                    "name": p.nombre_completo,
                    "has_push": False
                }

        # Overwrite with app users (better data + push support)
        for u in app_users:
            if u.email:
                email = u.email.strip().lower()
                recipients[email] = {
                    "type": "cycle_user",
                    "id": u.id,
                    "name": u.nombre_completo,
                    "has_push": True
                }

        # 2. Create PendingNotifications
        sent_count = 0
        push_count = 0
        email_count = 0

        for email, data in recipients.items():
            pending = PendingNotification(
                subject=campaign.subject,
                body=campaign.content_html,
                message_text=campaign.content_text or campaign.subject,
                scheduled_for=datetime.utcnow(),
                channel="dual" if data["has_push"] else "email",
                status="pending"
            )
            
            # Fill recipient info
            if data["type"] == "cycle_user":
                pending.recipient_id = data["id"]
            else:
                # Direct email patient
                pending.recipient_email_direct = email
                pending.recipient_name_direct = data["name"]
            
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
