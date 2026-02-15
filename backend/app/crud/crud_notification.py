from sqlalchemy.orm import Session
from app.db.models.notification import NotificationRule
from app.schemas.notification import NotificationRuleUpdate
from typing import List, Optional

def get_rules_by_tenant(db: Session, tenant_id: int) -> List[NotificationRule]:
    return db.query(NotificationRule).filter(NotificationRule.tenant_id == tenant_id).order_by(NotificationRule.priority).all()

def get_rule_by_id(db: Session, rule_id: int) -> Optional[NotificationRule]:
    return db.query(NotificationRule).filter(NotificationRule.id == rule_id).first()

def get_rule_by_type(db: Session, tenant_id: int, notification_type: str) -> Optional[NotificationRule]:
    return db.query(NotificationRule).filter(
        NotificationRule.tenant_id == tenant_id,
        NotificationRule.notification_type == notification_type
    ).first()

def update_rule(db: Session, db_obj: NotificationRule, rule_in: NotificationRuleUpdate) -> NotificationRule:
    update_data = rule_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_obj, field, value)
    
    db_obj.is_edited = True
    db.commit()
    db.refresh(db_obj)
    return db_obj

# --- Push Subscriptions ---

from app.db.models.push_subscription import PushSubscription
from app.schemas.notification import PushSubscriptionSchema

def create_or_update_subscription(db: Session, sub_in: PushSubscriptionSchema, user_id: int) -> PushSubscription:
    # Check if endpoint already exists
    db_obj = db.query(PushSubscription).filter(PushSubscription.endpoint == sub_in.endpoint).first()
    
    if db_obj:
        # Update existing
        db_obj.user_id = user_id
        db_obj.p256dh = sub_in.keys.p256dh
        db_obj.auth = sub_in.keys.auth
    else:
        # Create new
        db_obj = PushSubscription(
            user_id=user_id,
            endpoint=sub_in.endpoint,
            p256dh=sub_in.keys.p256dh,
            auth=sub_in.keys.auth
        )
        db.add(db_obj)
    
    db.commit()
    db.refresh(db_obj)
    return db_obj

def delete_subscription_by_endpoint(db: Session, endpoint: str) -> bool:
    db.query(PushSubscription).filter(PushSubscription.endpoint == endpoint).delete()
    db.commit()
    return True
