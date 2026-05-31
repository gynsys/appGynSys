import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.core.celery_app import celery_app
from app.db.base import SessionLocal
from app.db.models.scheduled_appointment import ScheduledAppointment
from app.db.models.doctor import Doctor
from app.db.models.cycle_user import CycleUser
from app.tasks.email_tasks import _send_integrated_email
from app.services.push_service import send_push_to_actor

logger = logging.getLogger(__name__)

@celery_app.task(name="app.tasks.scheduled_appointment_reminders.check_scheduled_reminders")
def check_scheduled_reminders():
    """
    Periodic task to check for upcoming scheduled appointments 
    and send reminders to patients.
    Runs daily.
    """
    db = SessionLocal()
    try:
        # 1. Identify appointments scheduled for 3 days from now
        today = datetime.now().date()
        target_date_start = datetime.combine(today + timedelta(days=3), datetime.min.time())
        target_date_end = datetime.combine(today + timedelta(days=3), datetime.max.time())
        
        logger.info(f"Checking scheduled reminders for date: {target_date_start.date()}")
        
        appointments = db.query(ScheduledAppointment).filter(
            ScheduledAppointment.status == 'pending',
            ScheduledAppointment.reminder_sent == False,
            ScheduledAppointment.scheduled_date >= target_date_start,
            ScheduledAppointment.scheduled_date <= target_date_end
        ).all()
        
        for appt in appointments:
            try:
                # --- A. NOTIFY PATIENT ---
                # Check if patient is an App User (CycleUser) for Push
                patient_user = db.query(CycleUser).filter(CycleUser.email == appt.patient_email).first()
                
                notified_via_push = False
                if patient_user and patient_user.push_subscriptions:
                    push_res = send_push_to_actor(
                        actor=patient_user,
                        title="🗓️ Recordatorio de Seguimiento",
                        body=f"Hola {appt.patient_name}, le recordamos que tiene programado un control médico en 3 días ({appt.scheduled_date.strftime('%d/%m/%Y')}).",
                        data={"url": "/cycle/dashboard", "tag": "scheduled-reminder"}
                    )
                    notified_via_push = push_res.get("success", False)
                
                # Fallback to Email if Push fails or not available
                if appt.patient_email:
                    subject = f"Recordatorio: Su próximo control médico - {appt.scheduled_date.strftime('%d/%m/%Y')}"
                    
                    # Customize based on doctor
                    doctor = db.query(Doctor).filter(Doctor.id == appt.doctor_id).first()
                    primary_color = doctor.theme_primary_color if doctor else "#4F46E5"
                    doctor_name = doctor.nombre_completo if doctor else "su médico"
                    
                    html_content = f"""
                    <div style="font-family: sans-serif; color: #374151; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                        <h2 style="color: {primary_color};">Recordatorio de Control Médico</h2>
                        <p>Hola <strong>{appt.patient_name}</strong>,</p>
                        <p>Le escribimos para recordarle su próximo control médico programado con {doctor_name}.</p>
                        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 5px 0;"><strong>Fecha sugerida:</strong> {appt.scheduled_date.strftime('%d/%m/%Y')}</p>
                            <p style="margin: 5px 0;"><strong>Motivo:</strong> {appt.notes or 'Control de seguimiento rutinario'}</p>
                        </div>
                        <p>Si desea confirmar o reagendar su cita, por favor contacte al consultorio directamente.</p>
                        <hr style="margin: 30px 0; border: 0; border-top: 1px solid #eee;">
                        <p style="font-size: 12px; color: #9ca3af; text-align: center;">GynSys &copy; 2026</p>
                    </div>
                    """
                    
                    _send_integrated_email(appt.patient_email, subject, html_content)
                
                # 2. Mark as notified
                appt.reminder_sent = True
                appt.reminder_sent_at = datetime.now()
                appt.status = 'notified'
                db.commit()
                logger.info(f"Reminder sent to {appt.patient_name} for appt {appt.id}")
                
            except Exception as e:
                logger.error(f"Error processing scheduled reminder for {appt.id}: {e}", exc_info=True)
                db.rollback()
                
    except Exception as e:
        logger.error(f"Critical error in check_scheduled_reminders: {e}", exc_info=True)
    finally:
        db.close()
