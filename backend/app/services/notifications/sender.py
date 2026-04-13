from typing import Tuple, Optional, Union
from sqlalchemy.orm import Session
from app.db.models.notification import PendingNotification, NotificationRule
from app.db.models.cycle_user import CycleUser
from app.db.models.doctor import Doctor
from app.tasks.email_tasks import _send_integrated_email
from app.services.push_service import send_push_to_actor
from .base import logger, push_circuit, log_notification_event
from .registry import NOTIFICATION_MAP, _RuleData
from app.core.config import settings

def safe_render_content(rule: Union[NotificationRule, "_RuleData"], context: dict) -> Optional[dict]:
    """Renderiza contenido de forma segura con fallback."""
    ntype = rule.notification_type
    try:
        if hasattr(rule, "render_content"):
            return rule.render_content(context)

        title_tpl = getattr(rule, "title_template", "") or ""
        html_tpl = getattr(rule, "message_template", "") or ""
        text_tpl = getattr(rule, "message_text_template", "") or ""

        def _fmt(tpl: str) -> str:
            try:
                return tpl.format_map(context)
            except (KeyError, AttributeError):
                return tpl

        rendered_title = _fmt(title_tpl)
        rendered_html = _fmt(html_tpl)
        
        # --- Fuente Única de Verdad para el Texto ---
        # Si el usuario NO proporcionó un texto plano específico, derivamos del HTML
        if not text_tpl:
            import re
            # Limpieza básica de HTML para Push, conservando saltos de línea
            clean_text = re.sub(r'<[^>]+>', '', html_tpl)
            # Normalizar espacios pero mantener líneas
            clean_text = "\n".join(line.strip() for line in clean_text.splitlines() if line.strip())
            rendered_text = _fmt(clean_text)
        else:
            rendered_text = _fmt(text_tpl)

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
    actor = None
    email_address = None
    
    # 1. IDENTIFICAR ACTOR (Quién recibe la notificación en su dispositivo - Push)
    if item.recipient_id:
        # Destinatario es una Paciente (CycleUser)
        actor = db.query(CycleUser).filter(CycleUser.id == item.recipient_id).first()
    elif item.doctor_id and not item.recipient_email_direct:
        # Destinatario es un Doctor (Tenant) - Solo si no es una campaña externa/manual con email directo
        actor = db.query(Doctor).filter(Doctor.id == item.doctor_id).first()

    # 2. DETERMINAR EMAIL_ADDRESS
    # REGLA DE ORO: Email Directo > Email del Actor > Email del Doctor (Fallback)
    
    # A. Prioridad 1: Email grabado en la notificación (Snapshots de Campaña/Manual)
    if item.recipient_email_direct:
        email_address = item.recipient_email_direct.strip()
        # SALVAGUARDA: Si hay email directo, NO consultamos el email del actor
        # para evitar el problema de "La Sombra del Doctor" si el perfil está viciado.
        
    # B. Prioridad 2: Email del perfil del Actor (SaaS Core: Citas, Recordatorios, Onboarding)
    if not email_address and actor:
        email_address = actor.email
            
    # C. Prioridad 3: Doctora (Fallback Final para notificaciones administrativas)
    if not email_address and item.doctor_id:
        doctor = db.query(Doctor).filter(Doctor.id == item.doctor_id).first()
        if doctor: 
            email_address = doctor.email
        
    if not email_address:
        return False, None, f"Target email not found (item_id: {item.id}, doctor_id: {item.doctor_id})"
    
    # Usuario pidió que absolutamente todas sean duales (Email + Push)
    # Ignoramos la preferencia del item si no es dual, a menos que el canal esté vacío
    # channel_pref = item.channel or "dual" 
    # Forzamos dual para máxima confiabilidad según requerimiento
    channels_to_try = ["push", "email"]
    
    push_success = False
    email_success = False
    errors = []
    channels_sent = []
    
    # 1. INTENTAR PUSH (Solo si hay actor/app)
    if "push" in channels_to_try and actor:
        if push_circuit.can_execute():
            try:
                # Si es para doctora, el link debe ser al dash de admin
                url = "/admin/dashboard" if hasattr(actor, "slug_url") else "/cycle/dashboard"
                
                # Payload data con tracking ID
                push_data = {"url": url}
                if log_id:
                    push_data["notification_id"] = log_id

                # Resolve Image URL: Only use explicitly set image, NOT doctor photo fallback
                # This keeps notifications compact (Instagram-style) instead of showing a large photo
                final_image_url = item.image_url
                
                # Make URL absolute if relative
                if final_image_url and not final_image_url.startswith(("http://", "https://")):
                    if not final_image_url.startswith("/"):
                        final_image_url = f"/{final_image_url}"
                    final_image_url = f"{settings.BACKEND_URL}{final_image_url}"

                result = send_push_to_actor(
                    actor=actor, 
                    title=item.subject, 
                    body=item.message_text or item.subject,
                    data=push_data,
                    image=final_image_url
                )
                
                if result.get("success"):
                    push_success = True
                    push_circuit.record_success()
                    channels_sent.append("push")
                else:
                    push_errors = result.get("errors")
                    errors.append(f"Push failed: {push_errors[0] if push_errors else 'Unknown error'}")
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
                # Capture the real success status from the email service
                email_success = _send_integrated_email(email_address, item.subject, item.body)
                if email_success:
                    channels_sent.append("email")
                else:
                    errors.append("Email service reported failure (check SMTP/Resend logs)")
            except Exception as e:
                errors.append(f"Email error: {str(e)}")
        else:
            errors.append("No email address found")
    
    # El éxito global depende de que al menos uno haya salido bien
    # Pero el usuario quiere DUAL, así que informamos fallos parciales en final_error
    success = push_success or email_success
    final_channel = "+".join(channels_sent) if channels_sent else None
    final_error = "; ".join(errors) if errors else None
    
    # Resolve the image URL to return it for logging (consistent with push logic)
    final_image_to_log = item.image_url
    if final_image_to_log and not final_image_to_log.startswith(("http://", "https://")):
        if not final_image_to_log.startswith("/"):
            final_image_to_log = f"/{final_image_to_log}"
        final_image_to_log = f"{settings.BACKEND_URL}{final_image_to_log}"

    return success, final_channel, final_error, final_image_to_log
