from celery import Celery
from app.core.config import settings

celery_app = Celery("gynsys", broker=settings.CELERY_BROKER_URL)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="America/La_Paz", # Adjust to user's timezone if known, else UTC
    enable_utc=True,
)

from celery.schedules import crontab

celery_app.conf.beat_schedule = {
    "send-daily-contraceptive-alert": {
        "task": "app.tasks.email_tasks.send_daily_contraceptive_alert",
        "schedule": crontab(minute='*/5'), # Check every 5 minutes for better precision
    },
    "send-daily-cycle-events": {
        "task": "app.tasks.notification_tasks.process_dynamic_notifications",
        "schedule": crontab(hour=19, minute=0), # Keep cycle events daily at 7 PM
    },
}
# Auto-discover tasks in the tasks module
celery_app.autodiscover_tasks(['app.tasks.email_tasks', 'app.tasks.notification_tasks'])
