from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional
from datetime import date, datetime

class CycleLogBase(BaseModel):
    start_date: date
    end_date: Optional[date] = None
    notes: Optional[str] = None

class CycleLogCreate(CycleLogBase):
    pass

class CycleLogUpdate(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    notes: Optional[str] = None

class CycleLog(CycleLogBase):
    id: int
    doctor_id: int
    cycle_length: Optional[int] = None
    
    model_config = ConfigDict(from_attributes=True)

class SymptomLogBase(BaseModel):
    date: date
    flow_intensity: Optional[str] = None
    pain_level: Optional[int] = None
    mood: Optional[str] = None
    symptoms: Optional[List[str]] = []
    notes: Optional[str] = None

class SymptomLogCreate(SymptomLogBase):
    pass

class SymptomLogUpdate(BaseModel):
    flow_intensity: Optional[str] = None
    pain_level: Optional[int] = None
    mood: Optional[str] = None
    symptoms: Optional[List[str]] = None
    notes: Optional[str] = None

class SymptomLog(SymptomLogBase):
    id: int
    doctor_id: int
    
    model_config = ConfigDict(from_attributes=True)

class PredictionResponse(BaseModel):
    next_period_start: date
    next_period_end: date
    ovulation_date: date
    fertile_window_start: date
    fertile_window_end: date
    pregnancy_probability: str # low, medium, high
    cycle_day: int
    phase: str # menstrual, follicular, ovulation, luteal

class CycleStats(BaseModel):
    total_cycles: int
    avg_cycle_length: int
    avg_period_length: int
    cycle_range_min: int
    cycle_range_max: int

class NotificationSettingsBase(BaseModel):
    contraceptive_enabled: bool = False
    contraceptive_time: Optional[str] = None # HH:MM - string for simplicity in transport
    contraceptive_frequency: str = "daily" # daily, active_pills_only
    rhythm_method_enabled: bool = False
    fertile_window_alerts: bool = False
    ovulation_alert: bool = False
    gyn_checkup_alert: bool = False
    # Phase 1 Enhancements
    rhythm_abstinence_alerts: bool = False
    period_confirmation_reminder: bool = True
    
    # Custom preferences
    custom_preferences: Optional[dict] = {}

class NotificationSettingsUpdate(NotificationSettingsBase):
    pass

class CustomRuleInfo(BaseModel):
    id: int
    name: str
    message_template: str

class NotificationSettings(NotificationSettingsBase):
    id: int
    cycle_user_id: int
    available_rules: List[CustomRuleInfo] = [] 
    
    model_config = ConfigDict(from_attributes=True)

class PregnancyLogBase(BaseModel):
    last_period_date: date
    due_date: Optional[date] = None
    is_active: bool = True
    notifications_enabled: bool = True

class PregnancyLogCreate(PregnancyLogBase):
    pass

class PregnancyLogUpdate(BaseModel):
    is_active: Optional[bool] = None
    due_date: Optional[date] = None
    notifications_enabled: Optional[bool] = None
    ended_at: Optional[datetime] = None

class PregnancyLog(PregnancyLogBase):
    id: int
    cycle_user_id: int
    created_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

