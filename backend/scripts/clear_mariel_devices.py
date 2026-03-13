import sys
from sqlalchemy import text
from app.db.base import SessionLocal
from app.db.models.doctor import Doctor
from app.db.models.push_subscription import PushSubscription

def clear_mariel_devices():
    print("Iniciando purga de dispositivos para Mariel Herrera...")
    db = SessionLocal()
    try:
        # 1. Identificar Mariel Herrera
        mariel = db.query(Doctor).filter(Doctor.slug_url == 'mariel-herrera').first()
        if not mariel:
            print("No se encontró a la doctora Mariel Herrera.")
            return

        print(f"Doctora encontrada (ID: {mariel.id}). Eliminando todos sus dispositivos...")
        
        deleted = db.query(PushSubscription).filter(
            PushSubscription.doctor_id == mariel.id
        ).delete(synchronize_session=False)
        
        db.commit()
        print(f"Éxito: Se eliminaron {deleted} dispositivos.")
             
    except Exception as e:
        db.rollback()
        print(f"Error durante la purga: {str(e)}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    clear_mariel_devices()
