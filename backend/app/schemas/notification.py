from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from app.db.models.notification import NotificationType, NotificationChannel

# --- Notification Rules ---

class NotificationRuleBase(BaseModel):
    name: str = Field(..., example="Recordatorio de Periodo")
    notification_type: NotificationType
    trigger_condition: Dict[str, Any] = Field(..., example={"days_before_period": 2})
    channel: NotificationChannel = Field(default=NotificationChannel.EMAIL)
    message_template: str = Field(..., example="Hola {patient_name}, tu periodo llega en 2 días.")
    is_active: bool = True

class NotificationRuleCreate(NotificationRuleBase):
    pass

class NotificationRuleUpdate(BaseModel):
    name: Optional[str] = None
    notification_type: Optional[NotificationType] = None
    trigger_condition: Optional[Dict[str, Any]] = None
    channel: Optional[NotificationChannel] = None
    message_template: Optional[str] = None
    is_active: Optional[bool] = None

class NotificationRuleResponse(NotificationRuleBase):
    id: int
    tenant_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- Push Subscription ---

class PushKeys(BaseModel):
    p256dh: str
    auth: str

class PushSubscriptionSchema(BaseModel):
    endpoint: str
    keys: PushKeys
    expirationTime: Optional[float] = None

class VapidKeyResponse(BaseModel):
    public_key: str
