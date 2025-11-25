# Celery Tasks Package
from app.tasks.email_tasks import celery_app

__all__ = ["celery_app"]

