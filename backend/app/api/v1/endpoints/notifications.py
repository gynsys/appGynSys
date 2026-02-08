from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status, Body, Request
from sqlalchemy.orm import Session
from app.db.base import get_db
from app.api.v1.endpoints.auth import get_current_user
from app.api.v1.endpoints.cycle_users import get_current_cycle_user
from app.db.models.doctor import Doctor
from app.db.models.cycle_user import CycleUser
from app.schemas.notification import (
    NotificationRuleCreate, 
    NotificationRuleUpdate, 
    NotificationRuleResponse,
    PushSubscriptionSchema,
    VapidKeyResponse
)
from app.crud import crud_notification as crud
from app.core.config import settings

router = APIRouter()

# --- Dependencies ---

async def get_current_active_doctor(
    current_user: Doctor = Depends(get_current_user),
) -> Doctor:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

# --- Doctor Endpoints (Rule Management) ---

@router.get("/rules", response_model=List[NotificationRuleResponse])
def read_notification_rules(
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_active_doctor)
):
    """List all notification rules for the current doctor."""
    return crud.get_rules_by_tenant(db, current_doctor.id)

@router.post("/rules", response_model=NotificationRuleResponse)
def create_notification_rule(
    rule_in: NotificationRuleCreate,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_active_doctor)
):
    """Create a new notification rule."""
    return crud.create_rule(db, rule_in, current_doctor.id)

@router.put("/rules/{rule_id}", response_model=NotificationRuleResponse)
def update_notification_rule(
    rule_id: int,
    rule_in: NotificationRuleUpdate,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_active_doctor)
):
    """Update a notification rule."""
    rule = crud.get_rule_by_id(db, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    if rule.tenant_id != current_doctor.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return crud.update_rule(db, rule_id, rule_in)

@router.delete("/rules/{rule_id}")
def delete_notification_rule(
    rule_id: int,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_active_doctor)
):
    """Delete a notification rule."""
    rule = crud.get_rule_by_id(db, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    if rule.tenant_id != current_doctor.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    crud.delete_rule(db, rule_id)
    return {"message": "Rule deleted"}

# --- Patient Endpoints (Push Subscription) ---

@router.get("/vapid-public-key", response_model=VapidKeyResponse)
def get_vapid_public_key(
    current_user: CycleUser = Depends(get_current_cycle_user)
):
    """Get VAPID Public Key for Push Subscription."""
    # Assuming VAPID_PUBLIC_KEY is in settings, fallback to None or error if not set
    key = getattr(settings, "VAPID_PUBLIC_KEY", None)
    if not key:
        raise HTTPException(status_code=500, detail="VAPID keys not configured on server")
    return {"public_key": key}

@router.post("/subscribe")
def subscribe_push(
    subscription: PushSubscriptionSchema,
    request: Request,
    db: Session = Depends(get_db),
    current_user: CycleUser = Depends(get_current_cycle_user)
):
    """Subscribe current user to Push Notifications."""
    user_agent = request.headers.get("user-agent")
    print(f"DEBUG: Receiving subscription for user {current_user.id}: {subscription} (UA: {user_agent})")
    crud.create_or_update_subscription(db, subscription, current_user.id, user_agent)
    return {"message": "Subscribed successfully"}

@router.post("/unsubscribe")
def unsubscribe_push(
    endpoint: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: CycleUser = Depends(get_current_cycle_user)
):
    """Unsubscribe specific device from Push Notifications."""
    crud.delete_subscription_by_endpoint(db, endpoint)
    return {"message": "Unsubscribed successfully"}

# --- Admin/System Endpoints ---
# (None for now, mainly handled by Celery)
