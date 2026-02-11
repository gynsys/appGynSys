from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Date, JSON, Boolean
from sqlalchemy.orm import relationship
from app.db.base import Base

class CycleLog(Base):
    __tablename__ = "cycle_logs"

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=True, index=True) 
    cycle_user_id = Column(Integer, ForeignKey("cycle_users.id"), nullable=True, index=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    cycle_length = Column(Integer, nullable=True)
    notes = Column(String, nullable=True)

    doctor = relationship("Doctor", backref="cycle_logs")
    cycle_user = relationship("CycleUser", backref="cycle_logs")

class SymptomLog(Base):
    __tablename__ = "symptom_logs"

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=True, index=True)
    cycle_user_id = Column(Integer, ForeignKey("cycle_users.id"), nullable=True, index=True)
    date = Column(Date, nullable=False)
    flow_intensity = Column(String, nullable=True) # light, medium, heavy
    pain_level = Column(Integer, nullable=True) # 0-10
    mood = Column(String, nullable=True) # happy, sad, anxious, irritable, calm
    symptoms = Column(JSON, nullable=True) # List of strings
    notes = Column(String, nullable=True)

    doctor = relationship("Doctor", backref="symptom_logs")
    cycle_user = relationship("CycleUser", backref="symptom_logs")

class CycleNotificationSettings(Base):
    __tablename__ = "cycle_notification_settings"

    id = Column(Integer, primary_key=True, index=True)
    cycle_user_id = Column(Integer, ForeignKey("cycle_users.id"), unique=True, index=True)
    
    # Contraceptive
    contraceptive_enabled = Column(Boolean, default=False) 
    contraceptive_time = Column(String, nullable=True) 
    contraceptive_frequency = Column(String, default="daily") 
    last_contraceptive_sent_date = Column(Date, nullable=True)  # Track last send to prevent duplicates
    
    # Other Alerts (Legacy/Detailed - can be mapped or kept)
    rhythm_method_enabled = Column(Boolean, default=False)
    fertile_window_alerts = Column(Boolean, default=False)
    ovulation_alert = Column(Boolean, default=False)
    gyn_checkup_alert = Column(Boolean, default=False)
    
    # Phase 1 Enhancements
    rhythm_abstinence_alerts = Column(Boolean, default=False)  # Alerts 5 days before/after period
    period_confirmation_reminder = Column(Boolean, default=True)  # Remind to register period
    last_period_reminder_sent = Column(Date, nullable=True)  # Track reminders to avoid duplicates

    # Encapsulated Preferences (Usability 2.0 - Master Switches)
    # Prenatal
    prenatal_ultrasounds = Column(Boolean, default=True)
    prenatal_lab_results = Column(Boolean, default=True)
    prenatal_milestones = Column(Boolean, default=True)
    prenatal_daily_tips = Column(Boolean, default=True)
    prenatal_symptom_alerts = Column(Boolean, default=True)
    
    # Cycle
    cycle_period_predictions = Column(Boolean, default=True)
    cycle_fertile_window = Column(Boolean, default=True) # Unified fertile + ovulation
    cycle_pms_symptoms = Column(Boolean, default=True)
    
    # Custom Rules Preferences (Map of rule_id -> boolean)
    custom_preferences = Column(JSON, default={}, nullable=True)

    cycle_user = relationship("CycleUser", backref="notification_settings")

class PregnancyLog(Base):
    __tablename__ = "pregnancy_logs"

    id = Column(Integer, primary_key=True, index=True)
    cycle_user_id = Column(Integer, ForeignKey("cycle_users.id"), index=True)
    
    is_active = Column(Boolean, default=True)
    last_period_date = Column(Date, nullable=False)
    due_date = Column(Date, nullable=True)
    notifications_enabled = Column(Boolean, default=True)
    
    created_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)

    cycle_user = relationship("CycleUser", backref="pregnancy_logs")

