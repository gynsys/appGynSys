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
    recover_stale_processing_notifications,
)
from .health import (
    get_notification_system_health,
)

# CRUD (Viviendo en submódulos si es necesario, o re-implementados aquí para simplicidad)
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
    _logger = logging.getLogger(__name__)

    update_data = rule_in.model_dump(exclude_unset=True)
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

def create_or_update_subscription(db: Session, sub_in: PushSubscriptionSchema, user_id: int) -> PushSubscription:
    """UPSERT atómico para suscripciones push."""
    stmt = insert(PushSubscription).values(
        user_id=user_id,
        endpoint=sub_in.endpoint,
        p256dh=sub_in.keys.p256dh,
        auth=sub_in.keys.auth,
        updated_at=normalize_to_caracas()
    ).on_conflict_do_update(
        index_elements=['endpoint'],
        set_=dict(
            user_id=user_id, 
            p256dh=sub_in.keys.p256dh, 
            auth=sub_in.keys.auth,
            updated_at=normalize_to_caracas()
        )
    )
    db.execute(stmt)
    db.commit()
    return db.query(PushSubscription).filter_by(endpoint=sub_in.endpoint).first()

def delete_subscription_by_endpoint(db: Session, endpoint: str) -> bool:
    result = db.query(PushSubscription).filter(PushSubscription.endpoint == endpoint).delete()
    db.commit()
    return result > 0
