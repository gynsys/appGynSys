import os
import sys

# Add current directory to path
sys.path.append(os.getcwd())
if os.path.basename(os.getcwd()) == "scripts":
    sys.path.append(os.path.dirname(os.getcwd()))

from app.db.base import SessionLocal
from app.db.models.doctor import Doctor
from app.db.models.cycle_user import CycleUser
from app.services.notifications import create_or_update_subscription
from app.schemas.notification import PushSubscriptionSchema

def link_token(type: str, identifier: str, token: str):
    db = SessionLocal()
    try:
        print(f"Buscando {type} con identificador: {identifier}...")
        
        user_id = None
        doctor_id = None
        
        if type == "doctor":
            actor = db.query(Doctor).filter(Doctor.slug_url == identifier).first()
            if not actor:
                print(f"Error: Doctor con slug '{identifier}' no encontrado.")
                return
            doctor_id = actor.id
            print(f"Encontrado Doctor: {actor.nombre_completo} (ID: {doctor_id})")
        else:
            actor = db.query(CycleUser).filter(CycleUser.email == identifier).first()
            if not actor:
                # Intento por nombre si es Petra/Peta
                actor = db.query(CycleUser).filter(CycleUser.name.ilike(f"%{identifier}%")).first()
                if not actor:
                    print(f"Error: Usuario '{identifier}' no encontrado.")
                    return
            user_id = actor.id
            print(f"Encontrado Usuario: {actor.name or actor.email} (ID: {user_id})")
            
        sub_in = PushSubscriptionSchema(token=token)
        
        print(f"Vínculando token: {token[:20]}...")
        sub = create_or_update_subscription(
            db=db,
            sub_in=sub_in,
            user_id=user_id,
            doctor_id=doctor_id
        )
        
        if sub:
            print(f"¡ÉXITO! Suscripción {sub.id} vinculada/actualizada correctamente.")
            print(f"Actualizado en: {sub.updated_at}")
        else:
            print("Error al crear/actualizar la suscripción.")
            
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Uso: python scripts/register_token_manual.py [doctor|user] [slug|email|name] [token]")
        sys.exit(1)
        
    link_token(sys.argv[1], sys.argv[2], sys.argv[3])
