import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import redis

# Add the app directory to sys.path to allow imports
sys.path.append(os.getcwd())

# Import config for VAPID keys
try:
    from app.core.config import settings
    from app.db.models.notification import NotificationRule, VALID_NOTIFICATION_TYPES
    from app.core.celery_app import celery_app
except ImportError as e:
    print(f"❌ Error importing app modules: {e}")
    sys.exit(1)

def run_diagnosis():
    print("🔍 INICIANDO DIAGNÓSTICO DEL SISTEMA DE NOTIFICACIONES\n")
    
    # 1. DATABASE CONNECTION
    print("--- 1. Conexión a Base de Datos ---")
    try:
        engine = create_engine(settings.DATABASE_URL)
        SessionLocal = sessionmaker(bind=engine)
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        print("✅ Conexión exitosa a la base de datos.")
    except Exception as e:
        print(f"❌ Error de conexión DB: {e}")
        return

    # 2. DOCTORS / TENANTS CHECK
    print("\n--- 2. Doctores Detectados (Tenants) ---")
    try:
        doctors = db.execute(text("SELECT id, slug_url, nombre_completo FROM doctors")).fetchall()
        for doc in doctors:
            print(f"   👤 Doctor ID {doc.id}: {doc.nombre_completo} ({doc.slug_url})")
        doctor_count = len(doctors)
    except Exception as e:
        print(f"❌ Error consultando doctores: {e}")
        db.close()
        return

    # 3. NOTIFICATION RULES CHECK
    print(f"\n--- 3. Reglas de Notificación (Total: {doctor_count} docs) ---")
    try:
        rules = db.query(NotificationRule).all()
        count = len(rules)
        expected_per_doc = len(VALID_NOTIFICATION_TYPES)
        total_expected = expected_per_doc * doctor_count
        
        print(f"📊 Reglas encontradas: {count} (Esperadas: {total_expected} - {expected_per_doc} p/doc)")
        
        if count >= total_expected:
            print(f"✅ Todas las reglas están presentes para los {doctor_count} doctores.")
        else:
            print(f"⚠️ Discrepancia en el número total de reglas. Faltan: {total_expected - count}")
            # Identify missing types globally for debug
            existing_types = set([r.notification_type for r in rules])
            missing = [t for t in VALID_NOTIFICATION_TYPES if t not in existing_types]
            if missing:
                print(f"❌ Tipos de reglas faltantes en el sistema:")
                for m in missing:
                    print(f"   - Faltante: {m}")
    except Exception as e:
        print(f"❌ Error consultando reglas: {e}")

    # 4. REDIS / CELERY BROKER CHECK
    print("\n--- 4. Conectividad Celery / Redis ---")
    try:
        r = redis.from_url(settings.CELERY_BROKER_URL)
        r.ping()
        print(f"✅ Conexión exitosa a Redis Broker ({settings.CELERY_BROKER_URL})")
    except Exception as e:
        print(f"❌ Error conectando a Redis/Celery: {e}")

    # 5. VAPID KEYS FOR PUSH
    print("\n--- 5. Configuración VAPID (Push Notifications) ---")
    if settings.VAPID_PUBLIC_KEY and settings.VAPID_PRIVATE_KEY:
        print("✅ VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY detectadas.")
    else:
        print("❌ Faltan llaves VAPID en el entorno (.env).")

    # 6. PENDING QUEUE CHECK
    print("\n--- 6. Cola de Notificaciones Pendientes ---")
    try:
        pending_count = db.execute(text("SELECT COUNT(*) FROM pending_notifications WHERE status = 'scheduled'")).scalar()
        print(f"✉️ Notificaciones programadas para envío: {pending_count}")
        
        failed_count = db.execute(text("SELECT COUNT(*) FROM pending_notifications WHERE status = 'failed'")).scalar()
        if failed_count > 0:
            print(f"⚠️ Notificaciones fallidas detectadas: {failed_count}")
    except Exception as e:
        print(f"❌ Error consultando cola: {e}")

    db.close()
    print("\n🏁 DIAGNÓSTICO FINALIZADO")

if __name__ == "__main__":
    run_diagnosis()
