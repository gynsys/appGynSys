from datetime import date, datetime, timedelta
import json
import traceback
from app.core.celery_app import celery_app
from app.db.base import SessionLocal
from app.db.models.doctor import Doctor
from app.db.models.cycle_user import CycleUser
from app.db.models.notification import NotificationRule, NotificationLog, NotificationType, NotificationChannel
from app.db.models.cycle_predictor import CycleLog, PregnancyLog, SymptomLog
from app.cycle_predictor.logic import calculate_predictions

def calculate_smart_context(user: CycleUser, predictions: dict, pregnancy: PregnancyLog, db_session=None) -> dict:
    """
    Build a comprehensive context object describing the user's current status
    to be checked against rules.
    """
    today = date.today()
    ctx = { "today": today }
    
    # 1. Pregnancy Context
    if pregnancy:
        ctx["is_pregnant"] = True
        gestation_days = (today - pregnancy.last_period_date).days
        ctx["gestation_days"] = gestation_days
        ctx["gestation_week"] = gestation_days // 7
        
        # Prenatal Details (Trimester & Daily)
        ctx["gestation_day_of_week"] = (gestation_days % 7) + 1 # 1-7
        
        if ctx["gestation_week"] < 14:
            ctx["trimester"] = 1
        elif ctx["gestation_week"] < 28:
            ctx["trimester"] = 2
        else:
            ctx["trimester"] = 3
            
    # Universal Symptom Check (Pregnant or Not)
    if db_session:
        symptom_log = db_session.query(SymptomLog).filter(
            SymptomLog.cycle_user_id == user.id,
            SymptomLog.date == today
        ).first()
        if symptom_log and symptom_log.symptoms:
             # Ensure it determines if JSON is list or dict? Usually list of strings.
             if isinstance(symptom_log.symptoms, list):
                 ctx["reported_symptoms"] = symptom_log.symptoms
             elif isinstance(symptom_log.symptoms, str):
                 ctx["reported_symptoms"] = [symptom_log.symptoms]

    if pregnancy:
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
    
    # --- MASTER SWITCH FILTERING (Usability 2.0) ---
    if user_settings:
        if context.get("is_pregnant"):
            # Prenatal Logic
            is_daily = (rule.notification_type == NotificationType.PRENATAL_DAILY or rule.notification_type == "prenatal_daily")
            is_alert = (rule.notification_type == NotificationType.PRENATAL_ALERT or rule.notification_type == "prenatal_alert")
            is_milestone_or_study = (rule.notification_type == NotificationType.PRENATAL_MILESTONE or rule.notification_type == "prenatal_milestone")

            if is_daily and not user_settings.prenatal_daily_tips: return False
            if is_alert and not user_settings.prenatal_symptom_alerts: return False
            
            if is_milestone_or_study:
                name_lower = rule.name.lower()
                if "ecografía" in name_lower or "ecografia" in name_lower:
                    if not user_settings.prenatal_ultrasounds: return False
                elif "semana" in name_lower and ("-" in name_lower or "semana" in name_lower): # Heuristic for "Semana X"
                     if not user_settings.prenatal_milestones: return False
                else:
                     if not user_settings.prenatal_lab_results: return False

        else:
            # Cycle Logic
            # 1. Contraceptives (Handled by specific block below generally, but good to double check here or trust below)
            if trigger.get("type") == "contraceptive":
                 if not user_settings.contraceptive_enabled: return False

            # 2. Fertile Window / Ovulation
            if "is_fertile_start" in trigger or "is_ovulation_day" in trigger or "days_after_ovulation" in trigger:
                 if not user_settings.cycle_fertile_window: return False
                 
            # 3. Period Predictions (days_before_period)
            if "days_before_period" in trigger:
                 # Distinguish Rhythm/PMS? 
                 # If rule implies "Abstinencia" -> Rhythm
                 if "abstinencia" in rule.name.lower() or "ritmo" in rule.name.lower():
                      if not user_settings.cycle_rhythm_method: return False
                 elif "síntoma" in rule.name.lower() or "pms" in rule.name.lower() or "premenstrual" in rule.name.lower():
                      if not user_settings.cycle_pms_symptoms: return False
                 else:
                      # Default Prediction
                      if not user_settings.cycle_period_predictions: return False

            # 4. Period Confirmation
            if trigger.get("event") == "period_confirmation":
                 if not user_settings.period_confirmation_reminder: return False # Keep existing or map to period_predictions? Keeping existing for now.

    # --- END MASTER SWITCHES ---

    # --- PRENATAL ---
    if context.get("is_pregnant"):
        # Milestone (Weekly)
        if rule.notification_type == NotificationType.PRENATAL_MILESTONE or rule.notification_type == "prenatal_milestone":
             if "gestation_week" in trigger:
                return trigger["gestation_week"] == context.get("gestation_week")
             # Handle Range (Start/End)
             if "semana_inicio" in trigger and "semana_fin" in trigger:
                 gw = context.get("gestation_week")
                 # Trigger only on the START week to avoid spam? Or every week in range?
                 # Usually ranges are "Window to check". Let's trigger on START week.
                 return gw == trigger["semana_inicio"]
        
        # Daily Tip (Trimester + Day)
        if rule.notification_type == NotificationType.PRENATAL_DAILY or rule.notification_type == "prenatal_daily":
             # Trigger formatting: {"trimestre": 1, "dia": 5}
             t_trim = trigger.get("trimestre")
             t_day = trigger.get("dia")
             if t_trim and t_day:
                 return (context.get("trimester") == t_trim) and (context.get("gestation_day_of_week") == t_day)
                 
        # Alerts (Symptoms)
        # We need reported symptoms in context. For now, we assume user just logged them if this is event-driven?
        # IMPORTANT: Alerts are usually EVENT DRIVEN (Real-time), not Daily Task.
        # But if we check daily summary...
        if rule.notification_type == NotificationType.PRENATAL_ALERT or rule.notification_type == "prenatal_alert":
             trigger_symptom = trigger.get("sintoma_disparador")
             reported_symptoms = context.get("reported_symptoms", [])
             if trigger_symptom and reported_symptoms:
                 # Check partial match or exact?
                 # Simple substring match for robustness
                 for s in reported_symptoms:
                     if trigger_symptom.lower() in s.lower() or s.lower() in trigger_symptom.lower():
                         return True
        
        return False

    # Skip cycle rules if pregnant
    if context.get("is_pregnant"): return False

    # --- PILL LOGIC ---
    # Check if rule looks like a contraceptive rule
    if trigger.get("type") == "contraceptive":
        # (Master check done above, but safe to keep)
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
def send_scheduled_notification_task(user_id: int, rule_id: int, context_vars: dict):
    """
    Background task to actually send the notification safely at the requested ETA.
    """
    db = SessionLocal()
    try:
        user = db.query(CycleUser).filter(CycleUser.id == user_id).first()
        rule = db.query(NotificationRule).filter(NotificationRule.id == rule_id).first()
        if not user or not rule:
            return
            
        send_dual_notification(db, user, rule, context_vars)
    finally:
        db.close()

@celery_app.task
def process_dynamic_notifications():
    """
    Daily Task (runs at 8:00 AM): Evaluate Smart Rules -> Schedule Sends.
    """
    db = SessionLocal()
    try:
        doctors = db.query(Doctor).filter(Doctor.is_active == True).all()
        today = date.today()
        
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
                    # Logic to identify if it's a "Tip" vs "Alert"
                    # User requested Tips at 10 AM, others at 6-8 PM (18:30)
                    base_time = datetime.now()
                    tip_eta = base_time.replace(hour=10, minute=0, second=0, microsecond=0)
                    alert_eta = base_time.replace(hour=18, minute=30, second=0, microsecond=0)
                    
                    # Ensure ETA is in the future (if evaluation runs late)
                    if tip_eta < base_time: tip_eta = base_time + timedelta(minutes=1)
                    if alert_eta < base_time: alert_eta = base_time + timedelta(minutes=1)

                    from app.db.models.cycle_predictor import CycleNotificationSettings
                    user_settings = db.query(CycleNotificationSettings).filter(
                        CycleNotificationSettings.cycle_user_id == user.id
                    ).first()

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
                    
                    render_vars = {
                        "patient_name": user.nombre_completo,
                        "today": today
                    }
                    render_vars.update(smart_ctx)
                    
                    for rule in rules:
                        # Frequency Cap
                        today_start = datetime.now().replace(hour=0, minute=0, second=0)
                        already_sent = db.query(NotificationLog).filter(
                            NotificationLog.notification_rule_id == rule.id,
                            NotificationLog.recipient_id == user.id,
                            NotificationLog.sent_at >= today_start
                        ).first()
                        
                        if already_sent: continue

                        if evaluate_rule(rule, smart_ctx, user_settings):
                            # Stagger logic: Tips/Daily go at 10 AM, Alerts at 18:30
                            is_tip = (rule.notification_type in [NotificationType.PRENATAL_DAILY, NotificationType.CUSTOM])
                            # heuristic: if "consejo" or "tip" in name
                            if not is_tip:
                                name_lower = rule.name.lower()
                                is_tip = "consejo" in name_lower or "tip" in name_lower
                            
                            target_eta = tip_eta if is_tip else alert_eta
                            
                            # Schedule the send
                            send_scheduled_notification_task.apply_async(
                                kwargs={
                                    "user_id": user.id,
                                    "rule_id": rule.id,
                                    "context_vars": render_vars
                                },
                                eta=target_eta
                            )
                            
                except Exception as e:
                    print(f"Error processing user {user.id}: {traceback.format_exc()}")
                    
    except Exception as e:
        print(f"Critical Error in process_dynamic_notifications: {e}")
    finally:
        db.close()
