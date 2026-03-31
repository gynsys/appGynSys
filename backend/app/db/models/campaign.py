"""
Diffusion Campaign model - for bulk notifications (Email + Push).
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class DiffusionCampaign(Base):
    """
    Represents a bulk notification campaign sent by a doctor.
    """
    __tablename__ = "diffusion_campaign"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("doctors.id"), nullable=False, index=True)
    
    # Internal & Public Info
    title = Column(String(255), nullable=False) # Internal name
    subject = Column(String(255), nullable=False) # Email subject or Push title
    
    # Content
    content_html = Column(Text, nullable=False)
    content_text = Column(Text, nullable=True) # Fallback for Push
    
    # Classification
    source_type = Column(String(50), default="custom") # custom, blog, recommendation
    source_id = Column(Integer, nullable=True)
    
    # Targeting
    target_type = Column(String(50), default="all") # all, app_users, patients
    
    # Status & Stats
    status = Column(String(20), default="draft") # draft, sending, sent, failed
    stats = Column(JSON, default={"sent_count": 0, "push_count": 0, "email_count": 0})
    
    # Timestamps
    sent_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    doctor = relationship("Doctor", backref="diffusion_campaigns")

    def __repr__(self):
        return f"<DiffusionCampaign(id={self.id}, title='{self.title}', status='{self.status}')>"
