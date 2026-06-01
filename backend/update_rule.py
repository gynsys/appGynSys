from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

DATABASE_URL = "postgresql://postgres:GynsysDB2026!Secure@db:5432/gynsys"
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
session = Session()

html_template = """<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px; border-radius: 12px; border: 1px solid #e5e7eb;">
    <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #4F46E5; margin: 0;">Preconsulta Completada</h2>
        <p style="color: #6b7280; margin: 5px 0;">{patient_name} ha completado su formulario de preconsulta</p>
    </div>
    
    <div style="background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <p><strong>Cita:</strong> {appointment_date}</p>
        <div style="margin-top: 15px; padding: 15px; background-color: #f3f4f6; border-left: 4px solid #4F46E5; border-radius: 4px;">
            <h3 style="margin-top:0; color: #374151;">Resumen IA de la Preconsulta</h3>
            <div style="color: #374151; font-size: 14px; line-height: 1.5;">
                {summary_html}
            </div>
        </div>
    </div>

    <div style="text-align: center; margin-top: 30px;">
        <a href="https://gynsys.net/dashboard/consultation" 
           style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
           Ir al Dashboard
        </a>
    </div>
</div>"""

text_template = "{patient_name} ha completado su preconsulta para la cita del {appointment_date}."

# We need to update the NotificationRule table
session.execute(text(
    "UPDATE notification_rules SET message_template = :html, message_text_template = :txt WHERE notification_type = 'doctor_preconsulta_completed'"),
    {"html": html_template, "txt": text_template}
)
session.commit()
print("Rule updated successfully.")
