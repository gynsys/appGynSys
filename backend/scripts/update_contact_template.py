import asyncio
import os
import sys

# Add backend directory to sys path if run from root
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.db.base import SessionLocal
from app.db.models.notification import NotificationRule

def update_contact_template():
    # The new beautiful template
    # Remember to use the absolute or relative onboarding link properly
    # Using https://gynsys.net as base.
    
    html_template = """
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px; border-radius: 12px; border: 1px solid #e5e7eb;">
        <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #4F46E5; margin: 0;">Solicitud de Cita Médica</h2>
            <p style="color: #6b7280; margin: 5px 0;">Has recibido un nuevo mensaje desde tu perfil web</p>
        </div>
        
        <div style="background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <p><strong> Paciente:</strong> {patient_name}</p>
            <p><strong> WhatsApp:</strong> {patient_phone}</p>
            <p><strong> Correo:</strong> {patient_email}</p>
            <div style="margin-top: 15px; padding: 15px; background-color: #f3f4f6; border-left: 4px solid #4F46E5; border-radius: 4px;">
                <p style="margin: 0; font-style: italic; color: #374151;">"{full_message}"</p>
            </div>
        </div>

        <div style="text-align: center; margin-top: 30px;">
            <a href="https://wa.me/{patient_phone}?text=Hola%20{patient_name}!%20He%20recibido%20tu%20solicitud%20de%20cita.%20Para%20agendar,%20por%20favor%20ingresa%20aquí:%20https://gynsys.net/{doctor_slug}/onboarding" 
               style="background-color: #25D366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
               Responder por WhatsApp
            </a>
            <br>
            <p style="font-size: 12px; color: #9ca3af; margin-top: 15px;">También puedes responder copiando el enlace de Onboarding en tu panel.</p>
        </div>
    </div>
    """

    db = SessionLocal()
    try:
        rules = db.query(NotificationRule).filter(NotificationRule.notification_type == "doctor_new_contact_message").all()
        for rule in rules:
            rule.message_template = html_template.strip()
        db.commit()
        print(f"Updated {len(rules)} contact message rules successfully.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    update_contact_template()
