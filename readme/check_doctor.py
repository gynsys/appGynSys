from app.db.base import get_db
from app.db.models.doctor import Doctor
from app.db.models.notification import NotificationRule

def check():
    db_gen = get_db()
    db = next(db_gen)
    try:
        doctor = db.query(Doctor).filter(Doctor.slug_url == "mariel-herrera").first()
        if not doctor:
            print("Doctor 'mariel-herrera' not found.")
            return
        
        print(f"Doctor Name: {doctor.nombre_completo} | ID: {doctor.id}")
        
        rules = db.query(NotificationRule).filter(NotificationRule.tenant_id == doctor.id).all()
        print(f"Rules for Doctor ID {doctor.id}:")
        for r in rules:
            print(f"  - {r.notification_type} | Active: {r.is_active} | ID: {r.id}")
            
    finally:
        try:
            next(db_gen)
        except StopIteration:
            pass

if __name__ == "__main__":
    check()
