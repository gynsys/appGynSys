import json
import logging
from typing import Dict, Any, Optional

from pywebpush import webpush, WebPushException
from app.core.config import settings
from app.db.models.cycle_user import CycleUser

logger = logging.getLogger(__name__)


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
    if not user.push_subscription:
        return {"success": False, "error": "User has no push subscription"}
        
    # Prepare payload
    payload = {
        "title": title,
        "body": body,
        "icon": icon,
        "badge": badge,
        "data": data or {}
    }
    
    if image:
        payload["image"] = image
        
    # Get subscription info from user model
    subscription_info = user.push_subscription
    
    # Ensure keys are present in subscription info if stored as JSON
    if isinstance(subscription_info, str):
        try:
            subscription_info = json.loads(subscription_info)
        except json.JSONDecodeError:
            return {"success": False, "error": "Invalid subscription JSON"}
            
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
        
        return {
            "success": True, 
            "status_code": response.status_code,
            "message": "Notification sent successfully"
        }
        
    except WebPushException as ex:
        logger.error(f"WebPush error for user {user.id}: {str(ex)}")
        
        # Check if subscription is expired/invalid
        if ex.response and ex.response.status_code in [404, 410]:
            # TODO: Consider removing invalid subscription from DB
            return {"success": False, "error": "Subscription expired or invalid"}
            
        return {"success": False, "error": str(ex)}
        
    except Exception as e:
        logger.error(f"Unexpected error sending push to user {user.id}: {str(e)}")
        return {"success": False, "error": str(e)}
