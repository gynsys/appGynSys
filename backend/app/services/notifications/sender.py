from typing import Tuple, Optional, Union
from sqlalchemy.orm import Session
from app.db.models.notification import PendingNotification, NotificationRule
from app.db.models.cycle_user import CycleUser
from app.db.models.doctor import Doctor
from app.tasks.email_tasks import _send_integrated_email
from app.services.push_service import send_push_to_actor
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

def send_dual_notification_logic(db: Session, item: PendingNotification, log_id: Optional[int] = None) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Envia por Push + Email de forma DUAL (Soporta Usuaria o Doctora).
    Si log_id está presente, se incluye en el payload de Push para tracking.
    """
    # Identificar el actor (Prioridad: recipient_id -> doctor_id)
    actor = None
    email_address = None
    
    if item.recipient_id:
        actor = db.query(CycleUser).filter(CycleUser.id == item.recipient_id).first()
        if actor: email_address = actor.email
    elif item.doctor_id:
        actor = db.query(Doctor).filter(Doctor.id == item.doctor_id).first()
        if actor: email_address = actor.email
        
    if not actor:
        return False, None, "Actor not found"
    
    # Usuario pidió que absolutamente todas sean duales (Email + Push)
    # Ignoramos la preferencia del item si no es dual, a menos que el canal esté vacío
    # channel_pref = item.channel or "dual" 
    # Forzamos dual para máxima confiabilidad según requerimiento
    channels_to_try = ["push", "email"]
    
    push_success = False
    email_success = False
    errors = []
    channels_sent = []
    
    # 1. INTENTAR PUSH
    if "push" in channels_to_try:
        if push_circuit.can_execute():
            try:
                # Si es para doctora, el link debe ser al dash de admin
                url = "/admin/dashboard" if hasattr(actor, "slug_url") else "/cycle/dashboard"
                
                # Payload data con tracking ID
                push_data = {"url": url}
                if log_id:
                    push_data["notification_id"] = log_id

                result = send_push_to_actor(
                    actor=actor, 
                    title=item.subject, 
                    body=item.message_text or item.subject,
                    data=push_data
                )
                
                if result.get("success"):
                    push_success = True
                    push_circuit.record_success()
                    channels_sent.append("push")
                else:
                    errors.append(f"Push failed: {result.get('error')}")
            except Exception as e:
                push_circuit.record_failure()
                errors.append(f"Push error: {str(e)}")
                log_notification_event("push_failure", actor.id, item.rule.notification_type if item.rule else "unknown", {"error": str(e)})
        else:
            errors.append("Push circuit breaker OPEN")
    
    # 2. INTENTAR EMAIL
    if "email" in channels_to_try:
        if email_address:
            try:
                _send_integrated_email(email_address, item.subject, item.body)
                email_success = True
                channels_sent.append("email")
            except Exception as e:
                errors.append(f"Email error: {str(e)}")
        else:
            errors.append("No email address found")
    
    # El éxito global depende de que al menos uno haya salido bien
    # Pero el usuario quiere DUAL, así que informamos fallos parciales en final_error
    success = push_success or email_success
    final_channel = "+".join(channels_sent) if channels_sent else None
    final_error = "; ".join(errors) if errors else None
    
    return success, final_channel, final_error
