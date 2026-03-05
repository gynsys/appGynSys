#email_tasks.py
"""
Celery tasks for sending emails.
"""
import smtplib
import json
import os
import re
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
from datetime import datetime, timedelta, date
from typing import Optional, List, Dict, Any

import requests
import pytz
from pywebpush import webpush, WebPushException
from sqlalchemy.orm import joinedload

from app.core.config import settings
from app.core.celery_app import celery_app
from app.core.email import _send_email_sync, _send_email_resend_sync
from app.db.base import get_db, SessionLocal
from app.db.models.doctor import Doctor
from app.db.models.cycle_user import CycleUser
from app.db.models.push_subscription import PushSubscription
from app.db.models.service import Service
from app.db.models.faq import FAQ
from app.db.models.testimonial import Testimonial
from app.db.models.preconsultation import PreconsultationQuestion
from app.db.models.tenant_module import TenantModule

# Configurar logging
logger = logging.getLogger(__name__)





def _send_integrated_email(to_email: str, subject: str, html_content: str, attachments: list = None):
    """
    Unified dispatcher for Celery tasks.
    Prioritizes Resend API if configured, falls back to SMTP.
    """
    if settings.RESEND_API_KEY:
        return _send_email_resend_sync(to_email, subject, html_content, attachments)
    
    return _send_email_sync(to_email, subject, html_content, attachments)


def _send_web_push(user_id: int, title: str, body: str, url: str = "/cycle/dashboard", db=None):
    """
    Helper to send Web Push Notification to all user devices.
    """
    if not settings.VAPID_PRIVATE_KEY or not settings.VAPID_CLAIM_EMAIL:
        logger.warning("VAPID keys not configured. Skipping Push.")
        return
    
    if db is None:
        logger.error("DB session required for web push")
        return
    
    try:
        subs = db.query(PushSubscription).filter(
            PushSubscription.user_id == user_id
        ).all()
        
        if not subs:
            return
        
        payload = json.dumps({
            "title": title,
            "body": body,
            "url": url,
            "icon": "/pwa-192x192.png",
            "badge": "/pwa-192x192.png",
            "tag": f"gynsys-{datetime.now().strftime('%Y%m%d')}",
            "requireInteraction": True
        })
        
        # Process private key (might be a file path or the key itself)
        vapid_private_key = settings.VAPID_PRIVATE_KEY
        if vapid_private_key and not os.path.exists(vapid_private_key):
            # If it's the raw string from .env, pywebpush might need it as a string or decoded
            # Many implementations work best with the raw string if it's the PEM content
            # But the ones I generated are base64url keys (raw 32 bytes).
            pass

        failed_subs = []
        for sub in subs:
            try:
                logger.info(f"Sending push to user {user_id}, sub_id {sub.id}")
                webpush(
                    subscription_info={
                        "endpoint": sub.endpoint,
                        "keys": {
                            "p256dh": sub.p256dh,
                            "auth": sub.auth
                        }
                    },
                    data=payload,
                    vapid_private_key=vapid_private_key,
                    vapid_claims={
                        "sub": f"mailto:{settings.VAPID_CLAIM_EMAIL}",
                        "exp": int((datetime.now() + timedelta(hours=12)).timestamp())
                    },
                    timeout=10
                )
                logger.info(f"Push delivered successfully to sub_id {sub.id}")
            except WebPushException as ex:
                if ex.response is not None and ex.response.status_code in [404, 410]:
                    failed_subs.append(sub)
                else:
                    logger.error(f"Push error for user {user_id}: {ex}")
            except Exception as e:
                logger.error(f"Unexpected push error: {e}")
        
        if failed_subs:
            for sub in failed_subs:
                db.delete(sub)
            db.commit()
            
    except Exception as e:
        logger.error(f"Error in _send_web_push: {e}")



@celery_app.task
def send_welcome_email(email: str, doctor_name: str):
    """
    Send welcome email to a new doctor.
    """
    subject = "Bienvenido a GynSys"
    content = f"""
    <h1>Bienvenido Dr/a. {doctor_name}</h1>
    <p>Su cuenta ha sido creada exitosamente.</p>
    """
    _send_integrated_email(email, subject, content)


@celery_app.task
def send_welcome_dual_task(user_id: int, email: str, name: str):
    """
    Send dual welcome notification to cycle predictor user: Email + Push.
    """
    db = SessionLocal()
    try:
        # Recuperar al usuario con su doctor
        user = db.query(CycleUser).options(joinedload(CycleUser.doctor)).filter(CycleUser.id == user_id).first()
        doctor_name = user.doctor.nombre_completo if user and user.doctor else "su doctora"

        # 1. Preparar Email
        subject = "A Mi Ciclo"
        template_path = "app/templates/welcome_email.html"
        
        try:
            if os.path.exists(template_path):
                with open(template_path, "r", encoding="utf-8") as f:
                    template = f.read()
                html_content = template.replace("{{name}}", name).replace("{{doctor_name}}", doctor_name)
            else:
                html_content = f"<h1>Hola {name}!</h1><p>Bienvenida a A Mi Ciclo. Atentamente, Dra. {doctor_name}.</p>"
        except Exception as e:
            logger.error(f"Error loading welcome template: {e}")
            html_content = f"<h1>Hola {name}!</h1><p>Bienvenida a A Mi Ciclo. Atentamente, Dra. {doctor_name}.</p>"

        # 2. Intentar Email (Integrated: Resend or SMTP)
        _send_integrated_email(email, subject, html_content)
        
        # 3. Intentar Push
        # Nota: Para un usuario nuevo, esto fallará si no tiene subscripción aún.
        _send_web_push(
            user_id, 
            "👋 ¡Bienvenida!", 
            f"¡Hola {name}! Gracias por unirte a A Mi Ciclo.", 
            "/cycle/dashboard", 
            db
        )
    except Exception as e:
        logger.error(f"Error in send_welcome_dual_task: {e}")
    finally:
        db.close()


@celery_app.task
def send_consultation_report_email(email: str, patient_name: str, report_url: str = None, pdf_bytes: bytes = None):
    """
    Send consultation report link and attachment to patient.
    Can accept pre-generated PDF bytes or fetch from URL.
    """
    from email.mime.application import MIMEApplication
    
    subject = "Su Informe Médico - GynSys"
    attachments = []
    
    full_url = report_url
    if report_url and report_url.startswith("/"):
        full_url = f"http://localhost:8000{report_url}"

    # Priority 1: Use provided bytes
    if pdf_bytes:
        attachments.append({
            'filename': f'Informe_Medico_{patient_name.replace(" ", "_")}.pdf',
            'content': pdf_bytes
        })
    # Priority 2: Fetch from URL if bytes not provided
    elif full_url:
        try:
            import requests # Import here to avoid crash if missing
            # Add timeout to prevent hang
            response = requests.get(full_url, timeout=10)
            if response.status_code == 200:
                attachments.append({
                    'filename': f'Informe_Medico_{patient_name.replace(" ", "_")}.pdf',
                    'content': response.content
                })
        except Exception as e:
            print(f"Failed to fetch PDF for attachment: {e}")
    
    html_content = f"""
    <h1>Informe Médico Disponible</h1>
    <p>Hola {patient_name},</p>
    <p>Su consulta ha finalizado, adjunto encontrará su informe médico.</p>
    """
    
    if full_url:
        html_content += f"""
        <p>También puede descargarlo haciendo clic en el siguiente enlace si no puede visualizar el adjunto:</p>
        <p style="text-align: center; margin: 30px 0;">
            <a href="{full_url}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Descargar Informe Médico</a>
        </p>
        """
        
    html_content += """
    <hr>
    <p><small>GynSys - Gestión Médica</small></p>
    """
    
    _send_integrated_email(email, subject, html_content, attachments)
    return {"status": "sent", "recipient": email}





@celery_app.task
def send_appointment_notification_email(
    doctor_email: str,
    doctor_name: str,
    patient_name: str,
    appointment_date: str,
    appointment_type: str,
    reason: str,
    phone: str
):
    """
    Send notification email to doctor about a new appointment.
    """
    subject = f"Nueva Solicitud de Cita - {patient_name}"
    content = f"""
    <h2>Nueva Solicitud de Cita</h2>
    <p>Hola Dr/a. {doctor_name}, tiene una nueva solicitud de cita.</p>
    <ul>
        <li><strong>Paciente:</strong> {patient_name}</li>
        <li><strong>Fecha solicitada:</strong> {appointment_date}</li>
        <li><strong>Tipo:</strong> {appointment_type}</li>
        <li><strong>Motivo:</strong> {reason}</li>
        <li><strong>Teléfono:</strong> {phone}</li>
    </ul>
    <p>Por favor ingrese al panel administrativo para confirmar o rechazar esta solicitud.</p>
    """
    
    pass
    _send_integrated_email(doctor_email, subject, content)
    
    return {"status": "sent", "recipient": doctor_email}


@celery_app.task
def send_appointment_status_update(
    patient_email: str,
    patient_name: str,
    status: str,
    appointment_date: str,
    doctor_name: str,
    preconsulta_link: str = None
):
    """
    Send email to patient when appointment status changes (Approved/Rejected).
    """
    if status == "confirmed":
        subject = "Cita Confirmada - GynSys"
        action_html = ""
        if preconsulta_link:
            action_html = f"""
            <p><strong>IMPORTANTE:</strong> Para agilizar su atención, por favor complete su historia médica previa a la consulta en el siguiente enlace:</p>
            <p><a href="{preconsulta_link}" style="background-color: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Llenar Preconsulta</a></p>
            <p>O copie y pegue este enlace: {preconsulta_link}</p>
            """
            
        content = f"""
        <h2>Su cita ha sido confirmada</h2>
        <p>Hola {patient_name},</p>
        <p>Su cita con el Dr/a. {doctor_name} ha sido <strong>CONFIRMADA</strong>.</p>
        <p><strong>Fecha:</strong> {appointment_date}</p>
        {action_html}
        <p>¡Le esperamos!</p>
        """
    elif status == "cancelled":
        subject = "Cita Cancelada - GynSys"
        content = f"""
        <h2>Actualización de su cita</h2>
        <p>Hola {patient_name},</p>
        <p>Lamentamos informarle que su cita con el Dr/a. {doctor_name} para el {appointment_date} ha sido <strong>CANCELADA</strong>.</p>
        <p>Por favor contacte al consultorio para reagendar.</p>
        """
    else:
        return # Ignore other statuses for now

    pass
    _send_integrated_email(patient_email, subject, content)
    return {"status": "sent", "recipient": patient_email}


@celery_app.task
def send_appointment_reminder(email: str, appointment_date: str, doctor_name: str):
    """
    Send appointment reminder email.
    
    Args:
        email: Patient's email address
        appointment_date: Appointment date and time
        doctor_name: Doctor's name
    """
    # TODO: Implement email sending logic
    pass
    return {"status": "sent", "email": email}


@celery_app.task
def send_new_tenant_notification(tenant_data: dict):
    """
    Send notification to admin about new tenant registration.
    """
    admin_email = settings.ADMIN_EMAIL
    admin_url = f"{settings.FRONTEND_URL}/admin/tenants"
    subject = f"Nuevo Registro de Doctor: {tenant_data.get('nombre_completo')}"
    
    html_content = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h1 style="color: #4F46E5;">Nuevo Doctor Registrado</h1>
        <p>Se ha recibido una nueva solicitud de registro para el SaaS:</p>
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Nombre:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">{tenant_data.get('nombre_completo')}</td>
            </tr>
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Email:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">{tenant_data.get('email')}</td>
            </tr>
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Plan ID:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">{tenant_data.get('plan_id')}</td>
            </tr>
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Referencia Pago:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">{tenant_data.get('payment_reference') or 'No proporcionada'}</td>
            </tr>
        </table>
        <div style="margin-top: 30px; text-align: center;">
            <a href="{admin_url}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Revisar y Aprobar en Panel Admin</a>
        </div>
        <hr style="margin-top: 30px; border: 0; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #666;">GynSys SaaS Automático — Notificaciones</p>
    </div>
    """
    
    _send_integrated_email(admin_email, subject, html_content)
    return {"status": "sent", "to": admin_email}


@celery_app.task
def apply_doctor_template_async(doctor_id: int):
    """
    Async task to apply the Mariel Herrera template to a new doctor.
    Handles JSON loading and DB updates in background to prevent request timeout.
    """
    db = SessionLocal()
    try:
        doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
        if not doctor:
            print(f"[ERROR] Doctor {doctor_id} not found for template application.")
            return

        # Path relative to backend/app/tasks/email_tasks.py -> ../../../mariel_herrera_template.json
        # backend/app/tasks/email_tasks.py
        template_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'mariel_herrera_template.json')

        try:
            with open(template_path, 'r', encoding='utf-8') as f:
                template = json.load(f)

            # Apply profile configuration
            profile_info = template.get('profile_info', {})
            if profile_info:
                if not doctor.especialidad: doctor.especialidad = profile_info.get('especialidad')
                if not doctor.universidad: doctor.universidad = profile_info.get('universidad')
                if not doctor.biografia: doctor.biografia = profile_info.get('biografia')
                if not doctor.services_section_title: doctor.services_section_title = profile_info.get('services_section_title')
                if not doctor.contact_email: doctor.contact_email = profile_info.get('contact_email')

            # Apply theme configuration
            theme_config = template.get('theme_config', {})
            if theme_config:
                doctor.theme_primary_color = theme_config.get('theme_primary_color')
                doctor.theme_body_bg_color = theme_config.get('theme_body_bg_color')
                doctor.theme_container_bg_color = theme_config.get('theme_container_bg_color')
                doctor.card_shadow = theme_config.get('card_shadow')
                doctor.container_shadow = theme_config.get('container_shadow')

            # Apply social media
            social_media = template.get('social_media', {})
            if social_media:
                doctor.social_instagram = social_media.get('social_instagram')
                doctor.social_tiktok = social_media.get('social_tiktok')

            # Apply schedule and PDF config
            if 'schedule' in template:
                doctor.schedule = template['schedule']
            if 'pdf_config' in template:
                doctor.pdf_config = template['pdf_config']

            # Apply Services
            for s_data in template.get('services', []):
                new_service = Service(
                    doctor_id=doctor.id,
                    title=s_data.get('title'),
                    description=s_data.get('description'),
                    image_url=s_data.get('image_url'),
                    order=s_data.get('order', 0)
                )
                db.add(new_service)

            # Apply FAQs
            for f_data in template.get('faqs', []):
                new_faq = FAQ(
                    doctor_id=doctor.id,
                    question=f_data.get('question'),
                    answer=f_data.get('answer'),
                    display_order=f_data.get('order', 0)
                )
                db.add(new_faq)

            # Apply Testimonials
            for t_data in template.get('testimonials', []):
                new_testimonial = Testimonial(
                    doctor_id=doctor.id,
                    patient_name=t_data.get('name'),
                    content=t_data.get('content'),
                    photo_url=t_data.get('photo_url'),
                    rating=t_data.get('rating', 5),
                    is_approved=True,
                    is_featured=True
                )
                db.add(new_testimonial)

            # Apply Preconsultation Questions
            for q_data in template.get('preconsultation_questions', []):
                import uuid
                new_question = PreconsultationQuestion(
                    id=str(uuid.uuid4()),
                    doctor_id=doctor.id,
                    text=q_data.get('question_text'),
                    type=q_data.get('question_type'),
                    options=q_data.get('options'),
                    required=q_data.get('is_required', False),
                    order=q_data.get('order', 0),
                    category=q_data.get('category', 'general'),
                    is_active=True
                )
                db.add(new_question)

            # Apply Enabled Modules
            for module_name in template.get('enabled_modules', []):
                # Check if already exists to avoid duplicates
                existing = db.query(TenantModule).filter(
                    TenantModule.tenant_id == doctor.id,
                    TenantModule.module_name == module_name
                ).first()
                if not existing:
                    new_mod = TenantModule(
                        tenant_id=doctor.id,
                        module_name=module_name,
                        is_enabled=True
                    )
                    db.add(new_mod)

            db.commit()
            print(f"[SUCCESS] Template applied for Doctor {doctor.email}")

        except FileNotFoundError:
            print(f"[WARNING] Template file not found at {template_path}")
            # Fallback to default seeding
            from app.crud.admin import seed_tenant_data
            seed_tenant_data(db, doctor)
        except Exception as e:
            print(f"[ERROR] Error applying template: {e}")
            # Fallback
            from app.crud.admin import seed_tenant_data
            seed_tenant_data(db, doctor)

    except Exception as e:
        print(f"[CRITICAL] Failed doctor template task: {e}")
    finally:
        db.close()


@celery_app.task(bind=True, max_retries=3)
def send_tenant_approval_email(self, email: str, doctor_name: str, slug: str):
    """
    Send approval email to a tenant with their landing page link.
    """
    try:
        landing_url = f"{settings.FRONTEND_URL}/dr/{slug}"
        
        subject = "¡Bienvenido a GynSys! Tu cuenta ha sido aprobada"
        content = f"""
        <h1>¡Felicidades Dr/a. {doctor_name}!</h1>
        <p>Tu cuenta ha sido aprobada y ya puedes comenzar a usar GynSys.</p>
        <p>Tu página personal está lista en:</p>
        <p><a href="{landing_url}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">{landing_url}</a></p>
        <p>Desde allí tus pacientes podrán agendar citas y completar preconsultas.</p>
        """
        
        _send_integrated_email(email, subject, content)
        return {"status": "sent", "email": email, "link": landing_url}
        
    except Exception as exc:
        logger.error(f"Error sending tenant approval email: {exc}")
        # Reintentar en 5 minutos
        raise self.retry(exc=exc, countdown=300)


# --- Helper Functions (Ported from Frontend) ---

def calculate_predictions(last_period_date: date, cycle_length: int = 28, period_length: int = 5) -> dict:
    """
    Calculate cycle predictions based on last period date.
    Returns:
    - next_period_start
    - next_period_end
    - ovulation_date
    - fertile_window_start
    - fertile_window_end
    """
    next_period_start = last_period_date + timedelta(days=cycle_length)
    next_period_end = next_period_start + timedelta(days=period_length - 1)
    
    # Luteal phase is typically 14 days before next period
    ovulation_date = next_period_start - timedelta(days=14)
    
    # Fertile window: 5 days before ovulation + ovulation day
    fertile_window_start = ovulation_date - timedelta(days=5)
    fertile_window_end = ovulation_date 
    
    return {
        "next_period_start": next_period_start,
        "next_period_end": next_period_end,
        "ovulation_date": ovulation_date,
        "fertile_window_start": fertile_window_start,
        "fertile_window_end": fertile_window_end
    }

def to_roman(num):
    if not isinstance(num, int) or num < 1: return ""
    val = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1]
    syb = ["M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"]
    roman_num = ''
    i = 0
    while num > 0:
        while num >= val[i]:
            roman_num += syb[i]
            num -= val[i]
        i += 1
    return roman_num

def format_obstetric_history(data):
    g = p = a = c = 0
    ho_formula = data.get('gyn_ho', '') or ''
    used_table = False

    ho_table = data.get('ho_table_results')
    if ho_table and isinstance(ho_table, dict):
        try:
            g = int(ho_table.get('gestas', 0))
            p = int(ho_table.get('partos', 0))
            c = int(ho_table.get('cesareas', 0))
            a = int(ho_table.get('abortos', 0))
            used_table = True
        except: pass
    else:
        if 'nuligesta' in str(ho_formula).lower(): return "Paciente Nuligesta"
        if 'primigesta' in str(ho_formula).lower(): return "Paciente Primigesta"
    
    if g == 0 and p == 0 and a == 0 and c == 0:
        if not used_table and ho_formula and ho_formula != "No registrado":
            return ho_formula
        return "Paciente Nuligesta"

    parts = []
    if g > 0: parts.append(f"{to_roman(g)}G")
    if p > 0: parts.append(f"{to_roman(p)}P")
    if c > 0: parts.append(f"{to_roman(c)}C")
    if a > 0: parts.append(f"{to_roman(a)}A")

    result = " ".join(parts)

    try:
        birth_details = data.get('birth_details', [])
        if isinstance(birth_details, str): birth_details = json.loads(birth_details)
        
        if birth_details and isinstance(birth_details, list):
            details_list = []
            for birth in birth_details:
                 if not isinstance(birth, dict): continue
                 year = birth.get('birth_year', 'N/A')
                 weight = birth.get('weight', 'N/A')
                 height = birth.get('height', 'N/A')
                 comps = birth.get('complications', 'Sin complicaciones')
                 details_list.append(f"{year} {weight}kg / {height}cm, que cursó {comps}")
            if details_list:
                result += " -> " + "; ".join(details_list)
    except: pass
    
    return result

def format_full_gyn_obstetric_summary(data):
    parts = []
    
    # 1. Obstetric
    ho_text = format_obstetric_history(data)
    if ho_text:
        parts.append(ho_text if ho_text.endswith('.') else f"{ho_text}.")

    # 2. Menarche/Sexarche
    menarche = data.get('gyn_menarche')
    sexarche = data.get('gyn_sexarche')
    menarche_text = f"Menarquía a los {menarche} años" if menarche else ""
    sexarche_text = ""

    if sexarche:
        if 'nunca' in str(sexarche).lower(): sexarche_text = "Sexarquía: niega"
        else: sexarche_text = f"sexarquía a los {sexarche}"
    
    if menarche_text and sexarche_text: parts.append(f"{menarche_text} y {sexarche_text}.")
    elif menarche_text: parts.append(f"{menarche_text}.")
    elif sexarche_text: parts.append(f"{sexarche_text[0].upper() + sexarche_text[1:]}.")

    # 3. Cycles
    cycles = data.get('gyn_cycles', 'Regulares')
    dysmenorrhea = data.get('gyn_dysmenorrhea', 'No')
    cycle_text = "ciclos menstruales regulares"

    if 'irregulares' in str(cycles).lower():
        cycle_text = f"ciclos menstruales irregulares ({cycles})" 
    
    if str(dysmenorrhea).lower() != 'no':
        cycle_text += f", asociados a dismenorrea ({dysmenorrhea})"
    else:
        cycle_text += ", sin dismenorrea"
    parts.append(f"Refiere {cycle_text}.")

    # 4. FUM/MAC
    if data.get('gyn_fum'): parts.append(f"Su FUM fue el {data.get('gyn_fum')}.")
    if data.get('gyn_mac') and str(data.get('gyn_mac')).lower() != 'no':
         parts.append(f"Utiliza como método anticonceptivo: {str(data.get('gyn_mac')).lower()}.")

    # 5. Sexual Activity
    sex = data.get('sexually_active')
    if sex and str(sex).lower() in ['sí', 'si', 'true']:
        fert = data.get('gyn_fertility_intent')
        f_text = f"con {str(fert).lower()}" if fert and 'no tiene' not in str(fert).lower() else "sin deseo de fertilidad"
        parts.append(f"Mantiene actividad sexual activa {f_text}.")
    elif sex and str(sex).lower() == 'no':
        parts.append("No mantiene actividad sexual actualmente.")

    return " ".join(parts)

@celery_app.task
def send_preconsulta_completed_notification(
    doctor_email: str, 
    doctor_name: str, 
    patient_name: str, 
    appointment_date: str, 
    patient_data: dict = None,
    primary_color: str = '#4F46E5',
    summary_html: str = None
):
    """
    Notify doctor that a patient has completed the preconsulta.
    Sends a rich HTML email EXACTLY matching the React Admin Panel UI.
    """
    subject = f"Preconsulta Completada - {patient_name}"
    
    # Defaults
    if not patient_data: patient_data = {}
    p = patient_data
    
    # Data Helper
    def get_val(key, default=""):
        v = p.get(key)
        if v in [None, "null", "undefined", ""]: return default
        if isinstance(v, bool): return "Sí" if v else "No"
        return str(v)

    def fmt(val):
        if isinstance(val, list): return ", ".join(val)
        return str(val) if val else "Niega"

    # Extraction
    full_name = get_val('full_name', patient_name)
    ci = get_val('ci')
    age = get_val('age')
    email = get_val('email')
    phone = get_val('phone')
    address = get_val('address')
    occupation = get_val('occupation')
    
    reason = p.get('reason_for_visit') or p.get('gyn_reason') or "No especificado"
    supplements = p.get('supplements') or "Niega"
    
    fh_mother = fmt(p.get('family_history_mother'))
    fh_father = fmt(p.get('family_history_father'))
    ph_personal = fmt(p.get('personal_history'))
    ph_surgical = fmt(p.get('surgical_history'))
    
    # NEW LOGIC: Use Python Ported Function
    obstetric_summary = format_full_gyn_obstetric_summary(p)
    if not obstetric_summary: obstetric_summary = "Sin datos registrados."
    
    def get_func(key, default="No refiere"): return get_val(f'functional_{key}', get_val(key, default))
    def get_habit(key, default="Niega"): return get_val(f'habits_{key}', get_val(key, default))

    # HTML TEMPLATE
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {{ font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f9fafb; }}
        .container {{ max-width: 800px; margin: 20px auto; background-color: #f9fafb; }}
        .card {{ background-color: #ffffff; border-radius: 12px; margin-bottom: 24px; overflow: hidden; }}
        .card-header {{ padding: 12px 24px; border-bottom: 1px solid #f3f4f6; font-weight: bold; font-size: 14px; text-transform: uppercase; display: flex; align-items: center; letter-spacing: 0.05em; }}
        .card-body {{ padding: 24px; }}
        .field {{ margin-bottom: 12px; }}
        .label {{ font-weight: bold; color: #374151; font-size: 14px; text-transform: uppercase; margin-right: 8px; display: inline-block; min-width: 120px; }}
        .value {{ color: #111827; font-size: 14px; }}
        .highlight-card {{ padding: 24px; border-radius: 12px; }}
        .highlight-title {{ font-size: 12px; font-weight: bold; text-transform: uppercase; margin-bottom: 8px; }}
        .highlight-value {{ font-size: 18px; font-weight: 500; }}
        
        /* Utility */
        .text-blue-700 {{ color: #1d4ed8; }}
        .bg-blue-50 {{ background-color: #eff6ff; }}
        .border-blue-200 {{ border: 2px solid #bfdbfe; }}
        
        .text-pink-700 {{ color: #be185d; }}
        .bg-pink-50 {{ background-color: #fdf2f8; }}
        .border-pink-300 {{ border: 2px solid #fbcfe8; }}
        
        .text-green-700 {{ color: #15803d; }}
        .bg-green-50 {{ background-color: #f0fdf4; }}
        .border-green-200 {{ border: 2px solid #bbf7d0; }}
        
        .text-indigo-600 {{ color: #4f46e5; }}
        .bg-indigo-50 {{ background-color: #eef2ff; }}
        .border-indigo-200 {{ border: 2px solid #c7d2fe; }}
        
        .text-teal-600 {{ color: #0d9488; }}
        .bg-teal-50 {{ background-color: #f0fdfa; }}
        .border-teal-200 {{ border: 2px solid #99f6e4; }}

        .bg-gray-100 {{ background-color: #f3f4f6; }}
        .border-gray-200 {{ border: 2px solid #e5e7eb; }}
    </style>
    </head>
    <body>
        <div class="container">
            
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="font-size: 24px; font-weight: bold; color: {primary_color};">GynSys</div>
                <div style="color: #6b7280; font-size: 14px;">Nueva Preconsulta Completada</div>
            </div>

            <!-- CARD 1: DATOS PERSONALES (BLUE) -->
            <div class="card border-blue-200">
                <div class="card-header bg-blue-50 text-blue-700">
                    👤 Datos Personales
                </div>
                <div class="card-body">
                    <!-- Full Width Name -->
                    <div class="field" style="margin-bottom: 16px;">
                        <span class="label">Nombre Completo:</span>
                        <span class="value" style="font-size: 16px; font-weight: 600;">{full_name}</span>
                    </div>
                    
                    <!-- Grid 2 cols -->
                    <table width="100%">
                        <tr>
                            <td width="50%" valign="top">
                                <div class="field"><span class="label">Cédula:</span><span class="value">{ci}</span></div>
                                <div class="field"><span class="label">Edad:</span><span class="value">{age} años</span></div>
                                <div class="field"><span class="label">Email:</span><span class="value">{email}</span></div>
                            </td>
                            <td width="50%" valign="top">
                                <div class="field"><span class="label">Teléfono:</span><span class="value">{phone}</span></div>
                                <div class="field"><span class="label">Dirección:</span><span class="value">{address}</span></div>
                                <div class="field"><span class="label">Ocupación:</span><span class="value">{occupation}</span></div>
                            </td>
                        </tr>
                    </table>
                </div>
            </div>

            <!-- ROW: MOTIVO & SUPLEMENTOS -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                    <td width="49%" valign="top">
                        <div class="highlight-card bg-indigo-50 border-indigo-200">
                            <div class="highlight-title text-indigo-600">💬 Motivo de Consulta</div>
                            <div class="highlight-value" style="color: #312e81;">{reason}</div>
                        </div>
                    </td>
                    <td width="2%"></td>
                    <td width="49%" valign="top">
                        <div class="highlight-card bg-teal-50 border-teal-200">
                            <div class="highlight-title text-teal-600">💊 Suplementos Activos</div>
                            <div class="highlight-value" style="color: #134e4a;">{supplements}</div>
                        </div>
                    </td>
                </tr>
            </table>

            <!-- CARD 2: ANTECEDENTES MEDICOS (BLUE) -->
            <div class="card border-blue-200">
                <div class="card-header bg-blue-50 text-blue-700">
                    🏥 Antecedentes Médicos
                </div>
                <div class="card-body">
                    <table width="100%">
                        <tr>
                            <td width="50%" valign="top">
                                <div class="field"><span class="label" style="min-width: 150px;">Antecedentes Madre:</span><br><span class="value">{fh_mother}</span></div>
                            </td>
                             <td width="50%" valign="top">
                                <div class="field"><span class="label" style="min-width: 150px;">Antecedentes Padre:</span><br><span class="value">{fh_father}</span></div>
                            </td>
                        </tr>
                        <tr>
                            <td colspan="2" style="padding-top: 10px;">
                                <div class="field"><span class="label">Antecedentes Personales:</span><span class="value">{ph_personal}</span></div>
                            </td>
                        </tr>
                    </table>
                </div>
            </div>

            <!-- CARD 3: GINECO-OBSTETRICIA (PINK) -->
            <div class="card border-pink-300">
                <div class="card-header bg-pink-50 text-pink-700">
                    👶 Historia Gineco-Obstétrica
                </div>
                <div class="card-body">
                     <div style="font-size: 14px; line-height: 1.6; color: #1f2937; text-align: justify;">
                        {obstetric_summary}
                     </div>
                </div>
            </div>

            <!-- CARD 4: EXAMEN FUNCIONAL (GRAY/FULL) -->
            <div class="card border-gray-200">
                <div class="card-header bg-gray-100" style="color: #374151;">
                    🩺 Examen Funcional
                </div>
                <div class="card-body">
                     <table width="100%">
                        <tr>
                            <td width="50%" valign="top">
                                <div class="field"><span class="label">Dispareunia:</span><span class="value">{get_func('dispareunia')}</span></div>
                                <div class="field"><span class="label">Dolor Piernas:</span><span class="value">{get_func('leg_pain')}</span></div>
                                <div class="field"><span class="label">Gastro (Antes):</span><span class="value">{get_func('gastro_before')}</span></div>
                                <div class="field"><span class="label">Gastro (Durante):</span><span class="value">{get_func('gastro_during')}</span></div>
                                <div class="field"><span class="label">Disquecia:</span><span class="value">{get_func('dischezia')}</span></div>
                            </td>
                            <td width="50%" valign="top">
                                <div class="field"><span class="label">Frec. Intestinal:</span><span class="value">{get_func('bowel_freq')}</span></div>
                                <div class="field"><span class="label">Prob. Urinarios:</span><span class="value">{get_func('urinary_problem')}</span></div>
                                <div class="field"><span class="label">Dolor Urinario:</span><span class="value">{get_func('urinary_pain')}</span></div>
                                <div class="field"><span class="label">Incontinencia:</span><span class="value">{get_func('urinary_incontinence')}</span></div>
                                <div class="field"><span class="label">Nocturia:</span><span class="value">{get_func('urinary_nocturia')}</span></div>
                            </td>
                        </tr>
                     </table>
                </div>
            </div>
            
             <!-- CARD 5: HABITOS (GREEN) -->
            <div class="card border-green-200">
                <div class="card-header bg-green-50 text-green-700">
                    🏃 Hábitos Psicobiológicos
                </div>
                <div class="card-body">
                     <table width="100%">
                        <tr>
                            <td width="50%" valign="top">
                                <div class="field"><span class="label">Tabaco:</span><span class="value">{get_habit('smoking')}</span></div>
                                <div class="field"><span class="label">Alcohol:</span><span class="value">{get_habit('alcohol')}</span></div>
                            </td>
                            <td width="50%" valign="top">
                                <div class="field"><span class="label">Actividad Física:</span><span class="value">{get_habit('physical_activity')}</span></div>
                                <div class="field"><span class="label">Sustancias:</span><span class="value">{get_habit('substance_use')}</span></div>
                            </td>
                        </tr>
                     </table>
                </div>
            </div>

            <div style="text-align: center; margin-top: 30px;">
                <a href="http://localhost:5173/dashboard" style="background-color: {primary_color}; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Ingresar al Panel</a>
            </div>
            
            <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #9ca3af;">
                GynSys &copy; 2025
            </div>
        </div>
    </body>
    </html>
    """
    
    _send_integrated_email(doctor_email, subject, html_content)
    return {"status": "sent", "recipient": doctor_email}


@celery_app.task
def send_reset_password_email(email: str, token: str):
    """
    Send password reset email with token link.
    """
    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    subject = "Recuperación de Contraseña - GynSys"
    
    html_content = f"""
    <h1>Recuperación de Contraseña</h1>
    <p>Hemos recibido una solicitud para restablecer tu contraseña en GynSys.</p>
    <p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
    <p><a href="{reset_link}" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Restablecer Contraseña</a></p>
    <p>O copia y pega este enlace en tu navegador:</p>
    <p>{reset_link}</p>
    <p><small>Este enlace expirará en 24 horas.</small></p>
    <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
    """
    
    _send_integrated_email(email, subject, html_content)
    return {"status": "sent", "recipient": email}


@celery_app.task
def send_cycle_user_reset_password_email(email: str, token: str):
    """
    Send password reset email with token link for Cycle Users.
    """
    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}&type=cycle_user"
    subject = "Recuperación de Contraseña - Predictor de Ciclos"
    
    html_content = f"""
    <h1>Recuperación de Contraseña</h1>
    <p>Hemos recibido una solicitud para restablecer tu contraseña en el Predictor de Ciclos.</p>
    <p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
    <p><a href="{reset_link}" style="background-color: #ec4899; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Restablecer Contraseña</a></p>
    <p>O copia y pega este enlace en tu navegador:</p>
    <p>{reset_link}</p>
    <p><small>Este enlace expirará en 24 horas.</small></p>
    <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
    """
    
    _send_integrated_email(email, subject, html_content)
    return {"status": "sent", "recipient": email}


@celery_app.task
def send_settings_updated_email(cycle_user_id: int):
    """
    Notify user that their notification settings have been updated.
    """
    db = SessionLocal()
    try:
        user = db.query(CycleUser).filter(CycleUser.id == cycle_user_id).first()
        if not user or not user.email:
            return
            
        subject = "Configuración Actualizada - Predictor de Ciclos"
        html_content = f"""
        <div style="font-family: sans-serif; color: #374151;">
            <h1 style="color: #ec4899;">Configuración Actualizada</h1>
            <p>Hola <strong>{user.nombre_completo}</strong>,</p>
            <p>Te informamos que tus preferencias de notificación en el Predictor de Ciclos han sido actualizadas exitosamente.</p>
            <p>Si no realizaste este cambio, por favor contacta a soporte o al consultorio de tu médico.</p>
            <div style="margin-top: 24px;">
                <a href="{settings.FRONTEND_URL}/cycle/settings" style="background-color: #ec4899; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Ver mis Ajustes</a>
            </div>
            <p style="margin-top: 32px; font-size: 12px; color: #9ca3af;">GynSys &copy; 2026</p>
        </div>
        """
        _send_integrated_email(user.email, subject, html_content)
        return {"status": "sent", "recipient": user.email}
    finally:
        db.close()


@celery_app.task(name="app.tasks.email_tasks.check_and_send_appointment_reminders")
def check_and_send_appointment_reminders():
    """
    Periodic task to send appointment reminders 1h 30m before the appointment.
    Prioritizes Push notifications to save email limits.
    """
    from datetime import datetime, timedelta
    from app.db.base import SessionLocal
    from app.db.models.appointment import Appointment
    from app.db.models.cycle_user import CycleUser
    from app.db.models.doctor import Doctor
    from app.services.push_service import send_push_to_actor
    from app.tasks.email_tasks import _send_integrated_email
    import logging
    
    logger = logging.getLogger(__name__)
    db = SessionLocal()
    try:
        # 1. Calculate the time window (90 minutes from now +/- 10 mins buffer)
        now = datetime.utcnow()
        target_time = now + timedelta(minutes=90)
        window_start = target_time - timedelta(minutes=10)
        window_end = target_time + timedelta(minutes=10)
        
        logger.info(f"Checking for appointments between {window_start} and {window_end}")
        
        # 2. Find appointments in that window that haven't been reminded yet
        appointments = db.query(Appointment).filter(
            Appointment.appointment_date >= window_start,
            Appointment.appointment_date <= window_end,
            Appointment.reminder_sent == False,
            Appointment.status == "scheduled"
        ).all()
        
        for appt in appointments:
            try:
                logger.info(f"Sending reminders for appointment {appt.id} (Date: {appt.appointment_date})")
                
                # --- A. NOTIFY PATIENT ---
                patient_user = db.query(CycleUser).filter(CycleUser.email == appt.patient_email).first()
                
                patient_notified_via_push = False
                if patient_user and patient_user.push_subscriptions:
                    push_res = send_push_to_actor(
                        actor=patient_user,
                        title="🌸 Recordatorio de Cita",
                        body=f"Hola {appt.patient_name}, te recordamos tu cita hoy a las {appt.appointment_date.strftime('%I:%M %p')}.",
                        data={"url": "/cycle/dashboard", "tag": "appointment-reminder"}
                    )
                    patient_notified_via_push = push_res.get("success", False)
                
                if not patient_notified_via_push:
                    # Fallback to email if no PWA device
                    from app.core.config import settings
                    subject = f"Recordatorio de Cita - {appt.appointment_date.strftime('%I:%M %p')}"
                    content = f"""
                    <div style="font-family: sans-serif; color: #374151;">
                        <h2 style="color: {appt.doctor.theme_primary_color or '#4f46e5'};">Recordatorio de Cita</h2>
                        <p>Hola <strong>{appt.patient_name}</strong>, le recordamos su cita con el Dr/a. {appt.doctor.nombre_completo}.</p>
                        <p><strong>Fecha y Hora:</strong> {appt.appointment_date.strftime("%d/%m/%Y %I:%M %p")}</p>
                        <p>¡Le esperamos!</p>
                        <hr style="margin-top: 32px; border: 0; border-top: 1px solid #eee;">
                        <p style="font-size: 12px; color: #9ca3af;">GynSys &copy; 2026</p>
                    </div>
                    """
                    _send_integrated_email(appt.patient_email, subject, content)

                # --- B. NOTIFY DOCTOR ---
                doctor = appt.doctor
                doctor_notified_via_push = False
                if doctor.push_subscriptions:
                    push_res = send_push_to_actor(
                        actor=doctor,
                        title="📅 Cita Próxima",
                        body=f"Paciente {appt.patient_name} a las {appt.appointment_date.strftime('%I:%M %p')}.",
                        data={"url": "/admin/appointments", "tag": "doctor-reminder"}
                    )
                    doctor_notified_via_push = push_res.get("success", False)
                
                if not doctor_notified_via_push:
                    # Fallback to simple email for doctor
                    _send_integrated_email(
                        doctor.email, 
                        f"Recordatorio: Cita {appt.appointment_date.strftime('%I:%M %p')}",
                        f"<p>Doctor {doctor.nombre_completo}, le recordamos su cita con <b>{appt.patient_name}</b> hoy a las {appt.appointment_date.strftime('%I:%M %p')}.</p>"
                    )

                # 3. Mark as sent
                appt.reminder_sent = True
                db.commit()
                logger.info(f"✅ Reminders sent for appt {appt.id}")
                
            except Exception as e:
                logger.error(f"Error processing reminder for appointment {appt.id}: {e}", exc_info=True)
                db.rollback()
                
    except Exception as e:
        logger.error(f"Error in check_and_send_appointment_reminders: {e}", exc_info=True)
    finally:
        db.close()




