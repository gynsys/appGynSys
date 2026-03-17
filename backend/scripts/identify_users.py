from app.db.base import SessionLocal
from app.db.models.doctor import Doctor
from app.db.models.cycle_user import CycleUser
import json

db = SessionLocal()
try:
    doc = db.query(Doctor).filter(Doctor.id == 1).first()
    pat = db.query(CycleUser).filter(CycleUser.id == 34).first()
    
    results = {
        "doctor_1": {
            "id": doc.id if doc else None,
            "email": doc.email if doc else None,
            "name": doc.nombre_completo if doc else None
        },
        "patient_34": {
            "id": pat.id if pat else None,
            "email": pat.email if pat else None,
            "name": pat.nombre_completo if pat else None
        }
    }
    print(json.dumps(results, indent=2))
finally:
    db.close()
