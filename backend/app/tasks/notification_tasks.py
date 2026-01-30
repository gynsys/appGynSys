from app.core.celery_app import celery_app
from app.db.base import SessionLocal
from app.db.models.doctor import Doctor
from app.db.models.cycle_user import CycleUser
from app.db.models.notification import NotificationRule, NotificationLog, NotificationType, NotificationChannel
from app.db.models.cycle_predictor import CycleLog, PregnancyLog
from app.core.push import send_web_push
from app.tasks.email_tasks import _send_smtp_email
from app.cycle_predictor.logic import calculate_predictions
from datetime import date, datetime
import json
import traceback

def evaluate_rule(rule: NotificationRule, user: CycleUser, predictions: dict, pregnancy: PregnancyLog) -> bool:
    """
    Check if a rule trigger matches the user's current status.
    """
    trigger = rule.trigger_condition
    if not trigger: return False
    
    # 1. Pregnancy Rules
    if rule.notification_type == NotificationType.PRENATAL_WEEKLY:
        if not pregnancy: return False
        # Logic: every 7 days? Or specific week?
        # Assuming trigger={"interval": 7} or {"week": 12}
        today = date.today()
        gst_days = (today - pregnancy.last_period_date).days
        current_week = gst_days // 7
        
        # Check specific week trigger
        if "week" in trigger:
            return trigger["week"] == current_week
            
        # Check interval trigger (every X weeks)
        if "interval_weeks" in trigger: 
            # Send only on the day the week turns? (gst_days % 7 == 0)
            if gst_days > 0 and gst_days % 7 == 0:
                return (gst_days // 7) % trigger["interval_weeks"] == 0
                
        return False

    # 2. Cycle Rules (Skip if pregnant)
    if pregnancy: return False # Cycle rules don't apply to pregnant users
    
    # Needs predictions
    if not predictions: return False
    
    today = date.today()
    
    # {"days_before_period": 2}
    if "days_before_period" in trigger:
        target_days = trigger["days_before_period"]
        days_until = (predictions["next_period_start"] - today).days
        if days_until == target_days:
            return True
            
    # {"cycle_day": 14}
    if "cycle_day" in trigger:
        if predictions["cycle_day"] == trigger["cycle_day"]:
            return True
            
    # {"is_ovulation_day": true}
    if "is_ovulation_day" in trigger and trigger["is_ovulation_day"]:
        if predictions["ovulation_date"] == today:
            return True
            
    # {"is_fertile_start": true}
    if "is_fertile_start" in trigger and trigger["is_fertile_start"]:
        if predictions["fertile_window_start"] == today:
            return True
            
    return False


def send_dual_notification(db, user, rule, context):
    """
    Try Push -> Failover to Email.
    """
    subject = rule.name
    # Render Template (Simple replace for now)
    message_html = rule.message_template
    for key, val in context.items():
        message_html = message_html.replace(f"{{{key}}}", str(val))
    
    channel = rule.channel
    log_status = "sent"
    used_channel = "email"
    error_msg = None

    # Logic: DUAL means Push First, Then Email if needed.
    # PUSH and EMAIL are forced.
    
    try_push = (channel == NotificationChannel.PUSH or channel == NotificationChannel.DUAL)
    try_email = (channel == NotificationChannel.EMAIL or channel == NotificationChannel.DUAL)
    
    push_success = False
    
    # 1. Try Push
    if try_push and user.push_subscription:
        payload = json.dumps({
            "title": subject,
            "body": "Tienes una nueva notificación de GynSys.", # Simplified body for push, detailed in app click?
            "url": "/dashboard"
        })
        success, err = send_web_push(user.push_subscription, payload)
        if success:
            push_success = True
            used_channel = "push"
        else:
            # If push failed (and strict Push), we log error.
            if channel == NotificationChannel.PUSH:
                log_status = "failed"
                error_msg = f"Push failed: {err}"
    
    # 2. Fallback Email
    if try_email and not push_success:
        try:
            _send_smtp_email(user.email, subject, message_html)
            used_channel = "email"
        except Exception as e:
            log_status = "failed"
            error_msg = str(e)
            
    # Log it
    log = NotificationLog(
        notification_rule_id=rule.id,
        recipient_id=user.id,
        status=log_status,
        channel_used=used_channel,
        error_message=error_msg
    )
    db.add(log)
    db.commit()


@celery_app.task
def process_dynamic_notifications():
    """
    Daily Task: Evaluate Rules -> Users.
    """
    db = SessionLocal()
    try:
        # 1. Get Active Doctors with Rules
        doctors = db.query(Doctor).filter(Doctor.is_active == True).all()
        
        for doctor in doctors:
            # Get Rules (Optimization: Eager load?)
            rules = db.query(NotificationRule).filter(
                NotificationRule.tenant_id == doctor.id,
                NotificationRule.is_active == True
            ).all()
            
            if not rules: continue
            
            # Get Users
            users = db.query(CycleUser).filter(
                CycleUser.doctor_id == doctor.id, 
                CycleUser.is_active == True
            ).all()
            
            for user in users:
                # BLINDED LOOP PER USER
                try:
                    # Check existing log for today + rule to avoid duplicates
                    # (Skipping DB check for simplicity in this artifact, but recommended)
                    
                    # Calculate Context
                    # Check Pregnancy
                    pregnancy = db.query(PregnancyLog).filter(
                         PregnancyLog.cycle_user_id == user.id, 
                         PregnancyLog.is_active == True
                    ).first()
                    
                    predictions = None
                    if not pregnancy:
                         # Calc predictions
                         last_cycle = db.query(CycleLog).filter(CycleLog.cycle_user_id == user.id).order_by(CycleLog.start_date.desc()).first()
                         if last_cycle:
                             predictions = calculate_predictions(last_cycle.start_date, user.cycle_avg_length, user.period_avg_length)
                    
                    # Evaluate Rules
                    for rule in rules:
                        # Check "sent today" logic
                        # Simplified: Assuming task runs once daily. 
                        # Ideally log check here:
                        today_start = datetime.now().replace(hour=0, minute=0, second=0)
                        already_sent = db.query(NotificationLog).filter(
                            NotificationLog.notification_rule_id == rule.id,
                            NotificationLog.recipient_id == user.id,
                            NotificationLog.sent_at >= today_start
                        ).first()
                        
                        if already_sent: continue

                        if evaluate_rule(rule, user, predictions, pregnancy):
                            # Prepare Context variables
                            ctx = {
                                "patient_name": user.nombre_completo,
                                "today": date.today()
                            }
                            if predictions:
                                ctx.update({k: str(v) for k, v in predictions.items() if isinstance(v, (date, str, int))})
                            
                            send_dual_notification(db, user, rule, ctx)
                            
                except Exception as e:
                    print(f"Error processing user {user.id}: {traceback.format_exc()}")
                    # Continue to next user (Blinded)
                    
    except Exception as e:
        print(f"Critical Error in process_dynamic_notifications: {e}")
    finally:
        db.close()
