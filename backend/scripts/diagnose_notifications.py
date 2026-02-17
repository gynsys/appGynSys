import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import redis

# Add the app directory to sys.path to allow imports
sys.path.append(os.getcwd())

# Import config
try:
    from app.core.config import settings
    from app.db.models.notification import NotificationRule, VALID_NOTIFICATION_TYPES
    from app.core.notifications.registry import NOTIFICATION_REGISTRY
except ImportError as e:
    print(f"Error importing app modules: {e}")
    sys.exit(1)

def run_diagnosis():
    print("SEARCHING: INICIANDO DIAGNOSTICO DEL SISTEMA DE NOTIFICACIONES (Modelo App Cerrada)\n")
    
    # 1. DATABASE CONNECTION
    print("--- 1. Conexion a Base de Datos ---")
    try:
        # Override with localhost if needed for running outside docker
        db_url = settings.DATABASE_URL
        if "db" in db_url and os.name == 'nt':
            db_url = db_url.replace("db", "localhost").replace("5432", "5433")
            
        engine = create_engine(db_url)
        SessionLocal = sessionmaker(bind=engine)
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        print(f"OK: Conexion exitosa a la base de datos ({db_url}).")
    except Exception as e:
        print(f"ERROR: Error de conexion DB: {e}")
        return

    # 2. DOCTORS / TENANTS CHECK (Read-only now)
    print("\n--- 2. Doctores Detectados (Tenants) ---")
    try:
        doctors = db.execute(text("SELECT id, slug_url, nombre_completo FROM doctors")).fetchall()
        for doc in doctors:
            print(f"   Doctor ID {doc.id}: {doc.nombre_completo} ({doc.slug_url})")
        doctor_count = len(doctors)
    except Exception as e:
        print(f"ERROR: Error consultando doctores: {e}")
        db.close()
        return

    # 3. GLOBAL NOTIFICATION RULES CHECK
    print(f"\n--- 3. Reglas de Notificacion GLOBALES ---")
    try:
        # Query global rules (tenant_id IS NULL)
        rules = db.query(NotificationRule).filter(NotificationRule.tenant_id == None).all()
        count = len(rules)
        expected = len(NOTIFICATION_REGISTRY)
        
        print(f"Stats: Reglas globales encontradas: {count} (Esperadas en Registro: {expected})")
        
        if count == expected:
            print(f"OK: El numero de reglas coincide perfectamente con el registro ({expected}).")
        else:
            print(f"WARNING: Discrepancia detectada. Registro: {expected}, DB: {count}")
            
        # Check for specific types
        existing_types = set([r.notification_type for r in rules])
        missing_registry = [r["type"] for r in NOTIFICATION_REGISTRY if r["type"] not in existing_types]
        
        if missing_registry:
            print(f"ERROR: Tipos de reglas faltantes en DB (estan en Registro):")
            for m in missing_registry:
                print(f"   - Faltante: {m}")
        else:
            print("OK: Todos los tipos del registro estan presentes en la DB.")

    except Exception as e:
        print(f"ERROR: Error consultando reglas: {e}")

    # 4. REDIS / CELERY BROKER CHECK
    print("\n--- 4. Conectividad Celery / Redis ---")
    try:
        redis_url = settings.CELERY_BROKER_URL
        if "://redis" in redis_url and os.name == 'nt':
            redis_url = redis_url.replace("://redis", "://localhost")
            
        r = redis.from_url(redis_url)
        r.ping()
        print(f"OK: Conexion exitosa a Redis Broker ({redis_url})")
    except Exception as e:
        print(f"ERROR: Error conectando a Redis/Celery: {e}")

    # 5. VAPID KEYS FOR PUSH
    print("\n--- 5. Configuracion VAPID (Push Notifications) ---")
    if settings.VAPID_PUBLIC_KEY and settings.VAPID_PRIVATE_KEY:
        print("OK: VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY detectadas.")
    else:
        print("ERROR: Faltan llaves VAPID en el entorno (.env).")

    # 6. PENDING QUEUE CHECK
    print("\n--- 6. Cola de Notificaciones Pendientes ---")
    try:
        # Check both 'pending' and 'sent' statuses
        pending_count = db.execute(text("SELECT COUNT(*) FROM pending_notifications WHERE status = 'pending'")).scalar()
        print(f"Pending: Notificaciones pendientes: {pending_count}")
        
        sent_count = db.execute(text("SELECT COUNT(*) FROM pending_notifications WHERE status = 'sent'")).scalar()
        print(f"Sent: Notificaciones enviadas hoy (aprox): {sent_count}")
        
        failed_count = db.execute(text("SELECT COUNT(*) FROM pending_notifications WHERE status = 'failed'")).scalar()
        if failed_count > 0:
            print(f"WARNING: Notificaciones fallidas detectadas: {failed_count}")
        else:
            print("OK: No hay fallos detectados en la cola.")
    except Exception as e:
        print(f"ERROR: Error consultando cola: {e}")

    db.close()
    print("\nFIN: DIAGNOSTICO FINALIZADO")

if __name__ == "__main__":
    run_diagnosis()
