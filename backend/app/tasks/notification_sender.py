# app/tasks/notification_sender.py
"""
Celery tasks for processing the PendingNotification queue and delivering messages.
"""
import logging
import json
from datetime import datetime
import pytz
from app.core.celery_app import celery_app
from app.db.base import SessionLocal
from app.db.models.notification import PendingNotification, NotificationLog, NotificationChannel
from app.db.models.cycle_user import CycleUser
from app.tasks.email_tasks import _send_smtp_email, _send_web_push

logger = logging.getLogger(__name__)

@celery_app.task
def process_notification_queue():
    """
    Periodic task to send pending notifications that are due.
    Scheduled in celery_app.py to run every few minutes.
    """
    db = SessionLocal()
    try:
        tz = pytz.timezone('America/Caracas')
        now = datetime.now(tz)
        
        # Obtener notificaciones pendientes vencidas
        pending_list = db.query(PendingNotification).filter(
            PendingNotification.status.in_(["pending", "retrying"]),
            PendingNotification.scheduled_for <= now
        ).limit(50).all() 
        
        for item in pending_list:
            try:
                # Lógica de entrega
                success, channel_used, error = send_dual_notification_logic(db, item)
                
                if success:
                    item.status = "sent"
                    # Registrar en el log de auditoría
                    log = NotificationLog(
                        notification_rule_id=item.notification_rule_id,
                        recipient_id=item.recipient_id,
                        status="sent",
                        channel_used=channel_used
                    )
                    db.add(log)
                else:
                    item.retry_count += 1
                    item.last_error = error
                    if item.retry_count >= 5:
                        item.status = "failed"
                    else:
                        item.status = "retrying"
                    
                    logger.warning(f"Notification {item.id} failed (try {item.retry_count}): {error}")
                
                db.commit()
            except Exception as e:
                db.rollback()
                logger.error(f"Error processing pending notification {item.id}: {e}", exc_info=True)
                
    except Exception as e:
        logger.error(f"Critical error in process_notification_queue: {e}", exc_info=True)
    finally:
        db.close()

def send_dual_notification_logic(db, item: PendingNotification):
    """
    Core delivery logic: Push -> Email failover.
    Returns (success, channel_used, error_message)
    """
    user = db.query(CycleUser).filter(CycleUser.id == item.recipient_id).first()
    if not user:
        return False, None, "User not found"
    
    channel = item.channel
    try_push = (channel in ["push", "dual"])
    try_email = (channel in ["email", "dual"])
    
    push_success = False
    error_msg = None
    
    if try_push:
        try:
            # _send_web_push internally queries subscriptions and sends to all
            _send_web_push(user.id, item.subject, item.body, "/cycle/dashboard", db)
            push_success = True 
        except Exception as e:
            error_msg = f"Push error: {str(e)}"
    
    if try_email and not push_success:
        try:
            _send_smtp_email(user.email, item.subject, item.body)
            return True, "email", None
        except Exception as e:
            return False, "email", str(e)
            
    if push_success:
        return True, "push", None
        
    return False, None, error_msg or "No valid channel succeeded"
