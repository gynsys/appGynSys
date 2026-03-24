import requests
import json
import sys
from datetime import datetime, timedelta

# Configuration
BASE_URL = "https://api.gynsys.net/api/v1"
DOCTOR_SLUG = "mariel-herrera"

def test_unified_onboarding(slug=DOCTOR_SLUG):
    print(f"🚀 Iniciando prueba para: {slug}")
    
    # 1. Get Questions
    print(f"--- 1. Obteniendo preguntas de preconsulta...")
    try:
        q_resp = requests.get(f"{BASE_URL}/onboarding/questions/{slug}")
        q_resp.raise_for_status()
        questions = q_resp.json()
        print(f"✅ {len(questions)} preguntas encontradas.")
    except Exception as e:
        print(f"❌ Error al obtener preguntas: {e}")
        return

    # 2. Construct Payload
    print(f"--- 2. Construyendo payload de prueba...")
    
    # Future date (tomorrow at 10:00 AM)
    tomorrow = datetime.now() + timedelta(days=1)
    app_date = tomorrow.replace(hour=10, minute=0, second=0, microsecond=0).isoformat() + "Z"
    
    # Simulate some answers
    answers = {}
    for q in questions[:5]: # Respond to first 5
        if q['type'] == 'boolean':
            answers[str(q['id'])] = "Si"
        elif q['type'] == 'number':
            answers[str(q['id'])] = "25"
        else:
            answers[str(q['id'])] = "Respuesta de prueba automatizada"

    payload = {
        "patient_data": {
            "patient_name": "Test Automatizado Antigravity",
            "patient_dni": f"TEST-{int(datetime.now().timestamp())}",
            "patient_email": "test@gynsys.net",
            "patient_phone": "123456789",
            "patient_age": 30,
            "residence": "Ciudad de Prueba",
            "occupation": "Tester"
        },
        "appointment_data": {
            "appointment_date": app_date,
            "appointment_type": "Consulta Médica (Test)",
            "reason_for_visit": "Prueba de Integración Chatbot",
            "location": "Sede Principal"
        },
        "answers": answers
    }

    # 3. Submit
    print(f"--- 3. Enviando sumisión unificada...")
    try:
        start_time = datetime.now()
        s_resp = requests.post(
            f"{BASE_URL}/onboarding/submit/{slug}",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        duration = (datetime.now() - start_time).total_seconds()
        
        if s_resp.status_code == 200:
            print(f"✅ ÉXITO en {duration}s!")
            print(f"Response: {json.dumps(s_resp.json(), indent=2)}")
        else:
            print(f"❌ FALLO (Status {s_resp.status_code})")
            print(f"Error detail: {s_resp.text}")
    except Exception as e:
        print(f"❌ Error durante el envío: {e}")

if __name__ == "__main__":
    slug = sys.argv[1] if len(sys.argv) > 1 else DOCTOR_SLUG
    test_unified_onboarding(slug)
