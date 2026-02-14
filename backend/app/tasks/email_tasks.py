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
from app.db.base import get_db, SessionLocal
from app.db.models.doctor import Doctor
from app.db.models.cycle_user import CycleUser
from app.db.models.push_subscription import PushSubscription

# Configurar logging
logger = logging.getLogger(__name__)


def calculate_predictions(last_period_date: date, avg_cycle: int, avg_period: int) -> dict:
    """
    Calculate cycle predictions based on last period.
    Returns dict with next_period_start, ovulation_date, fertile_window_start, fertile_window_end.
    """
    next_period = last_period_date + timedelta(days=avg_cycle)
    ovulation = next_period - timedelta(days=14)
    fertile_start = ovulation - timedelta(days=5)
    fertile_end = ovulation + timedelta(days=1)
    
    return {
        'next_period_start': next_period,
        'ovulation_date': ovulation,
        'fertile_window_start': fertile_start,
        'fertile_window_end': fertile_end
    }


def _send_smtp_email(to_email: str, subject: str, html_content: str, attachments: list = None):
    """
    Helper to send email via SMTP, optionally with attachments.
    attachments: list of dicts {'filename': str, 'content': bytes}
    """
    # Check if SMTP is configured (basic check)
    if not settings.SMTP_USER or "tu_correo" in settings.SMTP_USER:
        return

    try:
        msg = MIMEMultipart()
        msg["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.attach(MIMEText(html_content, "html"))

        if attachments:
            for attachment in attachments:
                if attachment.get('content'):
                    part = MIMEApplication(
                        attachment['content'],
                        Name=attachment.get('filename', 'attachment')
                    )
                    part['Content-Disposition'] = f'attachment; filename="{attachment.get("filename", "attachment")}"'
                    msg.attach(part)

        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
    except Exception as e:
        logger.error(f"Error sending email: {e}")


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
            "tag": f"gynsys-{datetime.now().strftime('%Y%m%d')}",  # Evitar duplicados
            "requireInteraction": True
        })
        
        failed_subs = []
        for sub in subs:
            try:
                webpush(
                    subscription_info={
                        "endpoint": sub.endpoint,
                        "keys": {
                            "p256dh": sub.p256dh,
                            "auth": sub.auth
                        }
                    },
                    data=payload,
                    vapid_private_key=settings.VAPID_PRIVATE_KEY,
                    vapid_claims={
                        "sub": f"mailto:{settings.VAPID_CLAIM_EMAIL}",
                        "exp": int((datetime.now() + timedelta(hours=12)).timestamp())
                    },
                    timeout=10
                )
            except WebPushException as ex:
                if ex.response and ex.response.status_code in [404, 410]:
                    # Subscription expired/gone
                    failed_subs.append(sub)
                else:
                    logger.error(f"Push error for user {user_id}: {ex}")
            except Exception as e:
                logger.error(f"Unexpected push error: {e}")
        
        # Batch delete expired subscriptions
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
    _send_smtp_email(email, subject, content)


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
    
    _send_smtp_email(email, subject, html_content, attachments)
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
    _send_smtp_email(doctor_email, subject, content)
    
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
    _send_smtp_email(patient_email, subject, content)
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
    admin_email = "dramarielh@gmail.com"
    subject = f"Nuevo Registro de Doctor: {tenant_data.get('nombre_completo')}"
    
    html_content = f"""
    <h1>Nuevo Doctor Registrado</h1>
    <p><strong>Nombre:</strong> {tenant_data.get('nombre_completo')}</p>
    <p><strong>Email:</strong> {tenant_data.get('email')}</p>
    <p><strong>Plan ID:</strong> {tenant_data.get('plan_id')}</p>
    <p><strong>Referencia Pago:</strong> {tenant_data.get('payment_reference')}</p>
    <hr>
    <p>Ingresa al panel administrativo para aprobar o rechazar esta cuenta.</p>
    """
    
    _send_smtp_email(admin_email, subject, html_content)
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
        
        _send_smtp_email(email, subject, content)
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
    
    _send_smtp_email(doctor_email, subject, html_content)
    return {"status": "sent", "recipient": doctor_email}


@celery_app.task
def send_reset_password_email(email: str, token: str):
    """
    Send password reset email with token link.
    """
    reset_link = f"http://localhost:5173/reset-password?token={token}"
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
    
    _send_smtp_email(email, subject, html_content)
    return {"status": "sent", "recipient": email}


@celery_app.task
def send_cycle_user_reset_password_email(email: str, token: str):
    """
    Send password reset email with token link for Cycle Users.
    """
    reset_link = f"http://localhost:5173/reset-password?token={token}&type=cycle_user"
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
    
    _send_smtp_email(email, subject, html_content)
    return {"status": "sent", "recipient": email}


@celery_app.task
def send_daily_cycle_events():
    """
    Runs DAILY at 7 PM local time (America/Caracas UTC-4).
    Optimized to avoid N+1 queries.
    """
    db = SessionLocal()
    try:
        tz = pytz.timezone('America/Caracas')
        today = datetime.now(tz).date()
        
        # Eager loading de relaciones necesarias
        users = db.query(CycleUser).filter(
            CycleUser.is_active == True
        ).options(
            joinedload(CycleUser.notification_settings),
            joinedload(CycleUser.cycle_logs),
            joinedload(CycleUser.pregnancy_logs)
        ).all()
        
        for user in users:
            try:
                # Ahora accedemos a relaciones precargadas, no hacemos nuevas queries
                active_pregnancy = next(
                    (p for p in user.pregnancy_logs if p.is_active), 
                    None
                )
                
                if active_pregnancy and active_pregnancy.notifications_enabled:
                    # Calculate Gestational Age
                    delta_days = (today - active_pregnancy.last_period_date).days
                    
                    # Send weekly update (every 7 days)
                    if delta_days > 0 and delta_days % 7 == 0:
                        weeks = delta_days // 7
                        _send_smtp_email(
                            user.email,
                            f"Semana {weeks} de Embarazo - GynSys",
                            f'''
                            <h1>¡Felicidades! Estás en la semana {weeks}</h1>
                            <p>Hola {user.nombre_completo},</p>
                            <p>Tu bebé sigue creciendo. Esperamos que te sientas muy bien.</p>
                            <p>No olvides tomar tus vitaminas prenatales y asistir a tus controles.</p>
                            '''
                        )
                    continue
                
                # Usar relación precargada
                settings = user.notification_settings
                if not settings:
                    continue
                
                # Último ciclo ya está precargado, solo ordenamos en memoria
                last_cycle = max(
                    user.cycle_logs, 
                    key=lambda x: x.start_date,
                    default=None
                )
                
                if not last_cycle:
                    continue
                
                # 3. Calculate Predictions
                avg_cycle = user.cycle_avg_length or 28
                avg_period = user.period_avg_length or 5
                
                preds = calculate_predictions(last_cycle.start_date, avg_cycle, avg_period)
                
                # 4. Check & Send Alerts
                is_ovulation_today = False

                # C) Ovulation Alert (Peak day)
                if settings.ovulation_alert:
                    if preds['ovulation_date'] == today:
                        is_ovulation_today = True
                        _send_smtp_email(
                            user.email, 
                            "Día de Ovulación - GynSys",
                            f'''
                            <h1>Día de Ovulación</h1>
                            <p>Hola {user.nombre_completo},</p>
                            <p>Hoy es tu día estimado de ovulación. Es el momento de máxima fertilidad en tu ciclo.</p>
                            '''
                        )

                # B) Fertile Window Alert (Start day)
                if settings.fertile_window_alerts and not is_ovulation_today:
                    if preds['fertile_window_start'] == today:
                        _send_smtp_email(
                            user.email, 
                            "Tu ventana fértil ha comenzado - GynSys",
                            f'''
                            <h1>Ventana Fértil</h1>
                            <p>Hola {user.nombre_completo},</p>
                            <p>Tu ventana fértil comienza <strong>hoy</strong>. Tienes mayores probabilidades de embarazo durante los próximos días.</p>
                            '''
                        )
                
                # A) Period Alert (1 day before)
                if settings.rhythm_method_enabled:
                    days_until_period = (preds['next_period_start'] - today).days
                    if days_until_period == 1:
                        _send_smtp_email(
                            user.email, 
                            "Tu periodo comienza pronto - GynSys",
                            f'''
                            <h1>¡Prepárate!</h1>
                            <p>Hola {user.nombre_completo},</p>
                            <p>Según tus registros, tu periodo debería comenzar <strong>mañana</strong> ({preds['next_period_start'].strftime('%d/%m/%Y')}).</p>
                            '''
                        )
                
                # E) Annual Gyn Checkup
                if settings.gyn_checkup_alert:
                    if user.created_at and user.created_at.month == today.month and user.created_at.day == today.day:
                         _send_smtp_email(
                            user.email,
                            "Recordatorio de Chequeo Anual - GynSys",
                            f'''
                            <h1>Chequeo Anual</h1>
                            <p>Hola {user.nombre_completo},</p>
                            <p>Ha pasado un año desde tu registro. Es un buen momento para agendar tu control ginecológico anual.</p>
                            '''
                        )
                
                # PHASE 1: Rhythm Method Abstinence Alerts
                if settings.rhythm_abstinence_alerts:
                    fertile_start = preds['fertile_window_start']
                    fertile_end = preds['fertile_window_end']
                    
                    if fertile_start == today:
                        _send_smtp_email(
                            user.email,
                            "🔴 Inicio Periodo de Abstinencia - Método del Ritmo",
                            f'''
                            <h1>Método del Ritmo: Periodo de Abstinencia</h1>
                            <p>Hola {user.nombre_completo},</p>
                            <p>Según el método del ritmo, <strong>hoy comienza tu ventana fértil</strong>.</p>
                            <p>Tu ventana fértil durará hasta el <strong>{fertile_end.strftime('%d/%m/%Y')}</strong>.</p>
                            '''
                        )
                    
                    if fertile_end == today:
                        next_period = preds['next_period_start']
                        _send_smtp_email(
                            user.email,
                            "✅ Fin Periodo de Abstinencia - Método del Ritmo",
                            f'''
                            <h1>Método del Ritmo: Vuelta a Días Seguros</h1>
                            <p>Hola {user.nombre_completo},</p>
                            <p>Tu ventana fértil ha terminado.</p>
                            <p>Según el método del ritmo, <strong>vuelves a tus días no fértiles (seguros)</strong>.</p>
                            '''
                        )
                
                # PHASE 1: Period Confirmation Reminders
                if settings.period_confirmation_reminder:
                    next_period = preds['next_period_start']
                    
                    # Check if user has registered a new cycle since prediction
                    has_new_cycle = next(
                        (c for c in user.cycle_logs if c.start_date >= next_period),
                        None
                    )
                    
                    if not has_new_cycle:
                        days_since_predicted = (today - next_period).days
                        
                        if days_since_predicted in [0, 1, 2] and (settings.last_period_reminder_sent != today):
                            _send_smtp_email(
                                user.email,
                                "📅 ¿Llegó tu Periodo? - GynSys",
                                f'''
                                <h1>Confirmación de Periodo</h1>
                                <p>Hola {user.nombre_completo},</p>
                                <p>Por favor confirma si tu periodo ha llegado para mantener tus predicciones actualizadas.</p>
                                '''
                            )
                            settings.last_period_reminder_sent = today
                            db.commit()
                            
            except Exception as user_error:
                logger.error(f"Error processing user {user.id}: {user_error}")
                continue
                
    except Exception as e:
        logger.critical(f"Critical error in send_daily_cycle_events: {e}")
    finally:
        db.close()
    
    return {"status": "completed"}


@celery_app.task(bind=True, max_retries=3)
def send_daily_contraceptive_alert(self):
    """
    Runs every 15 minutes. Sends contraceptive reminders.
    Respects user's pill regimen configuration.
    """
    db = SessionLocal()
    try:
        from app.db.models.cycle_predictor import CycleNotificationSettings, PregnancyLog
        tz = pytz.timezone('America/Caracas')
        now = datetime.now(tz)
        today = now.date()
        
        # Ventana de tiempo: ±7 minutos
        time_window = timedelta(minutes=7)
        
        # Query optimizada con join
        query = db.query(CycleUser, CycleNotificationSettings).join(
            CycleNotificationSettings,
            CycleUser.id == CycleNotificationSettings.cycle_user_id
        ).filter(
            CycleUser.is_active == True,
            CycleNotificationSettings.contraceptive_enabled == True,
            CycleNotificationSettings.contraceptive_time.isnot(None)
        )
        
        for user, settings in query.all():  # Procesar todos
            try:
                # Verificar si ya se envió hoy
                if settings.last_contraceptive_sent_date == today:
                    continue
                
                # Checks pregnancy (active only)
                is_pregnant = db.query(PregnancyLog).filter(
                    PregnancyLog.cycle_user_id == user.id, 
                    PregnancyLog.is_active == True
                ).first()
                if is_pregnant:
                    continue

                # Parse y comparar horas
                try:
                    u_h, u_m = map(int, settings.contraceptive_time.split(':'))
                    user_time = now.replace(hour=u_h, minute=u_m, second=0, microsecond=0)
                    diff = abs((now - user_time).total_seconds())
                except ValueError:
                    logger.error(f"Invalid time format for user {user.id}: {settings.contraceptive_time}")
                    continue
                
                if diff > time_window.total_seconds():
                    continue
                
                # Lógica de rest week configurable
                if settings.contraceptive_frequency == "active_pills_only":
                    if _is_in_rest_week(user, today, db):
                        logger.info(f"User {user.id} in rest week, skipping")
                        continue
                
                # Enviar notificación
                _send_contraceptive_reminder(user, settings, db)
                
                # Marcar como enviado
                settings.last_contraceptive_sent_date = today
                db.commit()
                
            except Exception as user_error:
                logger.error(f"Error processing user {user.id}: {user_error}")
                db.rollback()
                continue
                
    except Exception as e:
        logger.critical(f"Critical error: {e}")
        # Reintentar tarea completa
        raise self.retry(exc=e, countdown=60)
    finally:
        db.close()
    
    return {"status": "completed"}


def _is_in_rest_week(user, today, db):
    """Check if user is in rest week based on their cycle."""
    from app.db.models.cycle_predictor import CycleLog
    
    last_cycle = db.query(CycleLog).filter(
        CycleLog.cycle_user_id == user.id
    ).order_by(CycleLog.start_date.desc()).first()
    
    if not last_cycle:
        return False
    
    days_since = (today - last_cycle.start_date).days
    pill_day = (days_since % 28) + 1
    return 22 <= pill_day <= 28


def _send_contraceptive_reminder(user, settings, db):
    """Send email and push notification."""
    _send_smtp_email(
        user.email,
        "💊 Recordatorio Anticonceptivo - GynSys",
        f'''
        <h1>Hora de tu anticonceptivo</h1>
        <p>Hola {user.nombre_completo},</p>
        <p>Es hora de tomar tu dosis ({settings.contraceptive_time}).</p>
        <p>No olvides mantener la regularidad para máxima efectividad.</p>
        '''
    )
    
    _send_web_push(
        user.id,
        "💊 Recordatorio Anticonceptivo",
        f"Es hora de tu dosis ({settings.contraceptive_time})",
        "/cycle/dashboard",
        db
    )


@celery_app.task
def send_settings_updated_email(cycle_user_id: int):
    """
    Send confirmation email when user updates notification settings.
    """
    from app.db.base import SessionLocal
    from app.db.models.cycle_user import CycleUser
    from app.db.models.cycle_predictor import CycleNotificationSettings
    
    db = SessionLocal()
    try:
        user = db.query(CycleUser).filter(CycleUser.id == cycle_user_id).first()
        settings = db.query(CycleNotificationSettings).filter(CycleNotificationSettings.cycle_user_id == cycle_user_id).first()
        
        if not user or not settings:
            return

        # Build list of active alerts
        active_alerts = []
        if settings.contraceptive_enabled:
            active_alerts.append(f"<li>💊 <strong>Anticonceptivos:</strong> Diariamente ({settings.contraceptive_time or 'No definida'})</li>")
        if settings.rhythm_method_enabled:
             active_alerts.append("<li>📅 <strong>Periodo:</strong> Aviso 1 día antes</li>")
        if settings.fertile_window_alerts:
             active_alerts.append("<li>❤️ <strong>Ventana Fértil:</strong> Aviso de inicio</li>")
        if settings.ovulation_alert:
             active_alerts.append("<li>🥚 <strong>Ovulación:</strong> Aviso de día pico</li>")
        if settings.gyn_checkup_alert:
             active_alerts.append("<li>🩺 <strong>Chequeo Anual:</strong> Recordatorio de aniversario</li>")
             
        alerts_html = "".join(active_alerts) if active_alerts else "<li>🔕 <em>No has activado ninguna notificación.</em></li>"

        _send_smtp_email(
            user.email,
            "Alerta de Prueba: Ajustes Actualizados - GynSys",
            f'''
            <h1>Tus notificaciones están activas</h1>
            <p>Hola {user.nombre_completo},</p>
            <p>Has actualizado tus preferencias de notificaciones exitosamente. Recibirás alertas para:</p>
            <ul>
                {alerts_html}
            </ul>
            <p>Si esto es correcto, ¡no tienes que hacer nada más!</p>
            '''
        )

    except Exception as e:
        print(f"Error sending settings update email: {e}")
    finally:
        db.close()




