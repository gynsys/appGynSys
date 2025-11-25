"""
Celery tasks for sending emails.
"""
from celery import Celery
from app.core.config import settings

# Create Celery app
celery_app = Celery(
    "gynsys",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)


@celery_app.task
def send_welcome_email(email: str, doctor_name: str):
    """
    Send welcome email to a new doctor.
    
    Args:
        email: Doctor's email address
        doctor_name: Doctor's full name
    """
    # TODO: Implement email sending logic
    # This is a placeholder for future email functionality
    print(f"Sending welcome email to {email} for {doctor_name}")
    return {"status": "sent", "email": email}


@celery_app.task
def send_appointment_reminder(email: str, appointment_date: str, doctor_name: str):
    """
    Send appointment reminder email.
    
    Args:
        email: Patient's email address
        appointment_date: Appointment date and time
        doctor_name: Doctor's name
    """
    # TODO: Implement email sending logic
    print(f"Sending appointment reminder to {email} for appointment on {appointment_date} with {doctor_name}")
    return {"status": "sent", "email": email}

