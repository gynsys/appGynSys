import sys
import os

# Base directory - In Docker /app is the root for the app module
sys.path.insert(0, os.getcwd())
# Also try parent just in case of different execution context
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db.session import SessionLocal
from app.db.models.notification import NotificationRule
from app.services.notifications import NOTIFICATION_REGISTRY

def sync_global_rules():
    db = SessionLocal()
    try:
        print("Sincronizando reglas de notificación...")
        
        # 1. Sincronizar reglas GLOBALES (tenant_id IS NULL)
        existing_global_types = {r.notification_type for r in db.query(NotificationRule.notification_type).filter(NotificationRule.tenant_id.is_(None)).all()}
        
        added_global = 0
        for rule_def in NOTIFICATION_REGISTRY:
            if rule_def["type"] not in existing_global_types:
                # Add missing rule
                new_rule = NotificationRule(
                    notification_type=rule_def["type"],
                    title_template=rule_def["title"],
                    message_template=rule_def["message"],
                    message_text_template=rule_def["message"], 
                    channel="dual",
                    priority=rule_def["priority"],
                    send_time="08:00",
                    is_active=True,
                    tenant_id=None
                )
                db.add(new_rule)
                print(f"✅ Agregada regla global: {rule_def['type']}")
                added_global += 1
        
        db.commit()
        print(f"Sincronización global completada. Se agregaron {added_global} nuevas reglas.")

        # 2. Sincronizar reglas para INQUILINOS EXISTENTES (Opcional, pero recomendado)
        # Si quieres que aparezcan de una vez para todos los doctores:
        from app.db.models.doctor import Doctor
        doctores = db.query(Doctor).filter(Doctor.is_active == True).all()
        
        added_tenant = 0
        for doc in doctores:
            existing_doc_types = {r.notification_type for r in db.query(NotificationRule.notification_type).filter(NotificationRule.tenant_id == doc.id).all()}
            for rule_def in NOTIFICATION_REGISTRY:
                if rule_def["category"] == "doctor" and rule_def["type"] not in existing_doc_types:
                    new_rule = NotificationRule(
                        notification_type=rule_def["type"],
                        title_template=rule_def["title"],
                        message_template=rule_def["message"],
                        message_text_template=rule_def["message"],
                        channel="dual",
                        priority=rule_def["priority"],
                        send_time="08:00",
                        is_active=True,
                        tenant_id=doc.id
                    )
                    db.add(new_rule)
                    added_tenant += 1
        
        db.commit()
        if added_tenant > 0:
            print(f"✅ Se agregaron {added_tenant} reglas específicas a los inquilinos existentes.")

    except Exception as e:
        print(f"❌ Error durante la sincronización: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    sync_global_rules()
