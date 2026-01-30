from sqlalchemy.orm import Session
from app.db.models.notification import NotificationRule
from app.schemas.notification import NotificationRuleCreate, NotificationRuleUpdate
from typing import List, Optional

def get_rules_by_tenant(db: Session, tenant_id: int) -> List[NotificationRule]:
    return db.query(NotificationRule).filter(NotificationRule.tenant_id == tenant_id).all()

def get_rule_by_id(db: Session, rule_id: int) -> Optional[NotificationRule]:
    return db.query(NotificationRule).filter(NotificationRule.id == rule_id).first()

def create_rule(db: Session, rule: NotificationRuleCreate, tenant_id: int) -> NotificationRule:
    db_obj = NotificationRule(
        **rule.model_dump(),
        tenant_id=tenant_id
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update_rule(db: Session, rule_id: int, rule_in: NotificationRuleUpdate) -> Optional[NotificationRule]:
    db_obj = get_rule_by_id(db, rule_id)
    if not db_obj:
        return None
    
    update_data = rule_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_obj, field, value)
        
    db.commit()
    db.refresh(db_obj)
    return db_obj

def delete_rule(db: Session, rule_id: int) -> bool:
    db_obj = get_rule_by_id(db, rule_id)
    if not db_obj:
        return False
    db.delete(db_obj)
    db.commit()
    return True
