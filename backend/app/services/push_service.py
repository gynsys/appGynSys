import json
import logging
import re
from html import unescape
from typing import Dict, Any, Optional, Union

from pywebpush import webpush, WebPushException
from app.core.config import settings
from app.db.models.cycle_user import CycleUser

logger = logging.getLogger(__name__)


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
    subscriptions = actor.push_subscriptions
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

    for sub in subscriptions:
        subscription_info = {
            "endpoint": sub.endpoint,
            "keys": {
                "p256dh": sub.p256dh,
                "auth": sub.auth
            }
        }
            
        try:
            webpush(
                subscription_info=subscription_info,
                data=json.dumps(payload),
                vapid_private_key=settings.VAPID_PRIVATE_KEY,
                vapid_claims={"sub": f"mailto:{settings.EMAILS_FROM_EMAIL}"}
            )
            success_count += 1
        except WebPushException as ex:
            logger.error(f"WebPush error for actor {actor.id}: {str(ex)}")
            errors.append(str(ex))
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}")
            errors.append(str(e))
            
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
