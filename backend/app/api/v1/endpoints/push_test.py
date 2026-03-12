"""
Push Notification Testing Endpoint
Allows admins to send test push notifications to verify the system works
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.db.base import get_db
from app.db.models.cycle_user import CycleUser
from app.db.models.doctor import Doctor
from app.api.v1.endpoints.auth import get_current_admin_user
from app.services.push_service import send_push_notification
from app.db.models.push_subscription import PushSubscription
from app.db.models.push_subscription import PushSubscription

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
    current_admin: Doctor = Depends(get_current_admin_user)
):
    """
    Get list of users (CycleUsers and Doctors) who have push notifications enabled
    """
    # Query distinct cycle users who have at least one push subscription
    users_data = db.query(CycleUser.id, CycleUser.email, CycleUser.nombre_completo).join(PushSubscription, CycleUser.id == PushSubscription.user_id).distinct().all()
    
    # Query distinct doctors who have at least one push subscription
    doctors_data = db.query(Doctor.id, Doctor.email, Doctor.nombre_completo).join(PushSubscription, Doctor.id == PushSubscription.doctor_id).distinct().all()
    
    all_users = []
    for u in users_data:
        all_users.append({
            "id": f"u_{u.id}",
            "email": u.email,
            "name": u.nombre_completo or u.email.split('@')[0],
            "type": "patient"
        })
        
    for d in doctors_data:
        all_users.append({
            "id": f"d_{d.id}",
            "email": d.email,
            "name": f"{d.nombre_completo} (Inquilino)",
            "type": "doctor"
        })
    
    return {
        "success": True,
        "count": len(all_users),
        "users": all_users
    }


@router.get("/detailed-users-devices")
async def get_detailed_users_devices(
    db: Session = Depends(get_db),
    current_admin: Doctor = Depends(get_current_admin_user)
):
    """
    Audit endpoint: List all cycle users and doctors and their registered push devices.
    (SuperAdmin Only)
    """
    from sqlalchemy.orm import joinedload
    
    # 1. Get Cycle Users
    users = db.query(CycleUser).options(joinedload(CycleUser.patient_push_subscriptions)).all()
    
    # 2. Get Doctors
    doctors = db.query(Doctor).options(joinedload(Doctor.doctor_push_subscriptions)).all()
    
    result = []
    
    # Map Cycle Users
    for user in users:
        if not user.patient_push_subscriptions:
            continue
            
        devices = []
        for sub in user.patient_push_subscriptions:
            # Handle null endpoint (Capacitor devices use tokens)
            endpoint_display = "CAPACITOR_DEVICE"
            if sub.endpoint:
                endpoint_display = sub.endpoint[:60] + "..." if len(sub.endpoint) > 60 else sub.endpoint
            
            devices.append({
                "id": sub.id,
                "endpoint_short": endpoint_display,
                "token_short": sub.token[:20] + "..." if sub.token else None,
                "created_at": sub.created_at.isoformat() if sub.created_at else None,
                "updated_at": sub.updated_at.isoformat() if sub.updated_at else None
            })
        
        result.append({
            "id": f"u_{user.id}",
            "email": user.email,
            "name": user.nombre_completo or user.email,
            "type": "patient",
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "devices_count": len(devices),
            "devices": devices
        })
        
    # Map Doctors
    for doctor in doctors:
        if not doctor.doctor_push_subscriptions:
            continue
            
        devices = []
        for sub in doctor.doctor_push_subscriptions:
            # Handle null endpoint (Capacitor devices use tokens)
            endpoint_display = "CAPACITOR_DEVICE"
            if sub.endpoint:
                endpoint_display = sub.endpoint[:60] + "..." if len(sub.endpoint) > 60 else sub.endpoint

            devices.append({
                "id": sub.id,
                "endpoint_short": endpoint_display,
                "token_short": sub.token[:20] + "..." if sub.token else None,
                "created_at": sub.created_at.isoformat() if sub.created_at else None,
                "updated_at": sub.updated_at.isoformat() if sub.updated_at else None
            })
        
        result.append({
            "id": f"d_{doctor.id}",
            "email": doctor.email,
            "name": f"{doctor.nombre_completo} (Inquilino)",
            "type": "doctor",
            "created_at": doctor.created_at.isoformat() if doctor.created_at else None,
            "devices_count": len(devices),
            "devices": devices
        })
        
    return {
        "success": True,
        "count": len(result),
        "users": result
    }


@router.post("/test-push")
async def test_push_notification(
    request: PushTestRequest,
    db: Session = Depends(get_db),
    current_admin: Doctor = Depends(get_current_admin_user)
):
    """
    Send a test push notification to a specific user or doctor
    """
    # 1. Search in CycleUser
    actor = db.query(CycleUser).filter(CycleUser.email == request.user_email).first()
    
    # 2. If not found, search in Doctor
    if not actor:
        actor = db.query(Doctor).filter(Doctor.email == request.user_email).first()
    
    if not actor:
        raise HTTPException(status_code=404, detail=f"User or Doctor not found: {request.user_email}")
    
    # Check if they have push subscriptions
    subs = actor.patient_push_subscriptions if isinstance(actor, CycleUser) else actor.doctor_push_subscriptions
    if not subs:
        raise HTTPException(
            status_code=400, 
            detail=f"Entity {request.user_email} has not enabled push notifications"
        )
    
    try:
        # Send push notification
        result = send_push_notification(
            user=actor, #send_push_notification handles both as they both have .push_subscriptions
            title=request.title,
            body=request.body,
            icon=request.icon,
            badge=request.badge,
            data=request.data or {}
        )
        
        return {
            "success": True,
            "message": f"Test notification sent to {request.user_email}",
            "actor_id": actor.id,
            "subscription_count": len(subs),
            "result": result
        }
    
    except Exception as e:
        import logging
        logging.error(f"Push test error for {request.user_email}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send push notification: {str(e)}"
        )


@router.get("/test-all-types/{user_email}")
async def test_all_notification_types(
    user_email: str,
    db: Session = Depends(get_db),
    current_admin: Doctor = Depends(get_current_admin_user)
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
    user = db.query(CycleUser).filter(CycleUser.email == user_email).first()
    
    if not user:
        raise HTTPException(status_code=404, detail=f"User not found: {user_email}")
    
    if not user.push_subscriptions:
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
