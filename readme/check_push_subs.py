from app.db.base import get_db
from app.db.models.push_subscription import PushSubscription
from app.db.models.doctor import Doctor
from app.db.models.cycle_user import CycleUser
from sqlalchemy.orm import Session

def check_subscriptions():
    db_gen = get_db()
    db: Session = next(db_gen)
    try:
        print("\n--- LISTADO DE SUSCRIPCIONES PUSH ACTIVAS ---")
        
        # Suscripciones de Doctores
        doc_subs = db.query(PushSubscription, Doctor.nombre_completo).join(
            Doctor, PushSubscription.doctor_id == Doctor.id
        ).all()
        
        print(f"\nDOCTORES ({len(doc_subs)}):")
        if not doc_subs:
            print("  No hay suscripciones de doctores registradas.")
        for sub, name in doc_subs:
            print(f"  - Doctor: {name} (ID: {sub.doctor_id}) | Registrada: {sub.created_at} | Endpoint: ...{sub.endpoint[-20:]}")

        # Suscripciones de Usuarios (Pacientes)
        user_subs = db.query(PushSubscription, CycleUser.nombre_completo).join(
            CycleUser, PushSubscription.user_id == CycleUser.id
        ).all()
        
        print(f"\nPACIENTES ({len(user_subs)}):")
        if not user_subs:
            print("  No hay suscripciones de pacientes registradas.")
        for sub, name in user_subs:
            print(f"  - Paciente: {name} (ID: {sub.user_id}) | Registrada: {sub.created_at} | Endpoint: ...{sub.endpoint[-20:]}")

        # Suscripciones huérfanas o sin nombre (por si acaso)
        other_subs = db.query(PushSubscription).filter(
            PushSubscription.doctor_id.is_(None),
            PushSubscription.user_id.is_(None)
        ).all()
        if other_subs:
            print(f"\nOTRAS/HUERFANAS ({len(other_subs)}):")
            for sub in other_subs:
                print(f"  - ID: {sub.id} | Registrada: {sub.created_at}")

    finally:
        try:
            next(db_gen)
        except StopIteration:
            pass

if __name__ == "__main__":
    check_subscriptions()
