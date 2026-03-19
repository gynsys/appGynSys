import sys
import os

# Add /app to path if running inside docker
sys.path.insert(0, '/app')
os.environ["PYTHONPATH"] = "/app"

from app.db.base import SessionLocal
from app.db.models.notification import NotificationRule
from app.services.notifications.registry import NOTIFICATION_MAP

def patch_rhythm_templates():
    db = SessionLocal()
    try:
        print("Buscando reglas del método del ritmo con plantillas vacías...")
        
        # Obtener todas las reglas que empiezan con 'rhythm'
        rules = db.query(NotificationRule).filter(
            NotificationRule.notification_type.like('rhythm%')
        ).all()
        
        patched_count = 0
        for rule in rules:
            # Si el título o el cuerpo están vacíos/None, los restauramos desde el registro
            if not rule.title_template or not rule.message_text_template or not rule.message_template:
                registry_def = NOTIFICATION_MAP.get(rule.notification_type)
                if registry_def:
                    print(f"Parcheando regla {rule.notification_type}...")
                    if not rule.title_template:
                        rule.title_template = registry_def["title"]
                    if not rule.message_template:
                        rule.message_template = registry_def["message"]
                    if not rule.message_text_template:
                        rule.message_text_template = registry_def["message"]
                    
                    patched_count += 1
                else:
                    print(f"Advertencia: No se encontró definición en el registro para {rule.notification_type}")
        
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
    patch_rhythm_templates()
