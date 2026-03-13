import os
import sys

# Add current directory to path
sys.path.append(os.getcwd())
if os.path.basename(os.getcwd()) in ["scripts", "readme"]:
    sys.path.append(os.path.dirname(os.getcwd()))

from app.db.base import SessionLocal
from app.db.models.doctor import Doctor
from app.db.models.cycle_user import CycleUser
from app.db.models.push_subscription import PushSubscription
from app.services.notifications import create_or_update_subscription
from app.schemas.notification import PushSubscriptionSchema

def cleanup_and_link(token: str):
    db = SessionLocal()
    try:
        target_token = token.strip()
        print(f"Iniciando limpieza para el token: {target_token[:20]}...")
        
        # 1. Identificar Mariel Herrera
        mariel = db.query(Doctor).filter(Doctor.slug_url == 'mariel-herrera').first()
        if mariel:
            print(f"Limpiando dispositivos antiguos para Doctora Mariel (ID: {mariel.id})...")
            deleted = db.query(PushSubscription).filter(
                PushSubscription.doctor_id == mariel.id,
                PushSubscription.token != target_token
            ).delete(synchronize_session=False)
            print(f"Eliminados: {deleted} dispositivos.")
            
            # Vincular el token correcto
            sub_in = PushSubscriptionSchema(token=target_token)
            create_or_update_subscription(db=db, sub_in=sub_in, doctor_id=mariel.id)
            print("Token vinculado a Mariel Herrera.")

        # 2. Identificar Peta / Petra
        # Buscamos en todos los cycle_users ya que hay pocos y el usuario suele referirse a 'Peta'
        users = db.query(CycleUser).filter(
            (CycleUser.name.ilike('%peta%')) | 
            (CycleUser.name.ilike('%petra%')) |
            (CycleUser.email.ilike('%peta%'))
        ).all()
        
        if not users:
            # Si no encontramos por nombre, limpiamos para TODOS los cycle_users (son solo 2 según vimos)
            users = db.query(CycleUser).all()
            print("No se encontró usuario específico 'Peta', aplicando a todos los usuarios pacientes.")

        for user in users:
            print(f"Limpiando dispositivos para Usuario: {user.name or user.email} (ID: {user.id})...")
            deleted = db.query(PushSubscription).filter(
                PushSubscription.user_id == user.id,
                PushSubscription.token != target_token
            ).delete(synchronize_session=False)
            print(f"Eliminados: {deleted} dispositivos.")
            
            # Vincular el token correcto
            sub_in = PushSubscriptionSchema(token=target_token)
            create_or_update_subscription(db=db, sub_in=sub_in, user_id=user.id)
            print(f"Token vinculado a {user.name or user.email}.")

        db.commit()
        print("¡Mantenimiento completado exitosamente!")
            
    except Exception as e:
        db.rollback()
        print(f"Error durante el mantenimiento: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    TARGET_TOKEN = "fqgpFReoTA6I0q9Rhjpj1S:APA91bEVgF65jJP8VFYgFtdB3f8CclxrF4SrZv0R5NgEbS1S0HTxOvDER3BCF-U7kbzhd4TLhUqWBFaBv7KbXzcMQlm2xWctkleditFFP07NYDgwoqmSfoE"
    cleanup_and_link(TARGET_TOKEN)
