"""
Celery Tasks Wrapper for Monolithic Notification Service.
Delegates logic to app.services.notifications.
"""
from app.core.celery_app import celery_app
from app.services import notifications as service

@celery_app.task
def run_daily_notification_check():
    """
    Daily Task (4:00 AM Caracas): Evaluates global rules for all users.
    Service manages its own DB session.
    """
    service.run_daily_evaluation()

@celery_app.task
def process_notification_queue():
    """
    Periodic task (Every 1 min): Sends pending notifications.
    Service manages its own DB session.
    """
    service.deliver_pending_notifications()

@celery_app.task
def recover_stale_processing():
    """
    Periodic task (Every 10 min): Rescues notifications stuck in 'processing'
    state due to worker crashes. Moves them back to 'retrying' so they are
    picked up in the next delivery cycle.
    """
    rescued = service.recover_stale_processing_notifications()
    if rescued:
        import logging
        logging.getLogger(__name__).warning(f"[RECOVERY] {rescued} stale notifications rescued")
