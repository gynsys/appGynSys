"""
Notification models for the Dynamic Notification System.
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base
import enum

class NotificationChannel(str, enum.Enum):
    EMAIL = "email"
    PUSH = "push"
    DUAL = "dual" # Tries Push first, then Email

class NotificationType(str, enum.Enum):
    CYCLE_PHASE = "cycle_phase" # e.g. "Follicular Phase Alert"
    SYMPTOM_ALERT = "symptom_alert" # e.g. "Headache Warning"
    PRENATAL_WEEKLY = "prenatal_weekly" # e.g. "Week 12 Update"
    PRENATAL_MILESTONE = "prenatal_milestone" # e.g. "First Trimester Complete"
    SYSTEM = "system" # System notifications
    CUSTOM = "custom" # One-off or generic


class NotificationRule(Base):
    __tablename__ = "notification_rules"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("doctors.id"), nullable=False, index=True)
    
    name = Column(String, nullable=False) # Internal name for the doctor
    notification_type = Column(String, nullable=False)  # Use String to match DB lowercase values
    
    # Logic Trigger: {"days_before_period": 2} or {"gestation_week": 12}
    trigger_condition = Column(JSON, nullable=False, default={})
    
    channel = Column(String, default="email")  # Use String to match DB lowercase values
    
    # HTML Template or Plain Text. variable placeholders: {patient_name}, {date}
    message_template = Column(Text, nullable=False)
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    doctor = relationship("Doctor", backref="notification_rules")


class NotificationLog(Base):
    __tablename__ = "notification_logs"

    id = Column(Integer, primary_key=True, index=True)
    notification_rule_id = Column(Integer, ForeignKey("notification_rules.id"), nullable=True) # element deleted? keep log
    recipient_id = Column(Integer, ForeignKey("cycle_users.id"), nullable=False, index=True)
    
    sent_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String, default="sent") # sent, failed, skipped
    channel_used = Column(String) # email, push
    error_message = Column(Text, nullable=True)

    # Relationships
    rule = relationship("NotificationRule")
    recipient = relationship("CycleUser")
