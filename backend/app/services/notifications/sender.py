from typing import Tuple, Optional, Union
from sqlalchemy.orm import Session
from app.db.models.notification import PendingNotification, NotificationRule
from app.db.models.cycle_user import CycleUser
from app.tasks.email_tasks import _send_integrated_email, _send_web_push
from .base import logger, push_circuit, log_notification_event
from .registry import NOTIFICATION_MAP

def safe_render_content(rule: Union[NotificationRule, "_RuleData"], context: dict) -> Optional[dict]:
    """Renderiza contenido de forma segura con fallback."""
    ntype = rule.notification_type
    try:
        if hasattr(rule, "render_content"):
            return rule.render_content(context)

        title_tpl = getattr(rule, "title_template", "") or ""
        text_tpl = getattr(rule, "message_text_template", "") or ""

        def _fmt(tpl: str) -> str:
            try:
                return tpl.format_map(context)
            except (KeyError, AttributeError):
                return tpl

        rendered_title = _fmt(title_tpl)
        rendered_text = _fmt(text_tpl)
        rendered_html = f"<p>{rendered_text}</p>" if rendered_text and not rendered_text.startswith("<") else rendered_text

        return {
            "title": rendered_title,
            "message_html": rendered_html,
            "message_text": rendered_text,
        }
    except Exception as e:
        logger.error(f"Error inesperado renderizando {ntype}: {e}", exc_info=True)
        registry_rule = NOTIFICATION_MAP.get(ntype)
        if registry_rule:
            return {
                "title": registry_rule["title"],
                "message_html": f"<p>{registry_rule['message']}</p>",
                "message_text": registry_rule["message"],
            }
        return None

def send_dual_notification_logic(db: Session, item: PendingNotification) -> Tuple[bool, Optional[str], Optional[str]]:
    """Envia por Push + Email si el canal es 'dual'."""
    user = db.query(CycleUser).filter(CycleUser.id == item.recipient_id).first()
    if not user:
        return False, None, "User not found"
    
    channel_pref = item.channel or "dual"
    push_success = False
    email_success = False
    errors = []
    channels_sent = []
    
    # 1. INTENTAR PUSH
    if channel_pref in ("dual", "push"):
        if push_circuit.can_execute():
            try:
                push_body = item.message_text or item.subject
                _send_web_push(user.id, item.subject, push_body, "/cycle/dashboard", db)
                push_success = True
                push_circuit.record_success()
                channels_sent.append("push")
            except Exception as e:
                push_circuit.record_failure()
                errors.append(f"Push error: {str(e)}")
                log_notification_event("push_failure", user.id, item.rule.notification_type if item.rule else "unknown", {"error": str(e)})
        else:
            errors.append("Push circuit breaker OPEN")
    
    # 2. INTENTAR EMAIL
    if channel_pref in ("dual", "email"):
        if user.email:
            try:
                _send_integrated_email(user.email, item.subject, item.body)
                email_success = True
                channels_sent.append("email")
            except Exception as e:
                errors.append(f"Email error: {str(e)}")
        else:
            errors.append("No email address found")
    
    success = push_success or email_success
    final_channel = "+".join(channels_sent) if channels_sent else None
    final_error = "; ".join(errors) if errors else None
    
    return success, final_channel, final_error
