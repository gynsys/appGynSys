from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Union
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.base import get_db
from app.api.v1.endpoints.auth import get_current_user, GuestUser
from app.db.models.doctor import Doctor
from pydantic import BaseModel
from . import schemas, models

router = APIRouter()

def get_chat_db(
    db: Session = Depends(get_db),
    current_user: Union[Doctor, GuestUser] = Depends(get_current_user)
):
    """
    Dependency that configures the DB session with RLS for the current tenant.
    Supports both Doctor (Owner) and Guest (Patient).
    """
    if hasattr(current_user, "tenant_id"):
        # Guest User: Tenant is the doctor they are visiting
        tenant_id = current_user.tenant_id
    else:
        # Doctor User: Tenant is themselves
        tenant_id = str(current_user.id)
        
    # Execute RLS setting
    db.execute(text(f"SET app.current_tenant = '{tenant_id}'"))
    return db

# ...

@router.post("/rooms", response_model=schemas.ChatRoom)
def create_room(
    room_in: schemas.ChatRoomCreate,
    db: Session = Depends(get_chat_db),
    current_user: Union[Doctor, GuestUser] = Depends(get_current_user)
):
    """
    Create a new chat room.
    """
    if hasattr(current_user, "tenant_id"):
        tenant_id = current_user.tenant_id
    else:
        tenant_id = str(current_user.id)

    # 1. Create Room
    db_room = models.ChatRoom(
        type=room_in.type,
        meta_data=room_in.meta_data,
        tenant_id=tenant_id
    )
    db.add(db_room)
    db.commit()
    db.refresh(db_room)
    
    # 2. Add Participants
    # Auto-add creator (current user) if not in list
    participant_ids = [p.user_id for p in room_in.participants]
    
    # Check if creator is already in participants list (by ID)
    # Note: Guest ID is in current_user.id
    if str(current_user.id) not in participant_ids:
        # Create a participant entry for the creator
        creator_participant = models.ChatParticipant(
            room_id=db_room.id,
            user_id=str(current_user.id),
            tenant_id=tenant_id,
            role="member" if hasattr(current_user, "tenant_id") else "owner"
        )
        db.add(creator_participant)
        
    for p in room_in.participants:
        db_participant = models.ChatParticipant(
            room_id=db_room.id,
            user_id=p.user_id,
            tenant_id=tenant_id,
            role=p.role
        )
        db.add(db_participant)
        
    db.commit()
    db.refresh(db_room)
    return db_room

@router.get("/rooms", response_model=List[schemas.ChatRoom])
def get_rooms(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_chat_db),
    current_user: Union[Doctor, GuestUser] = Depends(get_current_user)
):
    """
    Get all rooms for the current tenant.
    Guests only see rooms they participate in.
    """
    if hasattr(current_user, "role") and current_user.role == "guest":
        # Guest: Filter by participation
        rooms = db.query(models.ChatRoom)\
            .join(models.ChatParticipant)\
            .filter(
                models.ChatParticipant.user_id == current_user.id,
                models.ChatRoom.is_deleted != True  # Exclude deleted rooms
            )\
            .offset(skip).limit(limit).all()
        return rooms
    else:
        # Doctor: See all rooms in tenant (RLS handled)
        rooms = db.query(models.ChatRoom)\
            .filter(models.ChatRoom.is_deleted != True)\
            .offset(skip).limit(limit).all()
        return rooms

@router.get("/rooms/{room_id}", response_model=schemas.ChatRoom)
def get_room(
    room_id: str,
    db: Session = Depends(get_chat_db)
):
    """
    Get a specific room details.
    """
    room = db.query(models.ChatRoom).filter(models.ChatRoom.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room

@router.delete("/rooms/{room_id}", status_code=204)
async def delete_room(
    room_id: str,
    current_user: Union[Doctor, GuestUser] = Depends(get_current_user),
    db: Session = Depends(get_chat_db)
):
    """
    Delete a chat room (soft delete).
    Only the room owner (doctor/tenant) or admin can delete.
    """
    # 1. Get the room
    room = db.query(models.ChatRoom).filter(models.ChatRoom.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    # 2. Check permission: Only doctor (tenant owner) can delete
    # Guests cannot delete rooms
    if hasattr(current_user, 'role') and current_user.role == 'guest':
        raise HTTPException(status_code=403, detail="Guests cannot delete conversations")
    
    # For doctors, verify it's their tenant's room
    if hasattr(current_user, 'id'):
        tenant_id = str(current_user.id)
        if room.tenant_id != tenant_id:
            raise HTTPException(status_code=403, detail="You can only delete your own conversations")
    
    # 3. Soft delete: mark as deleted instead of physical delete
    room.is_deleted = True
    room.deleted_at = datetime.now()
    db.add(room)
    db.commit()
    
    # 4. Emit WebSocket event to notify other participants
    try:
        from app.chat.websockets import sio
        await sio.emit("room_deleted", {"room_id": str(room_id)}, room=room_id)
    except Exception as e:
        # Non-critical, just log
        print(f"Failed to emit room_deleted event: {e}")
    
    return

# --- Messages Endpoints ---

@router.post("/rooms/{room_id}/messages", response_model=schemas.ChatMessage)
async def send_message(
    room_id: str,
    message_in: schemas.ChatMessageCreate,
    db: Session = Depends(get_chat_db),
    current_user: Union[Doctor, GuestUser] = Depends(get_current_user)
):
    """
    Send a message to a room.
    Idempotent: Checks client_side_uuid.
    """
    # ... (Determination of tenant_id logic is same, but better to put in a function or repeat)
    if hasattr(current_user, "tenant_id"):
        tenant_id = current_user.tenant_id
    else:
        tenant_id = str(current_user.id)

    # 1. Check Idempotency
    existing_message = db.query(models.ChatMessage).filter(
        models.ChatMessage.client_side_uuid == message_in.client_side_uuid
    ).first()
    
    if existing_message:
        return existing_message
    
    # 2. Verify Room Exists
    room = db.query(models.ChatRoom).filter(models.ChatRoom.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
        
    # 3. Create Message
    db_message = models.ChatMessage(
        room_id=room_id,
        sender_id=str(current_user.id),
        tenant_id=tenant_id,
        client_side_uuid=message_in.client_side_uuid,
        content=message_in.content,
        message_type=message_in.message_type,
        media_url=message_in.media_url,
        media_meta=message_in.media_meta,
        status="sent"
    )
    
    db.add(db_message)
    
    # 4. Update Room
    from datetime import datetime
    room.updated_at = datetime.now()
    db.add(room)
    
    db.commit()
    db.refresh(db_message)
    
    # 5. Emit Real-time Event
    try:
        from app.chat.websockets import sio
        
        # Prepare payload
        payload = {
            "id": str(db_message.id),
            "client_side_uuid": str(db_message.client_side_uuid),
            "room_id": str(room_id),
            "sender_id": str(db_message.sender_id),
            "content": db_message.content,
            "created_at": db_message.created_at.isoformat(),
            "status": "sent"
        }
        
        # Emit to the specific room channel
        # Clients must have joined this room via `join_room` event
        await sio.emit("message", payload, room=room_id)
        
    except Exception as e:
        print(f"Socket emit failed: {e}")
        
    return db_message

@router.get("/rooms/{room_id}/messages", response_model=List[schemas.ChatMessage])
def get_messages(
    room_id: str,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_chat_db)
):
    """
    Get messages for a room.
    """
    messages = db.query(models.ChatMessage)\
        .filter(models.ChatMessage.room_id == room_id)\
        .order_by(models.ChatMessage.created_at.desc())\
        .offset(skip)\
        .limit(limit)\
        .all()
    # Reverse to return chronological order if needed, but API usually sends desc for pagination
    return messages

# --- Media Endpoints ---

class PresignedUrlRequest(BaseModel):
    filename: str
    content_type: str

@router.post("/media/presigned-url")
def get_presigned_url(
    data: dict, # { "filename": str, "contentType": str }
    current_user: Union[Doctor, GuestUser] = Depends(get_current_user)
):
    """
    Generate a presigned URL for uploading media directly to S3/MinIO.
    """
    from app.core.s3 import create_presigned_upload
    import uuid
    import os
    
    filename = data.get("filename")
    content_type = data.get("contentType")
    
    if not filename or not content_type:
        raise HTTPException(status_code=400, detail="Filename and contentType required")
        
    # Generate a unique path: {tenant_id}/{uuid}.{ext}
    ext = os.path.splitext(filename)[1]
    unique_name = f"{uuid.uuid4()}{ext}"
    
    # Determine tenant_id context
    tenant_id = current_user.tenant_id if hasattr(current_user, "tenant_id") else str(current_user.id)
    
    object_name = f"chat/{tenant_id}/{unique_name}"
    
    upload_url = create_presigned_upload(object_name, content_type)
    
    if not upload_url:
        raise HTTPException(status_code=500, detail="Could not generate presigned URL")
        
    # Also return the public URL where it will be accessible
    # This might depend on how we serve it. If public bucket:
    # url = f"{settings.MINIO_PUBLIC_ENDPOINT}/{settings.MINIO_BUCKET}/{object_name}"
    # BUT if we use presigned GETs later, we might just store the key 'object_name' in DB.
    # For now let's return a constructed public URL for the Frontend to send as 'media_url'
    
    from app.core.config import settings
    # Ensure public endpoint doesn't have trailing slash
    base = settings.MINIO_PUBLIC_ENDPOINT.rstrip('/')
    public_url = f"{base}/{settings.MINIO_BUCKET}/{object_name}"
    
    return {
        "uploadUrl": upload_url,
        "publicUrl": public_url,
        "mediaMeta": {
            "key": object_name,
            "filename": filename,
            "contentType": content_type
        }
    }
