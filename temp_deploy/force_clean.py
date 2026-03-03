import sys
import os

# Fuerza a Python a mirar en la carpeta /app para que encuentre el módulo 'app'
# independientemente del directorio de trabajo actual
sys.path.insert(0, "/app")
os.environ["PYTHONPATH"] = "/app"

try:
    from sqlalchemy import text
    from app.db.base import SessionLocal
    from app.db.models.notification import NotificationRule, PendingNotification
    from app.seeds.notification_rules import seed_notification_rules
except Exception as e:
    print(f"Error importing modules: {e}")
    sys.exit(1)

def run():
    try:
        db = SessionLocal()
        print("Connected to DB.")
    except Exception as e:
        print(f"Error connecting to DB: {e}")
        sys.exit(1)

    print("1. Borrando reglas prenatales semanales (1 a 41)...")
    rule_ids = db.query(NotificationRule.id).filter(
        NotificationRule.notification_type.like("prenatal_week_%")
    ).all()
    rule_ids = [r[0] for r in rule_ids]
    
    if rule_ids:
        deleted_pending = db.query(PendingNotification).filter(
            PendingNotification.notification_rule_id.in_(rule_ids)
        ).delete(synchronize_session=False)
        print(f"Borradas {deleted_pending} notificaciones pendientes en cola relacionadas.")

    deleted = db.query(NotificationRule).filter(
        NotificationRule.notification_type.like("prenatal_week_%")
    ).delete(synchronize_session=False)
    db.commit()
    print(f"Borradas {deleted} reglas obsoletas.")

    print("2. Creando notificaciones globales para el Dashboard...")
    seed_notification_rules(db, None)

    print("3. Actualizando notificaciones de Doctores...")
    tenants = db.execute(text("SELECT id FROM doctors")).fetchall()
    for t in tenants:
        seed_notification_rules(db, t[0])

    print("¡Limpieza y actualización completadas!")

if __name__ == "__main__":
    run()
