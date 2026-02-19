"""
Celery Tasks Wrapper for Monolithic Notification Service.
Delegates logic to app.services.notifications.
"""
from app.core.celery_app import celery_app
from app.db.base import SessionLocal
from app.services import notifications as service

@celery_app.task
def run_daily_notification_check():
    """
    Daily Task (8:00 AM): Evaluates global rules for all users.
    """
    db = SessionLocal()
    try:
        service.run_daily_evaluation(db)
    finally:
        db.close()

@celery_app.task
def process_notification_queue():
    """
    Periodic task (Every 5 mins): Sends pending notifications.
    """
    db = SessionLocal()
    try:
        service.deliver_pending_notifications(db)
    finally:
        db.close()
