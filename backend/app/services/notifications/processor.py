import time
from datetime import datetime, date, timedelta
from typing import Dict, List, Optional
from functools import lru_cache
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError

from app.db.models.notification import NotificationRule, NotificationLog, PendingNotification
from app.db.models.cycle_user import CycleUser
from app.db.models.doctor import Doctor
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
from .doctor_registry import (
    DOCTOR_NOTIFICATION_REGISTRY, DOCTOR_NOTIFICATION_MAP, evaluate_doctor_rule
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

        smart_ctx = calculate_smart_context(user, db, predictions, pregnancy)
        is_valid, error = validate_smart_context(smart_ctx)
        if not is_valid:
            logger.error(f"Invalid context for user {user.id}: {error}")
            return

        rule_id_to_type: Dict[int, str] = {v.id: k for k, v in global_rules.items()}
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)

        sent_rule_ids = {log.notification_rule_id for log in db.query(NotificationLog).filter(
            NotificationLog.recipient_id == user.id,
            NotificationLog.sent_at >= today_start,
            NotificationLog.sent_at < today_end
        )}
        pending_rule_ids = {pend.notification_rule_id for pend in db.query(PendingNotification).filter(
            PendingNotification.recipient_id == user.id,
            PendingNotification.status.in_(["pending", "retrying", "processing"]),
            PendingNotification.scheduled_for >= today_start,
            PendingNotification.scheduled_for < today_end
        )}

        notifications_created = 0
        for rule_def in NOTIFICATION_REGISTRY:
            rtype = rule_def["type"]
            category = rule_def.get("category", "system")
            
            if not evaluate_registry_rule(rule_def, smart_ctx, user_settings):
                continue

            template_rule = global_rules.get(rtype)
            if not template_rule:
                continue
            
            try:
                send_time = template_rule.send_time
                if rule_def["category"] == "contraceptive" and user_settings.contraceptive_time:
                    send_time = user_settings.contraceptive_time
                hour, minute = map(int, send_time.split(':'))
                target_time = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
            except:
                target_time = now.replace(hour=8, minute=0, second=0, microsecond=0)

            # Evita encolar la misma notificacion multiple veces en pending hoy
            if template_rule.id in pending_rule_ids:
                continue

            # Si ya se envio, solo encolar devuelta si el usuario coloco un target_time en el futuro hoy
            if template_rule.id in sent_rule_ids and target_time <= now:
                continue
            
            render_vars = {"patient_name": user.nombre_completo or "Usuario"}
            render_vars.update(smart_ctx)
            rendered = safe_render_content(template_rule, render_vars)
            if not rendered:
                continue
            
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
                pending_rule_ids.add(template_rule.id)
                notifications_created += 1
                log_notification_event("RULE_QUEUED", user.id, rtype, {"rule_id": template_rule.id})
            except IntegrityError:
                db.rollback()
                continue

def _process_single_doctor(doctor_id: int, global_rules: Dict[str, _RuleData], now: datetime, today_date: date):
    """Procesa una única doctora."""
    with session_scope() as db:
        doctor = db.query(Doctor).filter(Doctor.id == doctor_id, Doctor.is_active == True).first()
        if not doctor:
            return
            
        smart_ctx = calculate_smart_context(doctor, db)
        is_valid, error = validate_smart_context(smart_ctx)
        if not is_valid:
            logger.error(f"Invalid context for doctor {doctor.id}: {error}")
            return

        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)

        # Buscar si ya se enviaron/encolaron hoy
        sent_rule_ids = {log.notification_rule_id for log in db.query(NotificationLog).filter(
            NotificationLog.doctor_id == doctor.id,
            NotificationLog.sent_at >= today_start,
            NotificationLog.sent_at < today_end
        )}
        pending_rule_ids = {pend.notification_rule_id for pend in db.query(PendingNotification).filter(
            PendingNotification.doctor_id == doctor.id,
            PendingNotification.status.in_(["pending", "retrying", "processing"]),
            PendingNotification.scheduled_for >= today_start,
            PendingNotification.scheduled_for < today_end
        )}

        for rule_def in DOCTOR_NOTIFICATION_REGISTRY:
            rtype = rule_def["type"]
            
            # Usar la nueva lógica de evaluación de doctores
            if not evaluate_doctor_rule(rule_def, smart_ctx):
                continue

            template_rule = global_rules.get(rtype)
            if not template_rule:
                continue
            
            if template_rule.id in pending_rule_ids:
                continue

            # Determinación de hora de envío
            hour, minute = map(int, template_rule.send_time.split(':'))
            target_time = now.replace(hour=hour, minute=minute, second=0, microsecond=0)

            if template_rule.id in sent_rule_ids and target_time <= now:
                continue
            
            render_vars = {"patient_name": "Colega", "doctor_name": doctor.nombre_completo}
            render_vars.update(smart_ctx)
            rendered = safe_render_content(template_rule, render_vars)
            if not rendered:
                continue
            
            if target_time < now:
                target_time = now + timedelta(minutes=1) # Envío casi inmediato si ya pasó la hora
            
            pending = PendingNotification(
                notification_rule_id=template_rule.id,
                doctor_id=doctor.id,
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
                pending_rule_ids.add(template_rule.id)
                log_notification_event("RULE_QUEUED_DOCTOR", doctor.id, rtype, {"rule_id": template_rule.id})
            except IntegrityError:
                db.rollback()
                continue

def run_daily_evaluation():
    """Tarea diaria principal."""
    try:
        now = normalize_to_caracas()
        today_date = now.date()
        # Refresh rules every 60 seconds instead of every hour
        ttl_hash = int(time.time()) // 60
        global_rules = get_cached_global_rules(ttl_hash)
        
        if not global_rules:
            return
        
        with session_scope() as db:
            user_ids = [row[0] for row in db.query(CycleUser.id).filter(CycleUser.is_active == True).yield_per(BATCH_SIZE_USERS)]
            doctor_ids = [row[0] for row in db.query(Doctor.id).filter(Doctor.is_active == True).all()]
        
        # Procesar usuarias
        for user_id in user_ids:
            try:
                _process_single_user(user_id, global_rules, now, today_date)
            except Exception as e:
                logger.error(f"Error processing user {user_id}: {e}")

        # Procesar doctores
        for doc_id in doctor_ids:
            try:
                _process_single_doctor(doc_id, global_rules, now, today_date)
            except Exception as e:
                logger.error(f"Error processing doctor {doc_id}: {e}")
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
                    
                    # 1. Intentar envío DUAL (Emails + Push) 
                    # El log_id se pasaría si ya existiera, pero vamos a crearlo después para mayor precisión
                    success, channel, error = send_dual_notification_logic(db, item)
                    
                    # 2. Crear el Log de Notificación con el RESULTADO REAL
                    log = NotificationLog(
                        notification_rule_id=item.notification_rule_id,
                        recipient_id=item.recipient_id,
                        doctor_id=item.doctor_id,
                        notification_type=item.rule.notification_type if item.rule else "unknown",
                        title_sent=item.subject,
                        status="sent" if success else "failed",
                        channel_used=channel or "none",
                        error_message=error[:500] if error else None,
                        sent_at=now
                    )
                    db.add(log)

                    if success:
                        item.status = "sent"
                        item.sent_at = now
                        item.channel_used = channel
                    else:
                        item.retry_count += 1
                        item.last_error = error[:500] if error else "Total failure"
                        
                        if item.retry_count >= MAX_RETRIES:
                            item.status = "failed"
                        else:
                            item.status = "retrying"
                            item.scheduled_for = calculate_next_retry_time(item.retry_count)
                    
                    db.flush()
    except Exception as e:
        logger.error(f"Error in deliver_pending_notifications: {e}")

def trigger_immediate_evaluation(user_id: int, db: Session):
    """Fuerza evaluación inmediata."""
    try:
        now = normalize_to_caracas()
        today_date = now.date()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        
        db.query(PendingNotification).filter(
            PendingNotification.recipient_id == user_id,
            PendingNotification.status.in_(["pending", "retrying"]),
            PendingNotification.scheduled_for >= today_start,
            PendingNotification.scheduled_for < today_end
        ).delete(synchronize_session=False)
        db.commit()
        
        # Refresh rules every 60 seconds instead of every hour
        ttl_hash = int(time.time()) // 60
        global_rules = get_cached_global_rules(ttl_hash)
        _process_single_user(user_id, global_rules, now, today_date)
        deliver_pending_notifications()
    except Exception as e:
        logger.error(f"Error triggering evaluation: {e}")

def trigger_doctor_event(doctor_id: int, notification_type: str, context: dict, db: Session):
    """
    Dispara una notificación inmediata para un doctor basada en un evento.
    """
    try:
        from .sender import safe_render_content
        
        now = normalize_to_caracas()
        
        # 1. Obtener la regla GLOBAL (Centralizada para todos los doctores)
        rule = db.query(NotificationRule).filter(
            NotificationRule.tenant_id == None,
            NotificationRule.notification_type == notification_type,
            NotificationRule.is_active == True
        ).first()
        
        if not rule:
            logger.warning(f"No active global rule found for type {notification_type}")
            return False

        # 2. Evaluar lógica (Registry de Doctores)
        rule_def = DOCTOR_NOTIFICATION_MAP.get(notification_type)
        if not rule_def:
            logger.error(f"Rule type {notification_type} not found in doctor registry")
            return False
            
        # Añadir el rol doctor al contexto
        full_context = context.copy()
        full_context["role"] = "doctor"
        
        if not evaluate_doctor_rule(rule_def, full_context):
            return False

        # 3. Renderizar
        rendered = safe_render_content(rule, full_context)
        if not rendered:
            return False

        # 4. Encolar
        pending = PendingNotification(
            notification_rule_id=rule.id,
            doctor_id=doctor_id,
            subject=rendered["title"],
            body=rendered["message_html"],
            message_text=rendered["message_text"],
            scheduled_for=now,
            channel=rule.channel,
            status="pending"
        )
        db.add(pending)
        db.commit()
        
        # 5. Intentar entrega inmediata
        deliver_pending_notifications()
        return True
    except Exception as e:
        logger.error(f"Error triggering doctor event {notification_type}: {e}", exc_info=True)
        return False

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

def cleanup_invalid_subscriptions(db: Session) -> int:
    """
    Elimina selectivamente suscripciones Push que han fallado con errores críticos (403, 410).
    A diferencia de la versión anterior, esta NO borra tokens de App Nativa (Capacitor)
    a menos que el error sea específico de FCM, y maneja tanto Doctores como Pacientes.
    """
    from app.db.models.push_subscription import PushSubscription
    from sqlalchemy import or_
    
    # Patrones de errores que indican que un endpoint web ya no es válido
    stale_error_patterns = ['%403%', '%410%', '%Gone%', '%VAPID%']
    filters = or_(*[PendingNotification.last_error.like(p) for p in stale_error_patterns])
    
    # 1. Identificar destinatarios (Pacientes y Doctores) con errores recientes de este tipo
    affected_users = db.query(PendingNotification.recipient_id).filter(
        PendingNotification.status == "failed",
        filters,
        PendingNotification.recipient_id.isnot(None)
    ).distinct().all()
    user_ids = [r[0] for r in affected_users]

    affected_doctors = db.query(PendingNotification.doctor_id).filter(
        PendingNotification.status == "failed",
        filters,
        PendingNotification.doctor_id.isnot(None)
    ).distinct().all()
    doctor_ids = [r[0] for r in affected_doctors]

    deleted_total = 0

    # 2. Borrado SELECTIVO: Solo borramos dispositivos WEB (donde endpoint no es nulo)
    # Esto protege los tokens de la App Nativa que suelen fallar por otras razones (red, etc)
    # y que el usuario reporta que desaparecen injustificadamente.
    
    if user_ids:
        deleted = db.query(PushSubscription).filter(
            PushSubscription.user_id.in_(user_ids),
            PushSubscription.endpoint.isnot(None)
        ).delete(synchronize_session=False)
        deleted_total += deleted

    if doctor_ids:
        deleted = db.query(PushSubscription).filter(
            PushSubscription.doctor_id.in_(doctor_ids),
            PushSubscription.endpoint.isnot(None)
        ).delete(synchronize_session=False)
        deleted_total += deleted
        
    db.commit()
    logger.info(f"[GynSysCleanup] Se eliminaron {deleted_total} suscripciones WEB inválidas. Tokens nativos preservados.")
    return deleted_total
