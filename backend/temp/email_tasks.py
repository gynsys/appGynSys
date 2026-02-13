"""
Celery tasks for sending emails.
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings
from app.core.celery_app import celery_app
from app.core.push import send_web_push
import json
from app.db.models.notification import PushSubscription




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
            from email.mime.application import MIMEApplication
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
        pass
    except Exception as e:
        print(f"Error sending email: {e}")
        pass


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
def send_tenant_approval_email(email: str, doctor_name: str, slug: str):
    """
    Send approval email to a tenant with their landing page link.
    """
    landing_url = f"http://localhost:5174/{slug}"
    
    pass
    
    return {"status": "sent", "email": email, "link": landing_url}


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
    pass
    return {"status": "sent", "to": admin_email}


@celery_app.task
def send_tenant_approval_email(email: str, name: str, slug_url: str):
    """
    Send approval email to tenant with their public link.
    """
    public_link = f"http://localhost:5173/dr/{slug_url}"
    pass
    return {"status": "sent", "to": email}


# --- Helper Functions (Ported from Frontend) ---

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
    """
    from app.db.base import SessionLocal
    from app.db.models.cycle_user import CycleUser
    from app.db.models.cycle_predictor import CycleNotificationSettings, CycleLog, PregnancyLog
    from datetime import date, timedelta
    import pytz
    from datetime import datetime
    
    db = SessionLocal()
    try:
        users = db.query(CycleUser).filter(CycleUser.is_active == True).all()
        
        # Use America/Caracas timezone for consistent date calculation
        tz = pytz.timezone('America/Caracas')
        today = datetime.now(tz).date()
        
        for user in users:
            # 0. Check for Active Pregnancy (Priority)
            active_pregnancy = db.query(PregnancyLog).filter(
                PregnancyLog.cycle_user_id == user.id, 
                PregnancyLog.is_active == True
            ).first()
            
            if active_pregnancy and active_pregnancy.notifications_enabled:
                # Calculate Gestational Age
                # LMP = active_pregnancy.last_period_date
                # Weeks = (Today - LMP).days / 7
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
                # If pregnant, we SKIP normal cycle alerts
                continue

            # 1. Get Settings
            settings = db.query(CycleNotificationSettings).filter(CycleNotificationSettings.cycle_user_id == user.id).first()
            if not settings: continue
                
            # 2. Get Last Cycle
            last_cycle = db.query(CycleLog).filter(CycleLog.cycle_user_id == user.id).order_by(CycleLog.start_date.desc()).first()
            if not last_cycle: continue
                
            # 3. Calculate Predictions
            avg_cycle = user.cycle_avg_length or 28
            avg_period = user.period_avg_length or 5
            
            preds = calculate_predictions(last_cycle.start_date, avg_cycle, avg_period)
            
            # 4. Check & Send Alerts
            
            # Priority Flag
            is_ovulation_today = False

            # C) Ovulation Alert (Peak day) -- PROCESSED FIRST for Priority
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

            # B) Fertile Window Alert (Start day) -- SKIPPED if Ovulation is today (though mathematically rare to overlap start w/ peak, safe to guard)
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
                        <p>Recuerda registrar el inicio en tu calendario.</p>
                        '''
                    )
            
            # E) Annual Gyn Checkup
            if settings.gyn_checkup_alert:
                # Check if today is the anniversary of registration (simple proxy for annual checkup)
                if user.created_at and user.created_at.month == today.month and user.created_at.day == today.day:
                     _send_smtp_email(
                        user.email,
                        "Recordatorio de Chequeo Anual - GynSys",
                        f'''
                        <h1>Chequeo Anual</h1>
                        <p>Hola {user.nombre_completo},</p>
                        <p>Ha pasado un año desde tu registro. Es un buen momento para agendar tu control ginecológico anual.</p>
                        <p>Contacta a tu especialista para una cita.</p>
                        '''
                    )
            
            # PHASE 1: Rhythm Method Abstinence Alerts
            if settings.rhythm_abstinence_alerts:
                fertile_start = preds['fertile_window_start']
                fertile_end = preds['fertile_window_end']
                
                # Alert 1: START of fertile window (start abstinence)
                # This is when the woman BECOMES fertile and should abstain
                if fertile_start == today:
                    _send_smtp_email(
                        user.email,
                        "🔴 Inicio Periodo de Abstinencia - Método del Ritmo",
                        f'''
                        <h1>Método del Ritmo: Periodo de Abstinencia</h1>
                        <p>Hola {user.nombre_completo},</p>
                        <p>Según el método del ritmo, <strong>hoy comienza tu ventana fértil</strong>.</p>
                        <p>Si deseas evitar un embarazo de forma natural, este es el periodo de abstinencia.</p>
                        <p>Tu ventana fértil durará hasta el <strong>{fertile_end.strftime('%d/%m/%Y')}</strong>.</p>
                        <p>Los días seguros (no fértiles) volverán después de esta fecha.</p>
                        '''
                    )
                
                # Alert 2: END of fertile window (end abstinence = safe days return)
                # This is when the woman is NO LONGER fertile and can resume relations
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
                        <p>Tu próximo periodo está estimado para el {next_period.strftime('%d/%m/%Y')}.</p>
                        '''
                    )
            
            # PHASE 1: Period Confirmation Reminders
            if settings.period_confirmation_reminder:
                next_period = preds['next_period_start']
                
                # Check if user has registered a new cycle since prediction
                has_new_cycle = db.query(CycleLog).filter(
                    CycleLog.cycle_user_id == user.id,
                    CycleLog.start_date >= next_period
                ).first()
                
                if not has_new_cycle:
                    days_since_predicted = (today - next_period).days
                    
                    # Day 0: Predicted day
                    if days_since_predicted == 0 and (settings.last_period_reminder_sent != today):
                        _send_smtp_email(
                            user.email,
                            "📅 ¿Llegó tu Periodo? - GynSys",
                            f'''
                            <h1>Confirmación de Periodo</h1>
                            <p>Hola {user.nombre_completo},</p>
                            <p>Hoy está predicho el inicio de tu periodo.</p>
                            <p><strong>¿Ya llegó?</strong> No olvides registrarlo en tu calendario para mantener predicciones precisas.</p>
                            <p>Ingresa a tu calculadora menstrual para actualizar tu registro.</p>
                            '''
                        )
                        settings.last_period_reminder_sent = today
                        db.commit()
                    
                    # Day +1: One day late
                    elif days_since_predicted == 1 and (settings.last_period_reminder_sent != today):
                        _send_smtp_email(
                            user.email,
                            "📅 Recordatorio: Registro de Periodo",
                            f'''
                            <h1>¿Necesitas actualizar tu registro?</h1>
                            <p>Hola {user.nombre_completo},</p>
                            <p>Tu periodo estaba predicho para ayer. Si ya llegó, por favor regístralo.</p>
                            <p>Si aún no ha llegado, esto es normal. Los ciclos pueden variar.</p>
                            <p>Mantén tu calendario actualizado para mejores predicciones.</p>
                            '''
                        )
                        settings.last_period_reminder_sent = today
                        db.commit()
                    
                    # Day +2: Two days late
                    elif days_since_predicted == 2 and (settings.last_period_reminder_sent != today):
                        _send_smtp_email(
                            user.email,
                            "⏰ Último Recordatorio: Actualiza tu Ciclo",
                            f'''
                            <h1>Mantén tu Calendario Actualizado</h1>
                            <p>Hola {user.nombre_completo},</p>
                            <p>Han pasado 2 días desde tu periodo predicho.</p>
                            <p>Si ya llegó, regístralo para mejorar futuras predicciones.</p>
                            <p>Si no ha llegado y esto es inusual para ti, considera consultar a tu médico.</p>
                            '''
                        )
                        settings.last_period_reminder_sent = today
                        db.commit()
                    
    except Exception as e:
        print(f"Error in send_daily_cycle_events: {e}")
    finally:
        db.close()
    
    return {"status": "completed"}


@celery_app.task
def send_daily_contraceptive_alert():
    """
    Runs every 15 minutes. Checks if any user scheduled a reminder for this time block.
    Only sends ONCE per day per user.
    Uses America/Caracas timezone (UTC-4).
    """
    from app.db.base import SessionLocal
    from app.db.models.cycle_user import CycleUser
    from app.db.models.cycle_predictor import CycleNotificationSettings, PregnancyLog
    from datetime import datetime, timedelta, date
    import pytz
    
    db = SessionLocal()
    try:
        # Use America/Caracas timezone (UTC-4)
        tz = pytz.timezone('America/Caracas')
        now = datetime.now(tz)
        today = now.date()
        current_hour = now.hour
        current_minute = now.minute
        
        print(f"[CONTRACEPTIVE CHECK] Time block: {current_hour}:{current_minute:02d} (America/Caracas UTC-4)")

        users = db.query(CycleUser).filter(CycleUser.is_active == True).all()
        print(f"[DEBUG] Found {len(users)} active users")
        
        for user in users:
            try:
                print(f"[DEBUG] Processing user: {user.email}")
                
                # Skip if pregnant
                is_pregnant = db.query(PregnancyLog).filter(
                    PregnancyLog.cycle_user_id == user.id, 
                    PregnancyLog.is_active == True
                ).first()
                if is_pregnant: 
                    print(f"[SKIP] {user.email} - Pregnant")
                    continue

                # Lock the row to prevent race conditions
                settings = db.query(CycleNotificationSettings).filter(
                    CycleNotificationSettings.cycle_user_id == user.id
                ).with_for_update().first()
            
                print(f"[DEBUG] {user.email} - Settings found: {settings is not None}")
                
                if not settings or not settings.contraceptive_enabled or not settings.contraceptive_time:
                    print(f"[SKIP] {user.email} - No settings or not enabled (settings={settings}, enabled={settings.contraceptive_enabled if settings else None}, time={settings.contraceptive_time if settings else None})")
                    continue
                
                # CRITICAL: Check if already sent today
                if settings.last_contraceptive_sent_date == today:
                    print(f"[SKIP] {user.email} - Already sent today ({today})")
                    continue
                
                # Parse user's preferred time
                try:
                    u_h, u_m = map(int, settings.contraceptive_time.split(':'))
                    print(f"[DEBUG] {user.email} - Parsed time: {u_h}:{u_m:02d}, Current: {current_hour}:{current_minute:02d}")
                except ValueError:
                    print(f"[ERROR] {user.email} - Invalid time format: {settings.contraceptive_time}")
                    continue
                
                # INTELLIGENT REST WEEK DETECTION
                # Most contraceptive pills: 21 active days + 7 rest days = 28-day cycle
                # We need to find day 1 of the pill cycle to calculate which day we're on
                
                # Use first contraceptive sent date as Day 1 reference
                # If not available, use cycle start date
                pill_cycle_day_1 = None
                
                # Try to find a reference date (first time contraceptive was enabled)
                # In the absence of a specific "pill_start_date", we'll use last period as proxy
                from app.db.models.cycle_predictor import CycleLog
                last_cycle = db.query(CycleLog).filter(
                    CycleLog.cycle_user_id == user.id
                ).order_by(CycleLog.start_date.desc()).first()
                
                if last_cycle:
                    # Use period start as reference for pill cycle
                    pill_cycle_day_1 = last_cycle.start_date
                    days_since_cycle_start = (today - pill_cycle_day_1).days
                    
                    # Calculate which day of the 28-day pill cycle we're on (1-28)
                    pill_day = (days_since_cycle_start % 28) + 1
                    
                    print(f"[DEBUG] {user.email} - Pill cycle day: {pill_day} (started {pill_cycle_day_1})")
                    
                    # Days 22-28 are the rest week (no active pills)
                    if 22 <= pill_day <= 28:
                        print(f"[SKIP] {user.email} - Rest week (day {pill_day}/28)")
                        continue
                    else:
                        print(f"[OK] {user.email} - Active pill day ({pill_day}/28)")
                else:
                    print(f"[WARNING] {user.email} - No cycle reference found, sending reminder anyway")
                
                # Match Hour and Minute Window
                if u_h == current_hour:
                    diff = abs(u_m - current_minute)
                    print(f"[DEBUG] {user.email} - Hour matches! Minute diff: {diff}")
                    if diff < 8:
                        print(f"[SENDING] {user.email} - Time match: {settings.contraceptive_time}")
                        
                        # 1. Send Push Notification (Multi-Device)
                        try:
                            # Use relationship (backref from PushSubscription)
                            # Or check JSON column as fallback? Deprecated.
                            subscriptions = user.push_subscriptions
                            if subscriptions:
                                print(f"[PUSH] {user.email} - Sending to {len(subscriptions)} devices...")
                                payload = json.dumps({
                                    "title": "💊 Anticonceptivo",
                                    "body": f"Hora de tu píldora ({settings.contraceptive_time})",
                                    "url": "/dashboard",
                                    "icon": "/pills.png"
                                })
                                
                                sent_count = 0
                                for sub in subscriptions:
                                    try:
                                        sub_info = {
                                            "endpoint": sub.endpoint,
                                            "keys": {
                                                "auth": sub.auth,
                                                "p256dh": sub.p256dh
                                            }
                                        }
                                        success, err = send_web_push(sub_info, payload)
                                        if success:
                                            sent_count += 1
                                        else:
                                            print(f"[PUSH FAILED] Device {sub.id}: {err}")
                                    except Exception as sub_e:
                                        print(f"[PUSH ERROR] Device {sub.id}: {sub_e}")
                                
                                print(f"[PUSH SUMMARY] {user.email} - Sent to {sent_count}/{len(subscriptions)} devices")
                            else:
                                print(f"[PUSH SKIP] {user.email} - No active subscriptions found")
                        except Exception as push_e:
                            print(f"[PUSH ERROR] {user.email} - Global error: {push_e}")

                        # 2. Send Email (Existing)
                        _send_smtp_email(
                            user.email,
                            "Recordatorio Anti-conceptivo - GynSys",
                            f'''
                            <h1>Recordatorio</h1>
                            <p>Hola {user.nombre_completo},</p>
                            <p>Es hora de tomar tu anticonceptivo ({settings.contraceptive_time}).</p>
                            '''
                        )
                        
                        # Update immediately and commit
                        settings.last_contraceptive_sent_date = today
                        db.flush()  # Force immediate write
                        db.commit()
                        
                        print(f"[SUCCESS] {user.email} - Marked as sent for {today}")
                    else:
                        print(f"[NO MATCH] {user.email} - Time diff too large: {diff} minutes")
                else:
                    print(f"[NO MATCH] {user.email} - Hour doesn't match: {u_h} != {current_hour}")
                
            except Exception as user_error:
                print(f"[ERROR] Processing user {user.email}: {user_error}")
                db.rollback()
                continue

    except Exception as e:
        print(f"[CRITICAL ERROR] send_daily_contraceptive_alert: {e}")
        db.rollback()
    finally:
        db.close()
    
    return {"status": "completed"}


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




