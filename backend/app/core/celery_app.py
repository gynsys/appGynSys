#celery_app.py
from celery import Celery
from app.core.config import settings

celery_app = Celery("gynsys", broker=settings.CELERY_BROKER_URL)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="America/Caracas", 
    enable_utc=True,
)

from celery.schedules import crontab

celery_app.conf.beat_schedule = {
    "evaluate-dynamic-rules": {
        "task": "app.tasks.notification_processor.process_dynamic_notifications",
        "schedule": crontab(hour=8, minute=0),
    },
    "process-notification-queue": {
        "task": "app.tasks.notification_sender.process_notification_queue",
        "schedule": crontab(minute='*/10'),
    },
}
# Auto-discover tasks and ensure modules are loaded
celery_app.autodiscover_tasks(['app'])

# Explicitly import task modules to ensure they register their tasks with the app instance
try:
    import app.tasks.email_tasks
    import app.tasks.notification_processor
    import app.tasks.notification_sender
except ImportError:
    pass
