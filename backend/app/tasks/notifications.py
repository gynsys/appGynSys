"""
Celery Tasks Wrapper for Monolithic Notification Service.
Delegates logic to app.services.notifications.
"""
from app.core.celery_app import celery_app
from app.services import notifications as service

@celery_app.task
def run_daily_notification_check():
    """
    Daily Task (8:00 AM): Evaluates global rules for all users.
    Service manages its own DB session.
    """
    service.run_daily_evaluation()

@celery_app.task
def process_notification_queue():
    """
    Periodic task (Every 5 mins): Sends pending notifications.
    Service manages its own DB session.
    """
    service.deliver_pending_notifications()
