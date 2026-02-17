# app/tasks/notification_processor.py
"""
Celery tasks for evaluating notification rules and queueing pending notifications.
"""
import logging
from datetime import date, datetime, timedelta
import pytz
from sqlalchemy.orm import Session
from app.core.celery_app import celery_app
from app.db.base import SessionLocal
from app.db.models.doctor import Doctor
from app.db.models.cycle_user import CycleUser
from app.db.models.notification import NotificationRule, NotificationLog, PendingNotification
from app.db.models.cycle_predictor import CycleLog, PregnancyLog, SymptomLog, CycleNotificationSettings
from app.cycle_predictor.logic import calculate_predictions

logger = logging.getLogger(__name__)

def calculate_smart_context(user: CycleUser, predictions: dict, pregnancy: PregnancyLog, db_session: Session) -> dict:
    """
    Build a comprehensive context object describing the user's current status.
    """
    tz = pytz.timezone('America/Caracas')
    today = datetime.now(tz).date()
    ctx = { "today": today }
    
    # 1. Pregnancy Context
    if pregnancy:
        ctx["is_pregnant"] = True
        gestation_days = (today - pregnancy.last_period_date).days
        ctx["gestation_days"] = gestation_days
        ctx["gestation_week"] = gestation_days // 7
        ctx["gestation_day_of_week"] = (gestation_days % 7) + 1 # 1-7
        
        if ctx["gestation_week"] < 14:
            ctx["trimester"] = 1
        elif ctx["gestation_week"] < 28:
            ctx["trimester"] = 2
        else:
            ctx["trimester"] = 3
            
    # Universal Symptom Check
    symptom_log = db_session.query(SymptomLog).filter(
        SymptomLog.cycle_user_id == user.id,
        SymptomLog.date == today
    ).first()
    if symptom_log and symptom_log.symptoms:
        if isinstance(symptom_log.symptoms, list):
            ctx["reported_symptoms"] = symptom_log.symptoms
        elif isinstance(symptom_log.symptoms, str):
            ctx["reported_symptoms"] = [symptom_log.symptoms]

    if pregnancy:
        return ctx
    
    ctx["is_pregnant"] = False
    
    # 2. Cycle Context
    if predictions:
        ctx["cycle_day"] = predictions.get("cycle_day", 0)
        ctx["is_ovulation_day"] = (today == predictions.get("ovulation_date"))
        ctx["is_fertile_start"] = (today == predictions.get("fertile_window_start"))
        ctx["is_fertile_end"] = (today == predictions.get("fertile_window_end"))
        
        if predictions.get("ovulation_date"):
            ctx["days_after_ovulation"] = (today - predictions["ovulation_date"]).days
            
        if predictions.get("next_period_start"):
            ctx["days_before_period"] = (predictions["next_period_start"] - today).days
            
            days_late = (today - predictions["next_period_start"]).days
            if days_late > 0:
                ctx["period_confirmation_needed"] = True
                ctx["days_late"] = days_late
                
        ctx["phase"] = predictions.get("phase")

    # 3. Contraceptive Context (Sync with Cycle)
    cycle_day = ctx.get("cycle_day", 0)
    if cycle_day > 0:
        ctx["pill_number"] = cycle_day
        if cycle_day <= 21:
             ctx["pill_subtype"] = "active_pill"
        elif cycle_day <= 28:
             ctx["pill_subtype"] = "placebo"
        
        if cycle_day == 1:
            ctx["pill_event"] = "new_pack"

    # 4. Annual Checkup Event
    if user.created_at:
        user_created_date = user.created_at.date()
        if user_created_date.month == today.month and user_created_date.day == today.day:
            ctx["is_annual_checkup"] = True

    return ctx

from app.core.notifications.registry import NOTIFICATION_REGISTRY, NOTIFICATION_MAP

def evaluate_registry_rule(rule_def: dict, context: dict, user_settings: CycleNotificationSettings) -> bool:
    """
    Check if a registry rule should fire based on context and user settings.
    """
    if not user_settings: return False
    
    # 1. Evaluate logic from Registry
    if not rule_def["logic"](context):
        return False
        
    # 2. Category-based user preference filtering
    category = rule_def["category"]
    if context.get("is_pregnant"):
        if category == "prenatal" and not user_settings.prenatal_milestones: return False
        # Add more specific checks if needed (daily tips, etc)
    else:
        if category == "contraceptive" and not user_settings.contraceptive_enabled: return False
        if category == "menstrual":
            # Just basic check for now, can be expanded
            pass
            
    return True

@celery_app.task
def process_dynamic_notifications():
    """
    Daily Task (8:00 AM): Evaluates global rules for all users.
    Optimized for Agnostic/Closed App model.
    """
    db = SessionLocal()
    try:
        tz = pytz.timezone('America/Caracas')
        now = datetime.now(tz)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

        # 1. Fetch Global Rules (Source of Truth for texts)
        global_rules = {
            r.notification_type: r 
            for r in db.query(NotificationRule).filter(NotificationRule.tenant_id == None, NotificationRule.is_active == True).all()
        }

        # 2. Process all Active Users
        users = db.query(CycleUser).filter(CycleUser.is_active == True).all()
        
        for user in users:
            try:
                # Get user context
                user_settings = db.query(CycleNotificationSettings).filter(
                    CycleNotificationSettings.cycle_user_id == user.id
                ).first()
                if not user_settings: continue

                pregnancy = db.query(PregnancyLog).filter(
                     PregnancyLog.cycle_user_id == user.id, 
                     PregnancyLog.is_active == True
                ).first()
                
                predictions = None
                if not pregnancy:
                     last_cycle = db.query(CycleLog).filter(CycleLog.cycle_user_id == user.id).order_by(CycleLog.start_date.desc()).first()
                     if last_cycle:
                         predictions = calculate_predictions(last_cycle.start_date, user.cycle_avg_length, user.period_avg_length)
                
                smart_ctx = calculate_smart_context(user, predictions, pregnancy, db)
                
                # 3. Check Registry Rules
                for rule_def in NOTIFICATION_REGISTRY:
                    rtype = rule_def["type"]
                    
                    # Does it fire?
                    if not evaluate_registry_rule(rule_def, smart_ctx, user_settings):
                        continue
                        
                    # Find the Template Rule (Global or Default)
                    template_rule = global_rules.get(rtype)
                    if not template_rule:
                        # Fallback to Maraiel Herrera (tenant 1) if global not found yet
                        # or just skip if no template exists
                        logger.warning(f"No global template found for {rtype}")
                        continue

                    # Frequency Cap
                    already_sent = db.query(NotificationLog).filter(
                        NotificationLog.notification_rule_id == template_rule.id,
                        NotificationLog.recipient_id == user.id,
                        NotificationLog.sent_at >= today_start
                    ).first()
                    if already_sent: continue

                    already_pending = db.query(PendingNotification).filter(
                        PendingNotification.notification_rule_id == template_rule.id,
                        PendingNotification.recipient_id == user.id,
                        PendingNotification.status == "pending",
                        PendingNotification.scheduled_for >= today_start
                    ).first()
                    if already_pending: continue

                    # Schedule it
                    try:
                        hour, minute = map(int, template_rule.send_time.split(':'))
                        target_time = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
                    except:
                        target_time = now.replace(hour=8, minute=0, second=0, microsecond=0)
                        
                    if target_time < now:
                        target_time = now + timedelta(minutes=5)

                    # Render
                    render_vars = { "patient_name": user.nombre_completo }
                    render_vars.update(smart_ctx)
                    
                    # Standard Rule render
                    rendered = template_rule.render_content(render_vars)

                    pending = PendingNotification(
                        notification_rule_id=template_rule.id,
                        recipient_id=user.id,
                        subject=rendered["title"],
                        body=rendered["message_html"],
                        message_text=rendered["message_text"],
                        scheduled_for=target_time,
                        channel=template_rule.channel,
                        status="pending"
                    )
                    db.add(pending)
                
                # Commit per user to avoid massive loss on error
                db.commit()
                        
            except Exception as e:
                logger.error(f"Error processing user {user.id}: {e}", exc_info=True)
                db.rollback()
                
    except Exception as e:
        logger.error(f"Critical Error in process_dynamic_notifications: {e}", exc_info=True)
    finally:
        db.close()
