import json
import logging
import re
from html import unescape
from typing import Dict, Any, Optional

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


def send_push_notification(
    user: CycleUser,
    title: str,
    body: str,
    icon: Optional[str] = "/icon-192x192.png",
    badge: Optional[str] = "/badge-72x72.png",
    data: Optional[Dict[str, Any]] = None,
    image: Optional[str] = None
) -> Dict[str, Any]:
    """
    Send a push notification to a user using pywebpush.
    
    Args:
        user: CycleUser instance with push_subscription
        title: Notification title
        body: Notification body text
        icon: Path to icon image
        badge: Path to badge image
        data: Custom data dictionary
        image: Optional large image URL
        
    Returns:
        Dict with status of the operation
    """
    # Check if user has any subscriptions
    if not user.push_subscriptions:
        return {"success": False, "error": "User has no push subscription"}
        
    # Prepare payload
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

    # Send to all registered devices
    for sub in user.push_subscriptions:
        subscription_info = {
            "endpoint": sub.endpoint,
            "keys": {
                "p256dh": sub.p256dh,
                "auth": sub.auth
            }
        }
            
        try:
            # Send notification
            response = webpush(
                subscription_info=subscription_info,
                data=json.dumps(payload),
                vapid_private_key=settings.VAPID_PRIVATE_KEY,
                vapid_claims={
                    "sub": f"mailto:{settings.EMAILS_FROM_EMAIL}"
                }
            )
            success_count += 1
            
        except WebPushException as ex:
            logger.error(f"WebPush error for user {user.id} device {sub.id}: {str(ex)}")
            
            # Check if subscription is expired/invalid
            if ex.response and ex.response.status_code in [404, 410]:
                # Automatically remove invalid subscription
                # Note: We need a db session here to delete, but for now we skip
                pass
                
            errors.append(str(ex))
            
        except Exception as e:
            logger.error(f"Unexpected error sending push to user {user.id}: {str(e)}")
            errors.append(str(e))
            
    if success_count > 0:
        return {
            "success": True, 
            "message": f"Sent to {success_count} devices",
            "device_count": len(user.push_subscriptions)
        }
    else:
        return {
            "success": False, 
            "error": f"Failed to send to any device. Last error: {errors[-1] if errors else 'Unknown'}"
        }
