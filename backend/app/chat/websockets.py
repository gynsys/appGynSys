import socketio
from typing import Any
from app.core.config import settings
from app.api.v1.endpoints.auth import verify_access_token

# Initialize Socket.IO server
# CORS allowed origins should match FastAPI config
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000", "https://gynsys.netlify.app", "https://appgynsys.onrender.com"],
    logger=True,
    engineio_logger=True
)

app = socketio.ASGIApp(sio)

@sio.event
async def connect(sid: str, environ: dict, auth: Any):
    """
    Handle new socket connection.
    Expects JWT token in auth header or query param.
    """
    token = None
    if auth and 'token' in auth:
        token = auth['token']
    
    if not token:
        # Check query string as fallback
        query = environ.get('QUERY_STRING', '')
        if 'token=' in query:
            import urllib.parse
            params = urllib.parse.parse_qs(query)
            if 'token' in params:
                token = params['token'][0]

    if not token:
        print(f"Socket connection rejected: No token provided (sid: {sid})")
        return False  # Reject connection

    payload = verify_access_token(token)
    if not payload:
        print(f"Socket connection rejected: Invalid token (sid: {sid})")
        return False

    # Store user info in session
    user_id = payload.get("user_id") or payload.get("doctor_id") # Support both types
    tenant_id = payload.get("tenant_id") or payload.get("doctor_id") # If doctor, tenant is self
    
    await sio.save_session(sid, {
        "user_id": user_id,
        "tenant_id": tenant_id,
        "email": payload.get("sub")
    })
    
    print(f"Socket connected: {sid} (User: {user_id}, Tenant: {tenant_id})")
    
    # Automatically join a personalized room for direct updates
    await sio.enter_room(sid, f"user_{user_id}")

@sio.event
async def disconnect(sid: str):
    print(f"Socket disconnected: {sid}")

@sio.event
async def join_room(sid: str, data: dict):
    """
    Join a specific chat room.
    """
    room_id = data.get('room_id')
    if room_id:
        session = await sio.get_session(sid)
        # TODO: Verify user is allowed in this room (check DB participation)
        # For now, trust the frontend logic reinforced by API checks
        await sio.enter_room(sid, room_id)
        print(f"User {session.get('user_id')} joined room {room_id}")

@sio.event
async def leave_room(sid: str, data: dict):
    """
    Leave a chat room.
    """
    room_id = data.get('room_id')
    if room_id:
        await sio.leave_room(sid, room_id)
