from app.core.celery_app import celery_app
from app.db.base import SessionLocal
from app.db.models.doctor import Doctor
from app.db.models.cycle_user import CycleUser
from app.db.models.notification import NotificationRule, NotificationLog, NotificationType, NotificationChannel
from app.db.models.cycle_predictor import CycleLog, PregnancyLog
from app.core.push import send_web_push
from app.tasks.email_tasks import _send_smtp_email
from app.cycle_predictor.logic import calculate_predictions
from datetime import date, datetime, timedelta
import json
import traceback

def calculate_smart_context(user: CycleUser, predictions: dict, pregnancy: PregnancyLog) -> dict:
    """
    Build a comprehensive context object describing the user's current status
    to be checked against rules.
    """
    today = date.today()
    ctx = { "today": today }
    
    # 1. Pregnancy Context
    if pregnancy:
        ctx["is_pregnant"] = True
        ctx["gestation_days"] = (today - pregnancy.last_period_date).days
        ctx["gestation_week"] = ctx["gestation_days"] // 7
        return ctx
    
    ctx["is_pregnant"] = False
    
    # 2. Cycle Context
    if predictions:
        # Core days
        ctx["cycle_day"] = predictions["cycle_day"]
        ctx["is_ovulation_day"] = (today == predictions["ovulation_date"])
        ctx["is_fertile_start"] = (today == predictions["fertile_window_start"])
        
        # Offsets
        if predictions["ovulation_date"]:
            ctx["days_after_ovulation"] = (today - predictions["ovulation_date"]).days
            
        if predictions["next_period_start"]:
            ctx["days_before_period"] = (predictions["next_period_start"] - today).days
            
            # Period Confirmation / Lateness
            # If we are PAST the predicted start, and no new cycle has been logged (checked outside or implicit)
            # Logic: If today > next_period_start, we are "late" or "in period without log"
            days_late = (today - predictions["next_period_start"]).days
            if days_late > 0:
                ctx["period_confirmation_needed"] = True
                ctx["days_late"] = days_late
                
        # Phase (already provided by predictions, but ensuring availability)
        ctx["phase"] = predictions.get("phase")

    # 3. Contraceptive Context (Smart Pill)
    # Assuming relationship exists or query it. For now, assuming eager load or access from user.
    # Note: user object in SQLAlchemy should lazy load relationships.
    
    # Logic: Calculate Pill Day based on Cycle Day (Synchronization)
    # Ideally tracked separately, but "Sync with Cycle" is a good default.
    cycle_day = ctx.get("cycle_day", 0)
    if cycle_day > 0:
        ctx["pill_number"] = cycle_day # Simple mapping
        if cycle_day <= 21:
             ctx["pill_subtype"] = "active_pill"
        elif cycle_day <= 28:
             ctx["pill_subtype"] = "placebo"
        
        if cycle_day == 1:
            ctx["pill_event"] = "new_pack"

    return ctx


def evaluate_rule(rule: NotificationRule, context: dict, user_settings) -> bool:
    """
    Check if a rule trigger matches the SMART CONTEXT.
    """
    trigger = rule.trigger_condition
    if not trigger: return False
    
    # --- PRENATAL ---
    if rule.notification_type == NotificationType.PRENATAL_MILESTONE:
        if not context.get("is_pregnant"): return False
        if "gestation_week" in trigger:
            return trigger["gestation_week"] == context.get("gestation_week")
        return False

    # Skip cycle rules if pregnant
    if context.get("is_pregnant"): return False

    # --- PILL LOGIC ---
    # Check if rule looks like a contraceptive rule
    if trigger.get("type") == "contraceptive":
        # Check User Settings First
        if not user_settings or not user_settings.contraceptive_enabled:
            return False
            
        required_subtype = trigger.get("subtype")
        current_subtype = context.get("pill_subtype")
        
        # New Pack Event
        if required_subtype == "new_pack":
             return context.get("pill_event") == "new_pack"
             
        # Active/Placebo match
        return required_subtype == current_subtype

    # --- PERIOD CONFIRMATION ---
    if trigger.get("event") == "period_confirmation":
        if not context.get("period_confirmation_needed"): return False
        return trigger.get("day_late") == context.get("days_late")

    # --- CYCLE DAY / PHASE ---
    if "cycle_day" in trigger:
        return trigger["cycle_day"] == context.get("cycle_day")

    if "days_before_period" in trigger:
        return trigger["days_before_period"] == context.get("days_before_period")

    if "is_ovulation_day" in trigger and trigger["is_ovulation_day"]:
        return context.get("is_ovulation_day")

    if "is_fertile_start" in trigger and trigger["is_fertile_start"]:
        return context.get("is_fertile_start")
        
    if "days_after_ovulation" in trigger:
        return trigger["days_after_ovulation"] == context.get("days_after_ovulation")

    # --- SYSTEM / SAAS (Generic Day Trigger fallback) ---
    # If a generic system rule uses "cycle_day" it is handled above in "cycle_day" block.

    return False


def send_dual_notification(db, user, rule, context_vars):
    """
    Try Push -> Failover to Email.
    """
    subject = rule.name
    # Render Template
    message_html = rule.message_template
    # Replace variables
    for key, val in context_vars.items():
        if val is not None:
            message_html = message_html.replace(f"{{{key}}}", str(val))
    
    # Handle {pill_number} specifically if missing
    if "{pill_number}" in message_html and "pill_number" not in context_vars:
         message_html = message_html.replace("{pill_number}", "#")

    channel = rule.channel
    log_status = "sent"
    used_channel = "email"
    error_msg = None
    
    try_push = (channel == NotificationChannel.PUSH or channel == NotificationChannel.DUAL)
    try_email = (channel == NotificationChannel.EMAIL or channel == NotificationChannel.DUAL)
    
    push_success = False
    
    if try_push and user.push_subscription:
        payload = json.dumps({
            "title": "Alerta Mi Ciclo", # Generic title for privacy? Or Rule Name? Rule Name might be internal.
            # Parse HTML to plain text for body? Or just use a generic body.
            # Using rule name as Title and strip tags for body is best effort.
            "body": rule.name, 
            "url": "/dashboard"
        })
        success, err = send_web_push(user.push_subscription, payload)
        if success:
            push_success = True
            used_channel = "push"
        else:
            if channel == NotificationChannel.PUSH:
                log_status = "failed"
                error_msg = f"Push failed: {err}"
    
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
    Daily Task: Evaluate Smart Rules -> Users.
    """
    db = SessionLocal()
    try:
        doctors = db.query(Doctor).filter(Doctor.is_active == True).all()
        
        for doctor in doctors:
            rules = db.query(NotificationRule).filter(
                NotificationRule.tenant_id == doctor.id,
                NotificationRule.is_active == True
            ).all()
            
            if not rules: continue
            
            users = db.query(CycleUser).filter(
                CycleUser.doctor_id == doctor.id, 
                CycleUser.is_active == True
            ).all()
            
            from app.db.models.cycle_predictor import CycleNotificationSettings
            
            for user in users:
                try:
                    # Load Settings
                    user_settings = db.query(CycleNotificationSettings).filter(
                        CycleNotificationSettings.cycle_user_id == user.id
                    ).first()

                    # Load Pregnancy
                    pregnancy = db.query(PregnancyLog).filter(
                         PregnancyLog.cycle_user_id == user.id, 
                         PregnancyLog.is_active == True
                    ).first()
                    
                    # Calculate Context
                    predictions = None
                    if not pregnancy:
                         last_cycle = db.query(CycleLog).filter(CycleLog.cycle_user_id == user.id).order_by(CycleLog.start_date.desc()).first()
                         if last_cycle:
                             predictions = calculate_predictions(last_cycle.start_date, user.cycle_avg_length, user.period_avg_length)
                    
                    smart_ctx = calculate_smart_context(user, predictions, pregnancy)
                    
                    # Enrich ctx for template rendering
                    render_vars = {
                        "patient_name": user.nombre_completo,
                        "today": date.today()
                    }
                    render_vars.update(smart_ctx)
                    
                    # Evaluate Rules
                    for rule in rules:
                        # Check Frequency Cap: Max 1 per rule per day
                        today_start = datetime.now().replace(hour=0, minute=0, second=0)
                        already_sent = db.query(NotificationLog).filter(
                            NotificationLog.notification_rule_id == rule.id,
                            NotificationLog.recipient_id == user.id,
                            NotificationLog.sent_at >= today_start
                        ).first()
                        
                        if already_sent: continue

                        if evaluate_rule(rule, smart_ctx, user_settings):
                            send_dual_notification(db, user, rule, render_vars)
                            
                except Exception as e:
                    print(f"Error processing user {user.id}: {traceback.format_exc()}")
                    
    except Exception as e:
        print(f"Critical Error in process_dynamic_notifications: {e}")
    finally:
        db.close()
