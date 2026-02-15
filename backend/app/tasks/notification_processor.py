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

def evaluate_rule(rule: NotificationRule, context: dict, user_settings: CycleNotificationSettings) -> bool:
    """
    Check if a rule trigger matches the SMART CONTEXT and user preferences.
    """
    trigger = rule.trigger_condition
    if not trigger: return False
    
    if not user_settings: return False

    # Master switches filtering
    if context.get("is_pregnant"):
        is_daily = (rule.notification_type == "prenatal_daily_tip")
        is_alert = (rule.notification_type == "prenatal_alert")
        is_milestone = (rule.notification_type == "prenatal_milestone")

        if is_daily and not user_settings.prenatal_daily_tips: return False
        if is_alert and not user_settings.prenatal_symptom_alerts: return False
        
        if is_milestone:
            name_lower = rule.name.lower()
            if "ecografía" in name_lower or "ecografia" in name_lower:
                if not user_settings.prenatal_ultrasounds: return False
            elif "semana" in name_lower:
                 if not user_settings.prenatal_milestones: return False
            else:
                 if not user_settings.prenatal_lab_results: return False
    else:
        # Cycle switches
        if trigger.get("type") == "contraceptive":
             if not user_settings.contraceptive_enabled: return False

        if "is_fertile_start" in trigger or "is_ovulation_day" in trigger or "days_after_ovulation" in trigger:
             if not user_settings.cycle_fertile_window: return False
             
        if "days_before_period" in trigger:
             if "abstinencia" in rule.name.lower() or "ritmo" in rule.name.lower():
                  if not user_settings.cycle_rhythm_method: return False
             elif "síntoma" in rule.name.lower() or "pms" in rule.name.lower():
                  if not user_settings.cycle_pms_symptoms: return False
             else:
                  if not user_settings.cycle_period_predictions: return False

        if trigger.get("event") == "period_confirmation":
             if not user_settings.period_confirmation_reminder: return False

    # Logic matching
    if context.get("is_pregnant"):
        if rule.notification_type == "prenatal_milestone":
             if "gestation_week" in trigger:
                return trigger["gestation_week"] == context.get("gestation_week")
             if "semana_inicio" in trigger and "semana_fin" in trigger:
                  return context.get("gestation_week") == trigger["semana_inicio"]
        
        if rule.notification_type == "prenatal_daily_tip":
             return (context.get("trimester") == trigger.get("trimestre")) and (context.get("gestation_day_of_week") == trigger.get("dia"))
                 
        if rule.notification_type == "prenatal_alert":
             trigger_symptom = trigger.get("sintoma_disparador")
             reported_symptoms = context.get("reported_symptoms", [])
             if trigger_symptom and reported_symptoms:
                 for s in reported_symptoms:
                     if trigger_symptom.lower() in s.lower(): return True
        return False

    if trigger.get("type") == "contraceptive":
        if trigger.get("subtype") == "new_pack":
             return context.get("pill_event") == "new_pack"
        return trigger.get("subtype") == context.get("pill_subtype")

    if trigger.get("event") == "period_confirmation":
        return context.get("period_confirmation_needed") and trigger.get("day_late") == context.get("days_late")

    # Simple day/offset triggers
    for key in ["cycle_day", "days_before_period", "days_after_ovulation"]:
        if key in trigger:
            return trigger[key] == context.get(key)

    if trigger.get("is_ovulation_day") and context.get("is_ovulation_day"): return True
    if trigger.get("is_fertile_start") and context.get("is_fertile_start"): return True
    if trigger.get("is_fertile_end") and context.get("is_fertile_end"): return True

    if trigger.get("event") == "annual_checkup" and context.get("is_annual_checkup"):
        return True

    return False

@celery_app.task
def process_dynamic_notifications():
    """
    Daily Task (8:00 AM): Evaluates all rules for all users and queues PendingNotifications.
    """
    db = SessionLocal()
    try:
        doctors = db.query(Doctor).filter(Doctor.is_active == True).all()
        tz = pytz.timezone('America/Caracas')
        now = datetime.now(tz)
        
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
            
            for user in users:
                try:
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
                    
                    for rule in rules:
                        # Frequency Cap: Don't queue if sent today
                        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
                        already_sent = db.query(NotificationLog).filter(
                            NotificationLog.notification_rule_id == rule.id,
                            NotificationLog.recipient_id == user.id,
                            NotificationLog.sent_at >= today_start
                        ).first()
                        if already_sent: continue

                        # Already pending?
                        already_pending = db.query(PendingNotification).filter(
                            PendingNotification.notification_rule_id == rule.id,
                            PendingNotification.recipient_id == user.id,
                            PendingNotification.status == "pending",
                            PendingNotification.scheduled_for >= today_start
                        ).first()
                        if already_pending: continue

                        if evaluate_rule(rule, smart_ctx, user_settings):
                            # Use rule.send_time (HH:MM)
                            try:
                                hour, minute = map(int, rule.send_time.split(':'))
                                target_time = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
                            except:
                                target_time = now.replace(hour=8, minute=0, second=0, microsecond=0)
                                
                            if target_time < now:
                                target_time = now + timedelta(minutes=5) # Run soon if time passed

                            # Render Content
                            render_vars = { "patient_name": user.nombre_completo }
                            render_vars.update(smart_ctx)
                            
                            rendered = rule.render_content(render_vars)

                            pending = PendingNotification(
                                notification_rule_id=rule.id,
                                recipient_id=user.id,
                                subject=rendered["title"],
                                body=rendered["message_html"],
                                message_text=rendered["message_text"],
                                scheduled_for=target_time,
                                channel=rule.channel,
                                status="pending"
                            )
                            db.add(pending)
                    
                    db.commit()
                            
                except Exception as e:
                    logger.error(f"Error processing user {user.id}: {e}", exc_info=True)
                    db.rollback()
                    
    except Exception as e:
        logger.error(f"Critical Error in process_dynamic_notifications: {e}", exc_info=True)
    finally:
        db.close()
