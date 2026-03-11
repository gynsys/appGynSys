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
        "message": "Has recibido un nuevo mensaje de {patient_name}: {message_preview}",
        "logic": lambda c: c.get("role") == "doctor" and c.get("event") == "new_contact_message"
    },
    {
        "type": "doctor_new_online_consultation",
        "category": "doctor",
        "priority": 56,
        "title": "📹 Nueva Consulta Online",
        "message": "Hola {doctor_name}, tienes una nueva consulta online con {patient_name} para el {appointment_date}.",
        "logic": lambda c: c.get("role") == "doctor" and c.get("event") == "new_online_consultation"
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
