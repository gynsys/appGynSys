"""
PushSubscription model for PWA notifications.
Stores browser push subscription details for users.
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class PushSubscription(Base):
    __tablename__ = "push_subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("cycle_users.id"), index=True, nullable=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), index=True, nullable=True)
    
    endpoint = Column(String, nullable=False)
    p256dh = Column(String, nullable=False)
    auth = Column(String, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    user = relationship("CycleUser", backref="push_subscriptions")
    doctor = relationship("Doctor", backref="push_subscriptions")
