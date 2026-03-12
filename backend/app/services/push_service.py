import json
import logging
import re
import os
from html import unescape
from typing import Dict, Any, Optional, Union

from pywebpush import webpush, WebPushException
try:
    import firebase_admin
    from firebase_admin import messaging, credentials
except ImportError:
    firebase_admin = None

from app.core.config import settings
from app.db.models.cycle_user import CycleUser

logger = logging.getLogger(__name__)

# Initialize Firebase if not already initialized
def _init_firebase():
    if firebase_admin and not firebase_admin._apps:
        try:
            service_account_path = settings.FIREBASE_SERVICE_ACCOUNT_PATH
            if service_account_path and os.path.exists(service_account_path):
                cred = credentials.Certificate(service_account_path)
                firebase_admin.initialize_app(cred)
                logger.info(f"Firebase SDK initialized with service account from {service_account_path}")
            else:
                # Fallback to default credentials or no-auth init if allowed
                firebase_admin.initialize_app()
                logger.info("Firebase SDK initialized with default settings")
        except Exception as e:
            logger.error(f"Failed to initialize Firebase: {e}")

_init_firebase()


def strip_html_tags(text: str) -> str:
    """Remove HTML tags and decode entities."""
    if not text:
        return ""
    text = unescape(text)
    clean = re.compile('<.*?>')
    return re.sub(clean, '', text)



def send_push_to_actor(
    actor: Union[CycleUser, 'Doctor'],
    title: str,
    body: str,
    icon: Optional[str] = "/pwa-192x192.png",
    badge: Optional[str] = "/pwa-192x192.png",
    data: Optional[Dict[str, Any]] = None,
    image: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generic function to send push to any actor (CycleUser or Doctor).
    """
    # Try both relationship names for compatibility
    subscriptions = getattr(actor, 'patient_push_subscriptions', None)
    if subscriptions is None:
        subscriptions = getattr(actor, 'doctor_push_subscriptions', [])
    
    if not subscriptions:
        return {"success": False, "error": "Actor has no push subscription"}
        
    payload = {
        "title": title,
        "body": strip_html_tags(body),
        "icon": icon,
        "badge": badge,
        "data": data or {}
    }
    
    if image:
        payload["image"] = image
        
    success_count = 0
    errors = []

    # To avoid modifying all callers, we try to get the session from the actor
    from sqlalchemy.orm import object_session
    db = object_session(actor)

    for sub in list(subscriptions): # Use list to allow removal during iteration if using a local list, but here we just delete from db
        # Case 1: Native Push (Capacitor/FCM)
        if sub.token:
            if not firebase_admin:
                logger.error("firebase-admin not installed, cannot send native push")
                errors.append("FCM not supported on this server instance")
                continue
                
            try:
                message = messaging.Message(
                    notification=messaging.Notification(
                        title=payload["title"],
                        body=payload["body"],
                        image=payload.get("image")
                    ),
                    data={k: str(v) for k, v in payload["data"].items()},
                    token=sub.token
                )
                response = messaging.send(message)
                logger.info(f"FCM success for actor {actor.id}, sub {sub.id}: {response}")
                success_count += 1
            except (messaging.UnregisteredError, messaging.SenderIdMismatchError) as e:
                logger.warning(f"FCM token invalid/unregistered for actor {actor.id}, sub {sub.id}. Deleting subscription. Error: {e}")
                if db:
                    db.delete(sub)
                    db.commit()
                errors.append(f"FCM token unregistered: {str(e)}")
            except Exception as e:
                logger.error(f"FCM error for actor {actor.id}, sub {sub.id}: {str(e)}")
                errors.append(f"FCM error: {str(e)}")
            continue

        # Case 2: Web Push (Browser)
        if sub.endpoint and sub.p256dh and sub.auth:
            subscription_info = {
                "endpoint": sub.endpoint,
                "keys": {
                    "p256dh": sub.p256dh,
                    "auth": sub.auth
                }
            }
                
            try:
                response = webpush(
                    subscription_info=subscription_info,
                    data=json.dumps(payload),
                    vapid_private_key=settings.VAPID_PRIVATE_KEY,
                    vapid_claims={"sub": f"mailto:{settings.EMAILS_FROM_EMAIL}"}
                )
                status_code = getattr(response, 'status_code', 'unknown')
                logger.info(f"WebPush success for actor {actor.id}, endpoint {sub.id}: {status_code}")
                
                if status_code not in [200, 201, 202]:
                    errors.append(f"Endpoint {sub.id} returned {status_code}")
                    # If 410 Gone or 404 Not Found, delete subscription
                    if status_code in [404, 410] and db:
                        logger.warning(f"WebPush endpoint {status_code} for actor {actor.id}, sub {sub.id}. Deleting.")
                        db.delete(sub)
                        db.commit()
                else:
                    success_count += 1
            except WebPushException as ex:
                status_code = ex.response.status_code if hasattr(ex, 'response') and ex.response else None
                error_msg = str(ex)
                if status_code:
                    error_msg += f" (Status: {status_code}, Body: {ex.response.text})"
                
                logger.error(f"WebPush error for actor {actor.id}: {error_msg}")
                errors.append(error_msg)

                # Cleanup on expiration
                if status_code in [404, 410] and db:
                    logger.warning(f"Deleting expired WebPush subscription {sub.id} for actor {actor.id}")
                    db.delete(sub)
                    db.commit()
            except Exception as e:
                logger.error(f"Unexpected error in webpush: {str(e)}")
                errors.append(str(e))
        else:
            logger.warning(f"Incomplete subscription data for sub {sub.id}")
            
    return {
        "success": success_count > 0, 
        "message": f"Sent to {success_count} devices",
        "errors": errors if errors else None
    }


def send_push_notification(
    user: CycleUser,
    title: str,
    body: str,
    icon: Optional[str] = "/pwa-192x192.png",
    badge: Optional[str] = "/pwa-192x192.png",
    data: Optional[Dict[str, Any]] = None,
    image: Optional[str] = None
) -> Dict[str, Any]:
    """Legacy wrapper for CycleUser push notifications."""
    return send_push_to_actor(user, title, body, icon, badge, data, image)
