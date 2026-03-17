import subprocess
import sys
import os
import re

# Asegurar que se puede importar ssh_runner desde el directorio superior
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from ssh_runner import run_ssh_command
except ImportError:
    print("❌ Error: No se pudo encontrar 'ssh_runner.py' en el directorio superior.")
    sys.exit(1)

def repair_push():
    print("--- 🔧 INICIANDO REPARACIÓN AUTOMÁTICA DE NOTIFICACIONES PUSH ---")
    
    # 1. Obtener el token más reciente de la BD de producción
    print("\n1. Obteniendo token de prueba desde la base de datos...")
    get_token_cmd = 'docker exec appgynsys-db-1 psql -U postgres -d gynsys -t -c "SELECT token FROM push_subscriptions WHERE token IS NOT NULL ORDER BY updated_at DESC LIMIT 1;"'
    token = run_ssh_command(get_token_cmd).strip()
    
    if not token or len(token) < 5:
        print("❌ Error: No se encontró ningún token activo en la base de datos.")
        return

    print(f"✅ Token detectado: {token[:20]}...")

    # 2. Intentar envío directo
    print("\n2. Probando puente de comunicación con Firebase...")
    test_cmd = f"docker exec -w /app -e PYTHONPATH=. appgynsys-backend-1 python -c \"from scripts.test_firebase_direct import test_token_direct; test_token_direct('{token}')\""
    output = run_ssh_command(test_cmd)
    
    # 3. Analizar resultado y reparar si es necesario
    if "ModuleNotFoundError" in output and "firebase_admin" in output:
        print("⚠️  DETECTADO: Falta la librería 'firebase_admin' en el servidor.")
        print("\n3. Iniciando restauración de emergencia...")
        
        print("   -> Instalando en Backend...")
        run_ssh_command("docker exec appgynsys-backend-1 pip install firebase-admin==6.4.0")
        
        print("   -> Instalando en Worker (Celery)...")
        run_ssh_command("docker exec appgynsys-celery_worker-1 pip install firebase-admin==6.4.0")
        
        print("   -> Reiniciando servicios...")
        run_ssh_command("docker restart appgynsys-backend-1 appgynsys-celery_worker-1 appgynsys-celery_beat-1")
        
        print("\n4. Re-intentando prueba de envío...")
        output_retry = run_ssh_command(test_cmd)
        
        if "Successfully sent message" in output_retry:
            print("\n🎉 ¡REPARACIÓN EXITOSA! Revisa tu celular.")
        else:
            print("\n❌ La reparación falló. Error:")
            print(output_retry)
            
    elif "Successfully sent message" in output:
        print("\n✅ El sistema ya está funcionando correctamente. No se requiere reparación.")
        print(f"DEBUG: {output.strip()}")
    else:
        print("\n❌ Se detectó un error diferente. Por favor revisa los logs:")
        print(output)

if __name__ == "__main__":
    repair_push()
