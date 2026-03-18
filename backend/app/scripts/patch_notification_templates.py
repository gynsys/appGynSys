import sys
import os

# Add /app to path if running inside docker
sys.path.insert(0, '/app')
os.environ["PYTHONPATH"] = "/app"

from app.db.base import SessionLocal
from app.db.models.notification import NotificationRule
from app.services.notifications.registry import NOTIFICATION_MAP

def patch_missing_templates():
    db = SessionLocal()
    try:
        print("Buscando reglas de notificación con plantillas faltantes...")
        
        # Obtener todas las reglas globales
        rules = db.query(NotificationRule).filter(
            NotificationRule.tenant_id == None
        ).all()
        
        patched_count = 0
        for rule in rules:
            # Revisar si falta alguna plantilla
            needs_patch = not rule.message_text_template or not rule.message_template
            
            if needs_patch:
                registry_def = NOTIFICATION_MAP.get(rule.notification_type)
                if registry_def:
                    print(f"Parcheando regla {rule.notification_type}...")
                    
                    if not rule.message_template:
                        rule.message_template = registry_def["message"]
                        print(f"  - Restaurado HTML template")
                        
                    if not rule.message_text_template:
                        rule.message_text_template = registry_def["message"]
                        print(f"  - Restaurado Text template")
                    
                    patched_count += 1
                else:
                    # Si no está en el registro, al menos copiamos de HTML a TEXT si uno existe
                    if rule.message_template and not rule.message_text_template:
                        print(f"Propagando HTML a TEXT para {rule.notification_type} (regla custom/fuera de registro)")
                        rule.message_text_template = rule.message_template
                        patched_count += 1
        
        if patched_count > 0:
            db.commit()
            print(f"Éxito: Se parchearon {patched_count} reglas.")
        else:
            print("No se encontraron reglas que requieran parcheo.")
            
    except Exception as e:
        print(f"Error durante el parcheo: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    patch_missing_templates()
