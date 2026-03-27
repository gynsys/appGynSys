"""
Paquete Modular de Notificaciones.
Re-exporta la API pública para mantener compatibilidad con el resto de la aplicación.
"""
from .base import (
    normalize_to_caracas,
    log_notification_event,
    push_circuit,
    session_scope,
    MAX_NOTIFICATIONS_PER_CATEGORY_PER_DAY,
    NOTIFICATION_CATEGORIES,
)
from .registry import (
    NOTIFICATION_REGISTRY,
    NOTIFICATION_MAP,
    evaluate_registry_rule,
    _RuleData,
)
from .context import (
    calculate_smart_context,
    validate_smart_context,
)
from .sender import (
    safe_render_content,
    send_dual_notification_logic,
)
from .processor import (
    run_daily_evaluation,
    deliver_pending_notifications,
    trigger_immediate_evaluation,
    trigger_doctor_event,
    recover_stale_processing_notifications,
    cleanup_invalid_subscriptions,
)
from .health import (
    get_notification_system_health,
)
from .management import (
    sync_notification_registry_to_db,
)

# CRUD (Viviendo en submodulos si es necesario, o re-implementados aqui para simplicidad)
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.models.notification import NotificationRule
from app.schemas.notification import NotificationRuleUpdate

def get_global_rules(db: Session) -> List[NotificationRule]:
    """Get all system-wide notification rules."""
    return db.query(NotificationRule).filter(NotificationRule.tenant_id == None).order_by(NotificationRule.priority).all()

def get_rule_by_type(db: Session, tenant_id: Optional[int], notification_type: str) -> Optional[NotificationRule]:
    return db.query(NotificationRule).filter(
        NotificationRule.tenant_id == tenant_id,
        NotificationRule.notification_type == notification_type
    ).first()

def update_rule(db: Session, db_obj: NotificationRule, rule_in: NotificationRuleUpdate) -> NotificationRule:
    from .processor import get_cached_global_rules
    import logging
    import re
    _logger = logging.getLogger(__name__)

    update_data = rule_in.model_dump(exclude_unset=True)
    
    # Sync message_text_template if only message_template is provided
    if "message_template" in update_data and "message_text_template" not in update_data:
        html_content = update_data["message_template"]
        # Basic HTML stripping to keep the Push content meaningful
        clean_text = re.sub(r'<[^>]+>', '', html_content)
        # Normalize whitespace
        clean_text = " ".join(clean_text.split())
        setattr(db_obj, "message_text_template", clean_text)
        _logger.info(f"Auto-synchronized message_text_template for {db_obj.notification_type}")

    for field, value in update_data.items():
        setattr(db_obj, field, value)

    db_obj.is_edited = True
    db.commit()
    db.refresh(db_obj)

    # Invalidar cache
    get_cached_global_rules.cache_clear()
    _logger.info(f"Rule cache cleared after editing rule {db_obj.notification_type}")

    return db_obj

from app.schemas.notification import PushSubscriptionSchema
from app.db.models.push_subscription import PushSubscription
from sqlalchemy.dialects.postgresql import insert

def create_or_update_subscription(
    db: Session, 
    sub_in: PushSubscriptionSchema, 
    user_id: Optional[int] = None,
    doctor_id: Optional[int] = None
) -> PushSubscription:
    """UPSERT atómico para suscripciones push. Soporta CycleUser y Doctor (Web y Nativo)."""
    import logging
    _logger = logging.getLogger(__name__)
    
    # Determine if it's native (token) or web (endpoint)
    is_native = bool(sub_in.token)
    conflict_index = 'token' if is_native else 'endpoint'
    unique_value = sub_in.token if is_native else sub_in.endpoint

    if not unique_value:
        raise ValueError("Either endpoint or token must be provided")

    values = {
        "endpoint": sub_in.endpoint,
        "token": sub_in.token,
        "p256dh": sub_in.keys.p256dh if sub_in.keys else None,
        "auth": sub_in.keys.auth if sub_in.keys else None,
        "updated_at": normalize_to_caracas(),
        "user_id": user_id,
        "doctor_id": doctor_id
    }
    from sqlalchemy import func
    
    _logger.info(f"[GynSysPush] UPSERT Values: {values}")
    print(f"[GynSysPush-DEBUG] UPSERT Values: {values}", flush=True)
    
    stmt = insert(PushSubscription).values(**values)
    stmt = stmt.on_conflict_do_update(
        index_elements=[conflict_index],
        set_={
            # Smart update: only overwrite if the NEW value is not null.
            # Otherwise, keep the existing value in the database.
            "user_id": func.coalesce(stmt.excluded.user_id, PushSubscription.user_id),
            "doctor_id": func.coalesce(stmt.excluded.doctor_id, PushSubscription.doctor_id),
            "p256dh": func.coalesce(stmt.excluded.p256dh, PushSubscription.p256dh),
            "auth": func.coalesce(stmt.excluded.auth, PushSubscription.auth),
            "updated_at": normalize_to_caracas()
        }
    )
    db.execute(stmt)
    db.commit()
    
    if is_native:
        return db.query(PushSubscription).filter_by(token=sub_in.token).first()
    return db.query(PushSubscription).filter_by(endpoint=sub_in.endpoint).first()

def delete_subscription_by_endpoint(db: Session, identifier: str) -> bool:
    """Borra suscripción por endpoint (Web) o token (Nativo)."""
    # Intentar borrar por endpoint primero, luego por token
    result = db.query(PushSubscription).filter(
        (PushSubscription.endpoint == identifier) | 
        (PushSubscription.token == identifier)
    ).delete()
    db.commit()
    return result > 0

from app.schemas.notification import NotificationTrackRequest
from app.db.models.notification import NotificationLog

def track_notification_event(db: Session, track_in: NotificationTrackRequest) -> Optional[NotificationLog]:
    """Registra eventos de recepción o clic de una notificación."""
    log = db.query(NotificationLog).filter(NotificationLog.id == track_in.notification_id).first()
    if not log:
        return None
    
    now = normalize_to_caracas()
    
    if track_in.event == "received":
        if not log.received_at:
            log.received_at = now
    elif track_in.event == "clicked":
        if not log.clicked_at:
            log.clicked_at = now
            
    if track_in.metadata:
        # Mezclar metadata existente con la nueva
        current_meta = log.event_metadata or {}
        current_meta.update(track_in.metadata)
        log.event_metadata = current_meta
        
    db.commit()
    db.refresh(log)
    return log


from app.db.models.notification import PendingNotification
from app.db.models.cycle_user import CycleUser
from app.db.models.doctor import Doctor
from sqlalchemy import or_

def get_audit_logs(
    db: Session, 
    skip: int = 0, 
    limit: int = 100, 
    search: Optional[str] = None, 
    status: Optional[str] = None
) -> List[NotificationLog]:
    """Obtiene el historial de notificaciones con filtros opcionales."""
    from sqlalchemy.orm import joinedload
    query = db.query(NotificationLog).options(
        joinedload(NotificationLog.recipient),
        joinedload(NotificationLog.doctor)
    )
    
    if status:
        query = query.filter(NotificationLog.status == status)
        
    if search:
        search_filter = f"%{search}%"
        # Buscar en titulo, o por email de destinatario (si el join es posible aquí o vía subquery)
        # Para simplificar y eficiencia, buscamos en el título primero.
        # Si queremos por email, necesitamos joins con CycleUser y Doctor.
        query = query.outerjoin(CycleUser, NotificationLog.recipient_id == CycleUser.id)\
                     .outerjoin(Doctor, NotificationLog.doctor_id == Doctor.id)\
                     .filter(or_(
                         NotificationLog.title_sent.ilike(search_filter),
                         NotificationLog.notification_type.ilike(search_filter),
                         CycleUser.email.ilike(search_filter),
                         Doctor.email.ilike(search_filter),
                         CycleUser.nombre_completo.ilike(search_filter),
                         Doctor.nombre_completo.ilike(search_filter)
                     ))
        
    return query.order_by(NotificationLog.sent_at.desc()).offset(skip).limit(limit).all()

def get_pending_queue(
    db: Session, 
    skip: int = 0, 
    limit: int = 100, 
    search: Optional[str] = None, 
    status: Optional[str] = None
) -> List[PendingNotification]:
    """Obtiene la cola de notificaciones pendientes con filtros opcionales."""
    from sqlalchemy.orm import joinedload
    query = db.query(PendingNotification).options(
        joinedload(PendingNotification.recipient),
        joinedload(PendingNotification.doctor)
    )
    
    if status:
        query = query.filter(PendingNotification.status == status)
        
    if search:
        search_filter = f"%{search}%"
        query = query.outerjoin(CycleUser, PendingNotification.recipient_id == CycleUser.id)\
                     .outerjoin(Doctor, PendingNotification.doctor_id == Doctor.id)\
                     .filter(or_(
                         PendingNotification.subject.ilike(search_filter),
                         CycleUser.email.ilike(search_filter),
                         Doctor.email.ilike(search_filter),
                         CycleUser.nombre_completo.ilike(search_filter),
                         Doctor.nombre_completo.ilike(search_filter)
                     ))
        
    return query.order_by(PendingNotification.scheduled_for.desc()).offset(skip).limit(limit).all()
