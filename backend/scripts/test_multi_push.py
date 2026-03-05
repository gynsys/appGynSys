import sys
import os
sys.path.insert(0, "/app")
os.environ["PYTHONPATH"] = "/app"

from app.db.base import SessionLocal
from app.db.models.doctor import Doctor
from app.services.push_service import send_push_to_actor

def test_multi_device_push():
    db = SessionLocal()
    try:
        # Doctor 1 (Mariel)
        doctor = db.query(Doctor).filter(Doctor.id == 1).first()
        if not doctor:
            print("❌ Doctora no encontrada.")
            return

        print(f"🚀 Iniciando prueba multi-dispositivo para: {doctor.nombre_completo}")
        num_subs = len(doctor.push_subscriptions)
        print(f"📱 Dispositivos detectados: {num_subs}")

        if num_subs == 0:
            print("⚠️ No hay dispositivos vinculados. Por favor, dale al botón 'Activar en este móvil' en tus teléfonos.")
            return

        # Simular una nueva cita
        res = send_push_to_actor(
            actor=doctor,
            title="🆕 NUEVA CITA (PRUEBA)",
            body=f"Prueba de GynSys: Este aviso debe llegar a tus {num_subs} teléfonos vinculados.",
            data={"url": "/admin/appointments", "tag": "test-multi-device"}
        )
        
        print(f"✅ Resultado del envío: {res}")
        if res.get("success"):
            print("✨ ¡Revisa tus teléfonos! Deberían haber vibrado todos.")
        else:
            print("❌ El envío falló o no hay dispositivos activos.")

    except Exception as e:
        print(f"💥 Error en la prueba: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_multi_device_push()
