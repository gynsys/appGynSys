from app.db.base import get_db
from app.db.models.doctor import Doctor
import json

def get_mariel_info():
    db_gen = get_db()
    db = next(db_gen)
    try:
        doctor = db.query(Doctor).filter(Doctor.slug_url == "mariel-herrera").first()
        if not doctor:
            print("Doctor 'mariel-herrera' not found.")
            return
        
        # Look for any phone-like fields or WhatsApp
        info = {
            "nombre_completo": doctor.nombre_completo,
            "whatsapp_url": doctor.whatsapp_url,
            "email": doctor.email,
            "contact_email": doctor.contact_email,
            "id": doctor.id
        }
        
        # Check if there's a phone in any JSON/JSONB fields if they exist
        # Based on my view of doctor.py, there's no 'phone' column.
        
        print(json.dumps(info, indent=2))
            
    finally:
        try:
            next(db_gen)
        except StopIteration:
            pass

if __name__ == "__main__":
    get_mariel_info()
