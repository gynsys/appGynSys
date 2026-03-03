import time
from datetime import datetime, date, timedelta
from typing import Dict, List, Optional
from functools import lru_cache
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError

from app.db.models.notification import NotificationRule, NotificationLog, PendingNotification
from app.db.models.cycle_user import CycleUser
from app.db.models.cycle_predictor import CycleLog, PregnancyLog, CycleNotificationSettings
from app.cycle_predictor.logic import calculate_predictions

from .base import (
    logger, normalize_to_caracas, session_scope, log_notification_event,
    BATCH_SIZE_USERS, BATCH_SIZE_DELIVERY, MAX_RETRIES,
    STALE_PROCESSING_TIMEOUT_MINUTES, calculate_next_retry_time
)
from .registry import (
    NOTIFICATION_REGISTRY, NOTIFICATION_MAP, _RuleData, evaluate_registry_rule
)
from .context import calculate_smart_context, validate_smart_context
from .sender import safe_render_content, send_dual_notification_logic

@lru_cache(maxsize=1)
def get_cached_global_rules(ttl_hash: int = 0) -> Dict[str, _RuleData]:
    """Cache de reglas globales con TTL (hash horario)."""
    with session_scope() as db:
        rules_list = db.query(NotificationRule).filter(
            NotificationRule.tenant_id == None,
            NotificationRule.is_active == True
        ).all()
        rules = {r.notification_type: _RuleData(r) for r in rules_list}
        logger.info(f"Loaded {len(rules)} global rules into cache (primitive data)")
        return rules

def _process_single_user(user_id: int, global_rules: Dict[str, _RuleData], now: datetime, today_date: date):
    """Procesa un único usuario."""
    with session_scope() as db:
        user = db.query(CycleUser).filter(CycleUser.id == user_id, CycleUser.is_active == True).first()
        if not user or not user.is_active:
            return
        
        user_settings = db.query(CycleNotificationSettings).filter(
            CycleNotificationSettings.cycle_user_id == user.id
        ).first()
        if not user_settings:
            return
        
        pregnancy = db.query(PregnancyLog).filter(
            PregnancyLog.cycle_user_id == user.id, 
            PregnancyLog.is_active == True
        ).first()
        
        predictions = None
        if not pregnancy:
            try:
                last_cycle = db.query(CycleLog).filter(
                    CycleLog.cycle_user_id == user.id
                ).order_by(CycleLog.start_date.desc()).first()
                if last_cycle and user.cycle_avg_length:
                    predictions = calculate_predictions(last_cycle.start_date, user.cycle_avg_length, user.period_avg_length)
            except Exception as e:
                logger.error(f"Error calculating predictions for user {user.id}: {e}")

        smart_ctx = calculate_smart_context(user, predictions, pregnancy, db)
        is_valid, error = validate_smart_context(smart_ctx)
        if not is_valid:
            logger.error(f"Invalid context for user {user.id}: {error}")
            return

        rule_id_to_type: Dict[int, str] = {v.id: k for k, v in global_rules.items()}
        sent_rule_ids = {log.notification_rule_id for log in db.query(NotificationLog).filter(
            NotificationLog.recipient_id == user.id,
            func.date(NotificationLog.sent_at) == today_date
        )}
        pending_rule_ids = {pend.notification_rule_id for pend in db.query(PendingNotification).filter(
            PendingNotification.recipient_id == user.id,
            PendingNotification.status.in_(["pending", "retrying", "processing"]),
            func.date(PendingNotification.scheduled_for) == today_date
        )}
        active_rule_ids = sent_rule_ids | pending_rule_ids

        categories_sent_today = set()
        for rid in active_rule_ids:
            ntype = rule_id_to_type.get(rid)
            if ntype and ntype in NOTIFICATION_MAP:
                categories_sent_today.add(NOTIFICATION_MAP[ntype]["category"])

        notifications_created = 0
        for rule_def in NOTIFICATION_REGISTRY:
            rtype = rule_def["type"]
            category = rule_def.get("category", "system")
            
            if not evaluate_registry_rule(rule_def, smart_ctx, user_settings):
                continue

            template_rule = global_rules.get(rtype)
            if not template_rule or template_rule.id in active_rule_ids:
                continue

            if category in categories_sent_today:
                continue
            
            render_vars = {"patient_name": user.nombre_completo or "Usuario"}
            render_vars.update(smart_ctx)
            rendered = safe_render_content(template_rule, render_vars)
            if not rendered:
                continue
            
            try:
                send_time = template_rule.send_time
                if rule_def["category"] == "contraceptive" and user_settings.contraceptive_time:
                    send_time = user_settings.contraceptive_time
                hour, minute = map(int, send_time.split(':'))
                target_time = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
            except:
                target_time = now.replace(hour=8, minute=0, second=0, microsecond=0)
            
            if target_time < now:
                target_time = now + timedelta(minutes=5)
            
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
            try:
                db.flush()
                active_rule_ids.add(template_rule.id)
                categories_sent_today.add(category)
                notifications_created += 1
                log_notification_event("RULE_QUEUED", user.id, rtype, {"rule_id": template_rule.id})
            except IntegrityError:
                db.rollback()
                continue

def run_daily_evaluation():
    """Tarea diaria principal."""
    try:
        now = normalize_to_caracas()
        today_date = now.date()
        ttl_hash = int(time.time()) // 3600
        global_rules = get_cached_global_rules(ttl_hash)
        
        if not global_rules:
            return
        
        with session_scope() as db:
            user_ids = [row[0] for row in db.query(CycleUser.id).filter(CycleUser.is_active == True).yield_per(BATCH_SIZE_USERS)]
        
        for user_id in user_ids:
            try:
                _process_single_user(user_id, global_rules, now, today_date)
            except Exception as e:
                logger.error(f"Error processing user {user_id}: {e}")
    except Exception as e:
        logger.error(f"Critical error in run_daily_evaluation: {e}")

def deliver_pending_notifications():
    """Entrega notificaciones."""
    try:
        now = normalize_to_caracas()
        for _ in range(10):
            with session_scope() as db:
                subquery = db.query(PendingNotification.id).filter(
                    PendingNotification.status.in_(["pending", "retrying"]),
                    PendingNotification.scheduled_for <= now
                ).with_for_update(skip_locked=True).limit(BATCH_SIZE_DELIVERY).subquery()
                
                pending_ids = [row[0] for row in db.query(subquery.c.id).all()]
                if not pending_ids:
                    break
                
                db.query(PendingNotification).filter(PendingNotification.id.in_(pending_ids)).update({
                    "status": "processing", "updated_at": now
                }, synchronize_session=False)
            
            for pid in pending_ids:
                with session_scope() as db:
                    item = db.query(PendingNotification).options(joinedload(PendingNotification.rule)).filter_by(id=pid).first()
                    if not item or item.status != "processing":
                        continue
                    
                    success, channel, error = send_dual_notification_logic(db, item)
                    if success:
                        item.status = "sent"
                        item.sent_at = now
                        item.channel_used = channel
                        db.add(NotificationLog(
                            notification_rule_id=item.notification_rule_id,
                            recipient_id=item.recipient_id,
                            notification_type=item.rule.notification_type if item.rule else "unknown",
                            title_sent=item.subject, status="sent", channel_used=channel, sent_at=now
                        ))
                    else:
                        item.retry_count += 1
                        item.last_error = error[:500] if error else None
                        if item.retry_count >= MAX_RETRIES:
                            item.status = "failed"
                        else:
                            item.status = "retrying"
                            item.scheduled_for = calculate_next_retry_time(item.retry_count)
    except Exception as e:
        logger.error(f"Error in deliver_pending_notifications: {e}")

def trigger_immediate_evaluation(user_id: int, db: Session):
    """Fuerza evaluación inmediata."""
    try:
        now = normalize_to_caracas()
        today_date = now.date()
        db.query(PendingNotification).filter(
            PendingNotification.recipient_id == user_id,
            PendingNotification.status.in_(["pending", "retrying"]),
            func.date(PendingNotification.scheduled_for) == today_date
        ).delete(synchronize_session=False)
        db.commit()
        
        ttl_hash = int(time.time()) // 3600
        global_rules = get_cached_global_rules(ttl_hash)
        _process_single_user(user_id, global_rules, now, today_date)
        deliver_pending_notifications()
    except Exception as e:
        logger.error(f"Error triggering evaluation: {e}")

def recover_stale_processing_notifications() -> int:
    """Rescata notificaciones atascadas."""
    try:
        now = normalize_to_caracas()
        cutoff = now - timedelta(minutes=STALE_PROCESSING_TIMEOUT_MINUTES)
        with session_scope() as db:
            stale_ids = [row[0] for row in db.query(PendingNotification.id).filter(
                PendingNotification.status == "processing", PendingNotification.updated_at < cutoff
            ).all()]
            if not stale_ids: return 0
            return db.query(PendingNotification).filter(PendingNotification.id.in_(stale_ids)).update({
                "status": "retrying", "updated_at": now,
                "retry_count": PendingNotification.retry_count + 1,
                "scheduled_for": now + timedelta(minutes=2)
            }, synchronize_session=False)
    except Exception as e:
        logger.error(f"Error in recovery: {e}"); return 0
