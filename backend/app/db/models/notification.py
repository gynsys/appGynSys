"""
Notification models - Simplified: 19 fixed types, editable content only.
"""
from datetime import datetime
from typing import Optional, Dict, Any, List

from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, 
    ForeignKey, Text, JSON, Index
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.db.base import Base


class NotificationChannel(str, enum.Enum):
    EMAIL = "email"
    PUSH = "push"
    DUAL = "dual"


# Los tipos de notificación permitidos (Aprox 101)
VALID_NOTIFICATION_TYPES = {
    # Ciclo Menstrual Diario (28)
    "day_1_period_start", "day_2_symptom_check", "day_3_hygiene_tip", "day_4_energy_alert",
    "day_5_period_end_soon", "day_6_energy_boost", "day_7_period_end", "day_8_follicular_phase",
    "day_9_skin_care", "day_10_nutrition_tip", "day_11_ovulation_near", "day_12_fertile_window",
    "day_13_high_fertility", "day_14_ovulation_day", "day_15_luteal_phase", "day_16_progesterone_check",
    "day_17_mood_watch", "day_18_exercise_tip", "day_19_metabolism_alert", "day_20_rest_importance",
    "day_21_cycle_summary", "day_22_pms_start", "day_23_bloating_check", "day_24_mood_changes",
    "day_25_breast_tenderness", "day_26_period_preparation", "day_27_cramps_alert", "day_28_period_tomorrow",
    "period_late_1_day",
    
    # Seguimiento Prenatal Semanal (41)
    *[f"prenatal_week_{i}" for i in range(1, 42)],
    
    # Hitos y Alertas Prenatales
    "prenatal_first_ultrasound", "prenatal_genetic_test", "prenatal_anatomy_scan", "prenatal_glucose_test",
    "prenatal_tdap_vaccine", "prenatal_group_b_strep", "prenatal_kick_counts", "prenatal_reduced_movement",
    "prenatal_bleeding", "prenatal_severe_headache", "prenatal_vision_changes", "prenatal_contractions",
    "prenatal_water_break", "prenatal_swelling",
    
    # Tips Prenatales
    "prenatal_daily_tip", "prenatal_nutrition", "prenatal_exercise", "prenatal_hydration",
    "prenatal_mental_health", "prenatal_sleep", "prenatal_baby_size",
    
    # Eventos de Sistema
    "system_welcome", "system_profile_incomplete", "system_log_period", "system_backup_reminder",
    "system_update_available", "system_data_sync", "system_appointment_reminder", "system_medication_reminder",
    "system_annual_checkup", "system_pap_smear", "system_mammogram", "system_privacy_update",
    "system_inactive_user", "symptom_alert",
    
    # Contraceptivos
    "contraceptive_daily", "contraceptive_rest_start", "contraceptive_rest_end", "contraceptive_missed",
    
    # Tipos genéricos (compatibilidad)
    "period_prediction", "period_start", "period_confirmation_0", "period_confirmation_1", 
    "period_confirmation_2", "period_irregular", "fertile_window_start", "fertility_peak",
    "ovulation_day", "fertile_window_end", "annual_checkup"
}


class NotificationRule(Base):
    """
    Notification rule - FIXED type, EDITABLE content only.
    Cannot create new types, only modify existing 19.
    """
    __tablename__ = "notification_rules"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("doctors.id"), nullable=False, index=True)
    
    # IDENTIFICADOR FIJO - Inmutable after creation
    notification_type = Column(String(50), nullable=False, index=True)
    # Must be one of VALID_NOTIFICATION_TYPES
    
    # LÓGICA DE DISPARO - Fija, no editable
    trigger_condition = Column(JSON, nullable=False, default={})
    priority = Column(Integer, default=50)  # Fijo por tipo
    
    # CONTENIDO EDITABLE
    title_template = Column(String(255), nullable=False)
    message_template = Column(Text, nullable=False)
    message_text_template = Column(Text, nullable=True)
    
    # CONFIGURACIÓN EDITABLE
    channel = Column(String(20), default="dual")
    send_time = Column(String(10), default="08:00")  # HH:MM format
    
    # ESTADO
    is_active = Column(Boolean, default=True)
    is_edited = Column(Boolean, default=False)  # Track if modified from default
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    doctor = relationship("Doctor", backref="notification_rules")
    
    # Indexes
    __table_args__ = (
        Index('idx_rule_tenant_type', 'tenant_id', 'notification_type', unique=True),
    )
    
    def validate_type(self) -> bool:
        """Check if notification_type is valid."""
        return self.notification_type in VALID_NOTIFICATION_TYPES
    
    def render_content(self, context: dict) -> dict:
        """Render templates with context variables."""
        try:
            return {
                "title": self.title_template.format(**context),
                "message_html": self.message_template.format(**context),
                "message_text": self.message_text_template.format(**context) if self.message_text_template else None
            }
        except KeyError as e:
            # Fallback if variable missing
            return {
                "title": self.title_template,
                "message_html": self.message_template,
                "message_text": self.message_text_template,
                "render_error": f"Missing variable: {e}"
            }
    
    def reset_to_default(self, defaults: dict):
        """Restore default content."""
        self.title_template = defaults.get("title_template", "")
        self.message_template = defaults.get("message_template", "")
        self.message_text_template = defaults.get("message_text_template")
        self.channel = defaults.get("channel", "dual")
        self.send_time = defaults.get("send_time", "08:00")
        self.is_edited = False


class NotificationLog(Base):
    """History of sent notifications."""
    __tablename__ = "notification_logs"

    id = Column(Integer, primary_key=True, index=True)
    notification_rule_id = Column(Integer, ForeignKey("notification_rules.id"), nullable=True)
    recipient_id = Column(Integer, ForeignKey("cycle_users.id"), nullable=False, index=True)
    
    # What was sent
    notification_type = Column(String(50), nullable=False)
    title_sent = Column(String(255), nullable=False)
    channel_used = Column(String(20), nullable=False)
    
    # Result
    sent_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String(20), default="sent")  # sent, failed, skipped
    error_message = Column(Text, nullable=True)
    
    # Context snapshot for debugging
    context_snapshot = Column(JSON, default=dict)

    # Relationships
    rule = relationship("NotificationRule")
    recipient = relationship("CycleUser", backref="notification_logs")


class PendingNotification(Base):
    """Queue for notifications to be sent at a specific time."""
    __tablename__ = "pending_notifications"

    id = Column(Integer, primary_key=True, index=True)
    notification_rule_id = Column(Integer, ForeignKey("notification_rules.id"), nullable=True)
    recipient_id = Column(Integer, ForeignKey("cycle_users.id"), nullable=False, index=True)
    
    # Content to send
    subject = Column(String(255), nullable=False)
    body = Column(Text, nullable=False) # HTML content
    message_text = Column(Text, nullable=True) # Plain text for Push
    
    # Scheduling
    scheduled_for = Column(DateTime(timezone=True), nullable=False, index=True)
    channel = Column(String(20), default="dual") # push, email, dual
    
    # Status
    status = Column(String(20), default="pending") # pending, sent, failed, retrying
    retry_count = Column(Integer, default=0)
    last_error = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    rule = relationship("NotificationRule")
    recipient = relationship("CycleUser")
