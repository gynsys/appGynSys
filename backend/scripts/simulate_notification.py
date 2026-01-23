import sys
import os
import json
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from sqlalchemy import create_engine, text, desc
from sqlalchemy.orm import sessionmaker

# Add backend directory to sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
sys.path.append(backend_dir)

# Import Models and Services
# NOTE: We avoid importing app.tasks.email_tasks because it requires 'celery' which might not be installed on host.
from app.db.models.appointment import Appointment
# from app.db.models.doctor import Doctor # Commented out to avoid schema mismatch
from app.db.models.preconsultation import PreconsultationQuestion
from app.services.summary_generator import ClinicalSummaryGenerator
from app.core.config import settings

# DB Connection
DB_URL = os.getenv("DATABASE_URL", "postgresql://postgres:gyn13409534@localhost:5432/gynsys")
engine = create_engine(DB_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# MOCK DATA FOR FALLBACK
MOCK_KIRA = {
    "full_name": "Kira Vargas (Prueba)",
    "ci": "12345678",
    "age": 29,
    "occupation": "Arquitecta",
    "email": "kira.vargas@email.com",
    "phone": "0987654321",
    "address": "Av. Principal 123",
    "reason_for_visit": "Control anual y dolor pélvico ocasional",
    "supplements": "Ácido Fólico, Vitamina C",
    "family_history_mother": ["Hipertensión Arterial"],
    "family_history_father": ["Diabetes Tipo 2"],
    "personal_history": ["Asma leve"],
    "surgical_history": ["Apendicectomía (2015)"],
    "obstetric_history_summary": "Paciente de 29 años, Nuligesta. Menarquía a los 12 años. Ciclos regulares de 28/4 días. Fecha de última regla: 15/12/2024. Niega dismenorrea. Método anticonceptivo actual: Preservativo.",
    "functional_dispareunia": "No refiere",
    "functional_leg_pain": "No refiere",
    "functional_gastro_before": "Distensión abdominal",
    "functional_gastro_during": "Normal",
    "functional_dischezia": "Niega",
    "functional_bowel_freq": "Diaria",
    "functional_urinary_problem": "Niega",
    "functional_urinary_pain": "Niega",
    "functional_urinary_incontinence": "Niega",
    "functional_urinary_nocturia": "1 vez por noche",
    "habits_smoking": "Niega",
    "habits_alcohol": "Social",
    "habits_physical_activity": "3 veces/semana (Gym)",
    "habits_substance_use": "Niega"
}

def send_email_direct(to_email, subject, html_content):
    """
    Standalone SMTP sender matching the logic in email_tasks.py
    """
    print(f"📧 Preparing to send email to {to_email}...")
    
    if not settings.SMTP_USER or "tu_correo" in settings.SMTP_USER:
        print("⚠️ SMTP credentials not configured (default detected). Skipping email.")
        return

    try:
        msg = MIMEMultipart()
        msg["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.attach(MIMEText(html_content, "html"))

        print(f"   Connecting to SMTP: {settings.SMTP_HOST}:{settings.SMTP_PORT}...")
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        print("✅ Email SENT successfully.")
    except Exception as e:
        print(f"❌ Failed to send email: {e}")

def simulate_notification(appointment_id=None):
    db = SessionLocal()
    try:
        # If no ID provided, or string provided, handle lookup
        if appointment_id is None or isinstance(appointment_id, str):
            target_name = appointment_id if isinstance(appointment_id, str) else None
            
            # Use raw SQL to avoid ORM model mismatch
            print(f"--- Searching for appointment (Name: {target_name} or Latest) ---")
            
            if target_name:
                query = text("SELECT id, patient_name, appointment_date, preconsulta_answers, doctor_id FROM appointments WHERE preconsulta_answers IS NOT NULL AND patient_name ILIKE :pname ORDER BY updated_at DESC LIMIT 1")
                row = db.execute(query, {"pname": f"%{target_name}%"}).fetchone()
            else:
                query = text("SELECT id, patient_name, appointment_date, preconsulta_answers, doctor_id FROM appointments WHERE preconsulta_answers IS NOT NULL ORDER BY updated_at DESC LIMIT 1")
                row = db.execute(query).fetchone()

            if not row:
                print("⚠️ No match in DB. Using MOCK DATA for 'Kira Vargas'.")
                class MockAppt: pass
                appointment = MockAppt()
                appointment.id = 999
                appointment.patient_name = "Kira Vargas"
                appointment.appointment_date = datetime.now()
                appointment.preconsulta_answers = json.dumps(MOCK_KIRA)
                appointment.doctor_id = 999 # Fake
                
                # Mock Doctor info since we can't query it easily
                doc_name = "Dr. Prueba"
                doc_email = settings.SMTP_USER # Send to self/admin for testing
                primary_color = "#820845" # Mariel Color
                
                print(f"✅ Using MOCK Appointment ID: {appointment.id} for Patient: {appointment.patient_name}")
            else:
                # Mock object for compatibility
                class MockAppt: pass
                appointment = MockAppt()
                appointment.id = row[0]
                appointment.patient_name = row[1]
                appointment.appointment_date = row[2]
                appointment.preconsulta_answers = row[3]
                appointment.doctor_id = row[4]
                
                appointment_id = appointment.id
                print(f"✅ Found Appointment ID: {appointment.id} for Patient: {appointment.patient_name}")
                print(f"   Date: {appointment.appointment_date}")
                
        print(f"--- Simulating Notification for Appointment {getattr(appointment, 'id', 'MOCK')} ---")
        
        # 1. Get Appointment (Already fetched if we used lookup, but ensuring we have the obj)
        if 'appointment' not in locals():
             # Fallback if ID was passed directly
             query = text("SELECT id, patient_name, appointment_date, preconsulta_answers, doctor_id FROM appointments WHERE id = :aid")
             row = db.execute(query, {"aid": appointment_id}).fetchone()
             if not row:
                print(f"❌ Appointment {appointment_id} not found.")
                return
             class MockAppt: pass
             appointment = MockAppt()
             appointment.id = row[0]
             appointment.patient_name = row[1]
             appointment.appointment_date = row[2]
             appointment.preconsulta_answers = row[3]
             appointment.doctor_id = row[4]

        # 2. Get Doctor (If not mocked)
        if hasattr(appointment, 'doctor_id') and appointment.doctor_id != 999:
            print(f"   Fetching Doctor ID: {appointment.doctor_id}...")
            query = text("SELECT nombre_completo, email FROM doctors WHERE id = :did")
            doc_row = db.execute(query, {"did": appointment.doctor_id}).fetchone()
            
            if not doc_row:
                print("❌ Doctor not found.")
                return
            
            doc_name = doc_row[0]
            doc_email = doc_row[1]
            
            # Get Primary Color
            query_color = text("SELECT theme_primary_color FROM doctors WHERE id = :did")
            doc_color_row = db.execute(query_color, {"did": appointment.doctor_id}).fetchone()
            primary_color = doc_color_row[0] if doc_color_row and doc_color_row[0] else '#4F46E5'
            
            print(f"✅ Doctor: {doc_name} ({doc_email}) | Color: {primary_color}")
        else:
             print(f"✅ Using Mock Doctor (Sending to {doc_email})")

        # 3. Get Answers
        if not appointment.preconsulta_answers:
            print("❌ No answers found in 'preconsulta_answers' JSON.")
            return
            
        answers = json.loads(appointment.preconsulta_answers)
        print(f"✅ Found {len(answers)} answers.")

        # 4. Format Answers for Generator (same logic as endpoint)
        formatted_answers = []
        all_questions = db.query(PreconsultationQuestion).all()
        q_map = {str(q.id): q for q in all_questions}
        
        for key, val in answers.items():
            print(f"DEBUG ANSWER: {key} -> {val}")
            q_text = ""
            qid = key
            if key in q_map:
                q_text = q_map[key].text
            
            # Skip summary keys if they already exist
            if key.startswith('summary_'):
                continue

            # Debug: Check if q_text is empty
            if not q_text and len(formatted_answers) < 5:
                print(f"⚠️ Warning: No text found for Question ID: {qid}")

            formatted_answers.append({
                "question_id": qid,
                "text_value": val,
                "question": {"text": q_text}
            })
            
        # 5. Generate Summary
        print("Running ClinicalSummaryGenerator...")
        
        # DEBUG: Scan for critical missing info
        print("\n--- Scanning for Age and Obstetric Data ---")
        keywords = ['nacimiento', 'edad', 'age', 'birth', 'embarazo', 'gesta', 'parto', 'aborto', 'cesarea', 'hijos']
        for fa in formatted_answers:
            text_lower = str(fa['question'].get('text')).lower()
            val_lower = str(fa['text_value']).lower()
            if any(k in text_lower for k in keywords):
                print(f"MATCH: {fa['question_id']} | Text: {text_lower[:50]}... | Value: {fa['text_value']}")
        print("-------------------------------------------\n")

        # Prepare Template Data for Narrative Generator
        template_data = []
        for q in all_questions:
            template_data.append({
                "id": q.id,
                "text": q.text,
                "type": q.type,
                "category": q.category,
                "options": q.options,
                "order": q.order
            })

        summary_data = ClinicalSummaryGenerator.generate(appointment, formatted_answers, template_data=template_data)
        
        # Debug Output
        print("\n--- Summary Data Debug ---")
        for k, v in summary_data.items():
            content = str(v)[:50] + "..." if v else "None/Empty"
            print(f"Key: {k} -> {content}")
        print("--------------------------\n")

        summary_html = summary_data.get('full_narrative_html')
        
        if summary_html:
            print("✅ Summary Generated.")
        else:
            print("⚠️ Summary is empty.")

        # 6. Construct Email Content (NEW TEMPLATE)
        p = answers # Alias for brevity
        
        # Helper to safely get data
        full_name = p.get('full_name', appointment.patient_name)
        ci = p.get('ci', '')
        age = p.get('age', '')
        email = p.get('email', '')
        phone = p.get('phone', '')
        address = p.get('address', '')
        occupation = p.get('occupation', '')
        
        reason = p.get('reason_for_visit') or p.get('gyn_reason') or "No especificado"
        supplements = p.get('supplements') or "Niega"
        
        def fmt(val):
            if isinstance(val, list): return ", ".join(val)
            return val or "Niega"
        
        fh_mother = fmt(p.get('family_history_mother'))
        fh_father = fmt(p.get('family_history_father'))
        ph_personal = fmt(p.get('personal_history'))
        ph_surgical = fmt(p.get('surgical_history'))
        
        obstetric_summary = p.get('summary_gyn_obstetric') or p.get('obstetric_history_summary') or "Sin datos registrados."
        
        def get_func(key): return p.get(f'functional_{key}') or p.get(key) or '-'
        def get_habit(key): return p.get(f'habits_{key}') or p.get(key) or '-'

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

        # 7. Send Email
        print("Sending Email Notification (Directly)...")
        timestamp = datetime.now().strftime("%H:%M:%S")
        send_email_direct(doc_email, f"Preconsulta Completada - GynSys [{timestamp}]", html_content)

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) > 1:
        # Check if arg is number or string
        arg = sys.argv[1]
        if arg.isdigit():
            target = int(arg)
        else:
            target = arg
    else:
        target = "Kira Vargas"
    simulate_notification(target)
