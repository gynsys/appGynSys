from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status, Body, Request
from sqlalchemy.orm import Session
from app.db.base import get_db
from app.api.v1.endpoints.auth import get_current_user
from app.api.v1.endpoints.cycle_users import get_current_cycle_user
from app.db.models.doctor import Doctor
from app.db.models.cycle_user import CycleUser
from app.schemas.notification import (
    NotificationRuleUpdate, 
    NotificationRuleResponse,
    PushSubscriptionSchema,
    VapidKeyResponse
)
from app.crud import crud_notification as crud
from app.core.config import settings

router = APIRouter()

# --- Dependencies ---

from app.api.v1.endpoints.auth import get_current_user, get_current_admin_user

# --- Global Rule Management (Admin Only) ---

@router.get("/rules", response_model=List[NotificationRuleResponse])
def read_notification_rules(
    db: Session = Depends(get_db),
    current_admin: Doctor = Depends(get_current_admin_user)
):
    """List all global notification rules (SuperAdmin only)."""
    return crud.get_global_rules(db)

@router.get("/rules/{notification_type}", response_model=NotificationRuleResponse)
def read_notification_rule_by_type(
    notification_type: str,
    db: Session = Depends(get_db),
    current_admin: Doctor = Depends(get_current_admin_user)
):
    """Get a specific global notification rule (SuperAdmin only)."""
    rule = crud.get_rule_by_type(db, None, notification_type)
    if not rule:
        raise HTTPException(status_code=404, detail="Global notification type not found")
    return rule

@router.put("/rules/{notification_type}", response_model=NotificationRuleResponse)
def update_notification_rule(
    notification_type: str,
    rule_in: NotificationRuleUpdate,
    db: Session = Depends(get_db),
    current_admin: Doctor = Depends(get_current_admin_user)
):
    """Update a global notification rule (SuperAdmin only)."""
    rule = crud.get_rule_by_type(db, None, notification_type)
    if not rule:
        raise HTTPException(status_code=404, detail="Global notification type not found")
    
    return crud.update_rule(db, rule, rule_in)

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
    db: Session = Depends(get_db),
    current_user: CycleUser = Depends(get_current_cycle_user)
):
    """Subscribe current user to Push Notifications."""
    print(f"DEBUG: Receiving subscription for user {current_user.id}: {subscription}")
    crud.create_or_update_subscription(db, subscription, current_user.id)
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
