# Detalles Técnicos de Implementación

## 1. Modelo de Base de Datos (backend/app/db/models/scheduled_appointment.py)

```python
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.sql import func
from app.db.base import Base

class ScheduledAppointment(Base):
    __tablename__ = "scheduled_appointments"

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    
    # Datos del Paciente (Snapshot para fácil acceso)
    patient_ci = Column(String, index=True, nullable=False)
    patient_name = Column(String, nullable=False)
    patient_email = Column(String, nullable=True)
    patient_phone = Column(String, nullable=True)
    
    # Trazabilidad
    original_appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=True)
    original_consultation_id = Column(Integer, ForeignKey("consultations.id"), nullable=True)
    
    # Programación
    scheduled_date = Column(DateTime(timezone=True), nullable=False)
    interval_type = Column(String, nullable=True) # '1_mes', '3_meses', etc.
    notes = Column(Text, nullable=True)
    
    # Estado
    status = Column(String, default='pending') # pending, notified, completed, cancelled
    reminder_sent = Column(Boolean, default=False)
    reminder_sent_at = Column(DateTime(timezone=True), nullable=True)
    
    # Auditoría
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
```

## 2. Esquemas Pydantic (backend/app/schemas/scheduled_appointment.py)

```python
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class ScheduledAppointmentBase(BaseModel):
    patient_ci: str
    patient_name: str
    patient_email: Optional[EmailStr] = None
    patient_phone: Optional[str] = None
    scheduled_date: datetime
    interval_type: Optional[str] = None
    notes: Optional[str] = None

class ScheduledAppointmentCreate(ScheduledAppointmentBase):
    doctor_id: int
    original_appointment_id: Optional[int] = None
    original_consultation_id: Optional[int] = None

class ScheduledAppointmentUpdate(BaseModel):
    status: Optional[str] = None
    scheduled_date: Optional[datetime] = None
    notes: Optional[str] = None
    reminder_sent: Optional[bool] = None

class ScheduledAppointment(ScheduledAppointmentBase):
    id: int
    doctor_id: int
    status: str
    reminder_sent: bool
    created_at: datetime
    
    class Config:
        orm_mode = True
```

## 3. Lógica de Recordatorios (backend/app/tasks/scheduled_appointment_reminders.py)

```python
@celery_app.task
def check_upcoming_appointments():
    db = SessionLocal()
    try:
        # Lógica para filtrar citas a 3 días de distancia
        # Envío de notificaciones usando sender.py del sistema
    finally:
        db.close()
```
