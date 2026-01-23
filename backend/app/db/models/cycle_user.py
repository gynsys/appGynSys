"""
CycleUser model for cycle predictor users.
These are end-users who register to use the cycle predictor tool.
Each user belongs to a specific doctor/tenant.
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class CycleUser(Base):
    __tablename__ = "cycle_users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    nombre_completo = Column(String, nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Password Recovery
    reset_password_token = Column(String, nullable=True)
    reset_password_expires = Column(DateTime(timezone=True), nullable=True)
    
    # Configuration fields
    cycle_avg_length = Column(Integer, default=28, nullable=False)
    period_avg_length = Column(Integer, default=5, nullable=False)

    # Relationships
    doctor = relationship("Doctor", back_populates="cycle_users")

    @property
    def theme_primary_color(self):
        """Return the doctor's theme primary color."""
        return self.doctor.theme_primary_color if self.doctor else None
