"""
Pydantic schemas for simplified notification system.
"""
from datetime import datetime
from typing import Optional, Dict, Any, List

from pydantic import BaseModel, Field, validator


# Lista de tipos válidos para validación
VALID_TYPES = [
    "contraceptive_daily", "contraceptive_rest_start", "contraceptive_rest_end", "contraceptive_missed",
    "period_prediction", "period_start", "period_confirmation_0", "period_confirmation_1", "period_confirmation_2", "period_irregular",
    "fertile_window_start", "fertility_peak", "ovulation_day", "fertile_window_end",
    "prenatal_weekly", "prenatal_milestone", "prenatal_daily_tip", "prenatal_alert",
    "annual_checkup"
]


# ==================== READ ONLY (Response) ====================

class NotificationRuleBase(BaseModel):
    notification_type: str
    title_template: str
    message_template: str
    message_text_template: Optional[str] = None
    channel: str = "dual"
    send_time: str = "08:00"
    is_active: bool = True
    is_edited: bool = False


class NotificationRuleResponse(NotificationRuleBase):
    id: int
    tenant_id: int
    priority: int
    trigger_condition: Dict[str, Any]  # Read-only
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class NotificationRuleListResponse(BaseModel):
    """Simplified list view."""
    notification_type: str
    title_template: str
    is_active: bool
    is_edited: bool
    channel: str
    
    class Config:
        from_attributes = True


# ==================== EDITABLE (Request) ====================

class NotificationRuleUpdate(BaseModel):
    """
    ONLY these fields can be edited.
    Creating new types or changing triggers is NOT allowed.
    """
    title_template: Optional[str] = Field(None, max_length=255)
    message_template: Optional[str] = None
    message_text_template: Optional[str] = None
    channel: Optional[str] = Field(None, pattern="^(email|push|dual)$")
    send_time: Optional[str] = Field(None, pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$")
    is_active: Optional[bool] = None
    
    @validator('channel')
    def validate_channel(cls, v):
        if v and v not in ["email", "push", "dual"]:
            raise ValueError('Channel must be email, push, or dual')
        return v


# ==================== NO LONGER SUPPORTED ====================
# class NotificationRuleCreate(BaseModel):  # ELIMINADO
#     """Creation of new notification types is NOT allowed."""
#     pass


# ==================== UTILITY ====================

class NotificationRestoreDefault(BaseModel):
    """Request to restore default content."""
    confirm: bool = True  # Safety check


class NotificationLogResponse(BaseModel):
    id: int
    notification_type: str
    title_sent: str
    channel_used: str
    status: str
    sent_at: datetime
    
    class Config:
        from_attributes = True


class NotificationTestRequest(BaseModel):
    notification_type: str  # Must be one of VALID_TYPES
    
    @validator('notification_type')
    def validate_type(cls, v):
        if v not in VALID_TYPES:
            raise ValueError(f'Invalid notification type. Must be one of: {", ".join(VALID_TYPES)}')
        return v


class NotificationTestResponse(BaseModel):
    status: str
    message: str
    notification_type: str
    preview: Dict[str, str]  # Rendered title and message


class PushKeys(BaseModel):
    p256dh: str
    auth: str


class PushSubscriptionSchema(BaseModel):
    endpoint: str
    keys: PushKeys


class VapidKeyResponse(BaseModel):
    public_key: str
