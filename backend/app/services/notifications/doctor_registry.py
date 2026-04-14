from typing import List, Dict, Any
from .base import logger

# --- Doctor Registry Definition (Decoupled from Mi Ciclo) ---
DOCTOR_NOTIFICATION_REGISTRY: List[Dict[str, Any]] = [
    {
        "type": "doctor_daily_agenda",
        "category": "doctor",
        "priority": 50,
        "title": "🌅 Resumen Matutino",
        "message": "¡Buenos días, Dra! Hoy tienes {appointment_count} citas programadas. La primera es a las {first_appointment_time}.",
        "logic": lambda c: c.get("role") == "doctor" and c.get("appointment_count", 0) > 0
    },
    {
        "type": "doctor_pending_stories",
        "category": "doctor",
        "priority": 51,
        "title": "📝 Historias Pendientes",
        "message": "Tienes {pending_count} historias clínicas del día de hoy esperando por tus notas finales.",
        "logic": lambda c: c.get("role") == "doctor" and c.get("pending_count", 0) > 0
    },
    {
        "type": "doctor_low_agenda",
        "category": "doctor",
        "priority": 52,
        "title": "⚠️ Alerta de Agenda",
        "message": "Tu agenda de la próxima semana está al {occupancy_percent}%. ¿Deseas enviar recordatorios de chequeo anual?",
        "logic": lambda c: c.get("role") == "doctor" and c.get("occupancy_percent", 100) < 40 and c.get("day_of_week") == 5 # Viernes
    },
    {
        "type": "doctor_new_appointment",
        "category": "doctor",
        "priority": 53,
        "title": "📅 Nueva Cita Agendada",
        "message": "Hola {doctor_name}, tienes una nueva cita de {patient_name} para el {appointment_date}.",
        "logic": lambda c: c.get("role") == "doctor" and c.get("event") == "new_appointment"
    },
    {
        "type": "doctor_preconsulta_completed",
        "category": "doctor",
        "priority": 54,
        "title": "📝 Preconsulta Completada",
        "message": "{patient_name} ha completado su preconsulta para la cita del {appointment_date}.",
        "logic": lambda c: c.get("role") == "doctor" and c.get("event") == "preconsulta_completed"
    },
    {
        "type": "doctor_new_contact_message",
        "category": "doctor",
        "priority": 55,
        "title": "📨 Nuevo Mensaje de Contacto",
        "message": """<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px; border-radius: 12px; border: 1px solid #e5e7eb;">
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
        <p style="font-size: 12px; color: #9ca3af; margin-top: 15px;">También puedes responder usando el Asistente en tu panel.</p>
    </div>
</div>""",
        "logic": lambda c: c.get("role") == "doctor" and c.get("event") == "new_contact_message"
    },
    {
        "type": "doctor_new_online_consultation",
        "category": "doctor",
        "priority": 56,
        "title": "📹 Nueva Consulta Online",
        "message": "Hola {doctor_name}, tienes una nueva consulta online con {patient_name} para el {appointment_date}.",
        "logic": lambda c: c.get("role") == "doctor" and c.get("event") == "new_online_consultation"
    },
    {
        "type": "doctor_unified_onboarding",
        "category": "doctor",
        "priority": 57,
        "title": "✨ Onboarding Unificado Finalizado",
        "message": "¡Buenas noticias! {patient_name} ha completado el onboarding unificado (Cita + Preconsulta).",
        "logic": lambda c: c.get("role") == "doctor" and c.get("event") == "unified_onboarding"
    }
]

DOCTOR_NOTIFICATION_MAP = { n["type"]: n for n in DOCTOR_NOTIFICATION_REGISTRY }

def evaluate_doctor_rule(rule_def: dict, context: dict) -> bool:
    """
    Evalúa si una regla de doctor debe dispararse.
    Independiente de los ajustes de CycleUser.
    """
    try:
        # Por ahora los doctores reciben todo si la lógica se cumple.
        # En el futuro aquí se validarán los ajustes específicos del doctor.
        return rule_def["logic"](context)
    except Exception as e:
        logger.error(f"Error ejecutando lógica de regla de doctor {rule_def.get('type')}: {e}")
        return False
