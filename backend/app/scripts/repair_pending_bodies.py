import sys
import os
from sqlalchemy.orm import Session, joinedload

# Setup path for container
sys.path.insert(0, '/app')
os.environ["PYTHONPATH"] = "/app"

from app.db.base import SessionLocal
from app.db.models.notification import PendingNotification, NotificationRule
from app.services.notifications.sender import safe_render_content
from app.db.models.cycle_user import CycleUser
from app.db.models.doctor import Doctor
from app.db.models.cycle_predictor import PregnancyLog

def repair_pending():
    db = SessionLocal()
    try:
        print("Buscando notificaciones pendientes con cuerpo vacío...")
        pending = db.query(PendingNotification).options(
            joinedload(PendingNotification.rule),
            joinedload(PendingNotification.recipient),
            joinedload(PendingNotification.doctor)
        ).filter(
            PendingNotification.status == 'pending',
            (PendingNotification.message_text == None) | (PendingNotification.message_text == '')
        ).all()
        
        print(f"Encontradas {len(pending)} notificaciones para reparar.")
        
        repaired_count = 0
        for item in pending:
            if not item.rule:
                continue
            
            actor = item.recipient or item.doctor
            if not actor:
                continue
                
            render_vars = {"patient_name": actor.nombre_completo or "Usuario"}
            rendered = safe_render_content(item.rule, render_vars)
            
            if rendered:
                item.body = rendered["message_html"]
                item.message_text = rendered["message_text"]
                repaired_count += 1
                print(f"Reparada ID {item.id} (Tipo: {item.rule.notification_type})")
        
        if repaired_count > 0:
            db.commit()
            print(f"Éxito: Se repararon {repaired_count} notificaciones.")
        else:
            print("No se realizaron reparaciones.")
            
    except Exception as e:
        print(f"Error durante la reparación: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    repair_pending()
