"""
Push Notification Testing Endpoint
Allows admins to send test push notifications to verify the system works
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.db.base import get_db
from app.db.models.user import User
from app.db.models.doctor import Doctor
from app.api.deps import get_current_admin
from app.services.push_service import send_push_notification

router = APIRouter()


class PushTestRequest(BaseModel):
    user_email: str
    title: str
    body: str
    icon: Optional[str] = "/icon-192x192.png"
    badge: Optional[str] = "/badge-72x72.png"
    data: Optional[dict] = None


@router.get("/users-with-push")
async def get_users_with_push(
    db: Session = Depends(get_db),
    current_admin: Doctor = Depends(get_current_admin)
):
    """
    Get list of users who have push notifications enabled
    
    **Admin only** - Returns list of users for testing purposes
    """
    users = db.query(User).filter(
        User.push_subscription.isnot(None)
    ).all()
    
    return {
        "success": True,
        "count": len(users),
        "users": [
            {
                "id": user.id,
                "email": user.email,
                "name": user.name or user.email.split('@')[0]
            }
            for user in users
        ]
    }


@router.post("/test-push")
async def test_push_notification(
    request: PushTestRequest,
    db: Session = Depends(get_db),
    current_admin: Doctor = Depends(get_current_admin)
):
    """
    Send a test push notification to a specific user
    
    **Admin only** - Requires authentication
    
    Example payload:
    ```json
    {
        "user_email": "paciente@example.com",
        "title": "🔔 Prueba de Notificación",
        "body": "Esta es una notificación de prueba del sistema",
        "data": {"type": "test", "timestamp": "2026-02-08T22:00:00Z"}
    }
    ```
    """
    # Find user by email
    user = db.query(User).filter(User.email == request.user_email).first()
    
    if not user:
        raise HTTPException(status_code=404, detail=f"User not found: {request.user_email}")
    
    # Check if user has push subscription
    if not user.push_subscription:
        raise HTTPException(
            status_code=400, 
            detail=f"User {request.user_email} has not enabled push notifications"
        )
    
    try:
        # Send push notification
        result = send_push_notification(
            user=user,
            title=request.title,
            body=request.body,
            icon=request.icon,
            badge=request.badge,
            data=request.data or {}
        )
        
        return {
            "success": True,
            "message": f"Test notification sent to {request.user_email}",
            "user_id": user.id,
            "subscription_endpoint": user.push_subscription[:50] + "..." if user.push_subscription else None,
            "result": result
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send push notification: {str(e)}"
        )


@router.get("/test-all-types/{user_email}")
async def test_all_notification_types(
    user_email: str,
    db: Session = Depends(get_db),
    current_admin: Doctor = Depends(get_current_admin)
):
    """
    Send test notifications for all supported types to verify the system
    
    **Admin only**
    
    This will send 5 different test notifications:
    1. Cycle Phase (Period reminder)
    2. Fertile Window
    3. Ovulation
    4. Contraceptive Reminder
    5. General Alert
    """
    # Find user
    user = db.query(User).filter(User.email == user_email).first()
    
    if not user:
        raise HTTPException(status_code=404, detail=f"User not found: {user_email}")
    
    if not user.push_subscription:
        raise HTTPException(
            status_code=400,
            detail=f"User {user_email} has not enabled push notifications"
        )
    
    # Test notifications to send
    test_notifications = [
        {
            "title": "🩸 Recordatorio de Periodo",
            "body": "Tu periodo está por llegar en 3 días. Prepárate con anticipación.",
            "icon": "/icon-192x192.png",
            "data": {"type": "cycle_phase", "phase": "pre_period"}
        },
        {
            "title": "💚 Ventana Fértil",
            "body": "Has entrado en tu ventana fértil. Alta probabilidad de embarazo.",
            "icon": "/icon-192x192.png",
            "data": {"type": "fertile_window"}
        },
        {
            "title": "🥚 Día de Ovulación",
            "body": "Hoy es tu día estimado de ovulación.",
            "icon": "/icon-192x192.png",
            "data": {"type": "ovulation"}
        },
        {
            "title": "💊 Anticonceptivo",
            "body": "Es hora de tomar tu píldora anticonceptiva.",
            "icon": "/icon-192x192.png",
            "data": {"type": "contraceptive_reminder"}
        },
        {
            "title": "🔔 Notificación General",
            "body": "Sistema de notificaciones funciona correctamente.",
            "icon": "/icon-192x192.png",
            "data": {"type": "system_test"}
        }
    ]
    
    results = []
    errors = []
    
    for idx, notification in enumerate(test_notifications, 1):
        try:
            result = send_push_notification(
                user=user,
                title=notification["title"],
                body=notification["body"],
                icon=notification["icon"],
                data=notification["data"]
            )
            results.append({
                "notification_number": idx,
                "title": notification["title"],
                "status": "sent",
                "result": result
            })
        except Exception as e:
            errors.append({
                "notification_number": idx,
                "title": notification["title"],
                "status": "failed",
                "error": str(e)
            })
    
    return {
        "success": len(errors) == 0,
        "message": f"Sent {len(results)}/{len(test_notifications)} test notifications",
        "user_email": user_email,
        "results": results,
        "errors": errors if errors else None
    }
