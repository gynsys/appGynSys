from pydantic import BaseModel, UUID4, Field
from typing import List, Optional, Any, Dict
from datetime import datetime
from enum import Enum

class ChatRoomType(str, Enum):
    DIRECT = "direct"
    GROUP = "group"

class MessageType(str, Enum):
    TEXT = "text"
    IMAGE = "image"
    AUDIO = "audio"
    VIDEO = "video"
    FILE = "file"

class MessageStatus(str, Enum):
    SENDING = "sending"
    SENT = "sent"
    DELIVERED = "delivered"
    READ = "read"

# --- Participant Schemas ---
class ChatParticipantBase(BaseModel):
    user_id: str
    role: str = "member"

class ChatParticipantCreate(ChatParticipantBase):
    pass

class ChatParticipant(ChatParticipantBase):
    room_id: UUID4
    joined_at: datetime
    last_read_at: Optional[datetime] = None

    class Config:
        orm_mode = True

# --- Message Schemas ---
class ChatMessageBase(BaseModel):
    content: Optional[str] = None
    message_type: MessageType = MessageType.TEXT
    media_url: Optional[str] = None
    media_meta: Optional[Dict[str, Any]] = None

class ChatMessageCreate(ChatMessageBase):
    room_id: UUID4
    client_side_uuid: UUID4
    sender_id: Optional[str] = None

class ChatMessage(ChatMessageBase):
    id: UUID4
    room_id: UUID4
    sender_id: str
    tenant_id: str
    client_side_uuid: UUID4
    status: MessageStatus
    created_at: datetime
    is_deleted: bool

    class Config:
        orm_mode = True

# --- Room Schemas ---
class ChatRoomBase(BaseModel):
    type: ChatRoomType = ChatRoomType.DIRECT
    meta_data: Optional[Dict[str, Any]] = {}

class ChatRoomCreate(ChatRoomBase):
    participants: List[ChatParticipantCreate]

class ChatRoom(ChatRoomBase):
    id: UUID4
    tenant_id: str
    created_at: datetime
    updated_at: Optional[datetime]
    participants: List[ChatParticipant] = []
    last_message: Optional[ChatMessage] = None # Computed field potentially

    class Config:
        orm_mode = True
