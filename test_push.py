
import os
import sys
import django
import logging

# Configurar entorno Django
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.core.settings')
django.setup()

from django.conf import settings
from backend.app.services.push_service import send_push_notification
from backend.app.models import DeviceToken, Doctor

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_push_to_doctor(doctor_slug: str):
    try:
        doctor = Doctor.objects.get(slug_url=doctor_slug)
        tokens = DeviceToken.objects.filter(doctor=doctor)
        
        if not tokens.exists():
            print(f"❌ No se encontraron dispositivos vinculados para el doctor: {doctor_slug}")
            return

        print(f"🚀 Enviando notificación de prueba a {tokens.count()} dispositivo(s) de {doctor_slug}...")
        
        for token_obj in tokens:
            result = send_push_notification(
                token=token_obj.token,
                title="🧪 Prueba Directa GynSys",
                body="¡Felicidades! Tu móvil está correctamente vinculado y listo para recibir alertas.",
                data={"url": f"/dr/{doctor_slug}/dashboard"}
            )
            if result:
                print(f"✅ Notificación enviada con éxito al token: {token_obj.token[:15]}...")
            else:
                print(f"❌ Falló el envío al token: {token_obj.token[:15]}...")

    except Doctor.DoesNotExist:
        print(f"❌ El doctor con slug '{doctor_slug}' no existe.")
    except Exception as e:
        print(f"❌ Error durante la prueba: {str(e)}")

if __name__ == "__main__":
    # Por defecto probamos con mariel-herrera
    target = "mariel-herrera"
    if len(sys.argv) > 1:
        target = sys.argv[1]
    
    test_push_to_doctor(target)
