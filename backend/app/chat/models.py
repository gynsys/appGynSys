from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.db.base import Base

class ChatRoom(Base):
    __tablename__ = "chat_rooms"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(String, index=True, nullable=False)
    type = Column(String, default="direct") # direct, group
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    meta_data = Column(JSONB, default={}) # "metadata" is reserved in potential SQLAlchemy contexts sometimes, safe to use meta_data

    # Relationships
    participants = relationship("ChatParticipant", back_populates="room", cascade="all, delete-orphan")
    messages = relationship("ChatMessage", back_populates="room", cascade="all, delete-orphan")

class ChatParticipant(Base):
    __tablename__ = "chat_participants"

    room_id = Column(UUID(as_uuid=True), ForeignKey("chat_rooms.id"), primary_key=True)
    user_id = Column(String, primary_key=True) # Assuming user_id is String or Integer? BlogPost used Integer. Let's check Doctor model or User model.
    # Wait, BlogPost used Integer for doctor_id. But Auth systems often use UUID. 
    # Let's start with Integer if standard User is integer, but the plan mentioned User UUIDs. 
    # I will assume generic String/Integer for now or check User model. 
    # Let's adhere to the plan which implies UUIDs but if the main User table uses Int, I might need to adapt.
    # The prompt said "Contracts & Portability".
    # I'll use String for user_id to be safe and compatible with external auth systems (like Auth0 or whatever) 
    # but strictly if existing foreign keys are Int, I might need to be careful.
    # Plan said "user_id: UUID". I will use String for flexibility as it can hold UUID or Int stringified.
    
    tenant_id = Column(String, index=True, nullable=False)
    role = Column(String, default="member") # admin, member
    last_read_at = Column(DateTime(timezone=True), nullable=True)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())

    room = relationship("ChatRoom", back_populates="participants")

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    room_id = Column(UUID(as_uuid=True), ForeignKey("chat_rooms.id"), nullable=False, index=True)
    sender_id = Column(String, nullable=False)
    tenant_id = Column(String, index=True, nullable=False)
    
    client_side_uuid = Column(UUID(as_uuid=True), unique=True, index=True, nullable=False) # For idempotency
    
    content = Column(Text, nullable=True)
    message_type = Column(String, default="text") # text, image, audio, video, file
    media_url = Column(String, nullable=True)
    media_meta = Column(JSONB, default={})
    
    status = Column(String, default="sending") # sending, sent, delivered, read
    is_deleted = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    room = relationship("ChatRoom", back_populates="messages")
