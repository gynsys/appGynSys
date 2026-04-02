import sys
import os
from sqlalchemy import text

# Determinar la raíz del backend dinámicamente
current_file = os.path.abspath(__file__)
backend_root = os.path.dirname(os.path.dirname(current_file))
sys.path.insert(0, backend_root)

# FORZAR DATABASE_URL LOCAL (según .env del usuario)
os.environ["DATABASE_URL"] = "postgresql://postgres:gyn13409534@127.0.0.1:5433/gynsys"

print(f"DEBUG: Sys Path pronto con: {backend_root}")
print(f"DEBUG: DATABASE_URL forzada a local (Puerto 5433).")

try:
    from app.db.base import SessionLocal
    from app.db.models.campaign import CampaignContact
    print("DEBUG: Imports de modelos exitosos.")
except ImportError as e:
    print(f"ERROR: No se pudo importar los módulos de la app: {e}")
    sys.exit(1)

def cleanup():
    db = SessionLocal()
    try:
        # Test de conexión con sintaxis SQLAlchemy 2.0
        db.execute(text("SELECT 1"))
        print("DEBUG: Conexión a Base de Datos de Producción Local Exitosa.")

        # 1. Buscar contactos con errores tipográficos ('B vs C')
        # Específicamente el caso reportado: unicobnc20
        typo_contacts = db.query(CampaignContact).filter(
            CampaignContact.email.ilike('%unicobnc20%')
        ).all()
        
        print(f"Encontrados {len(typo_contacts)} contactos con el error tipográfico 'unicobnc20'.")
        for c in typo_contacts:
            print(f" - Eliminando Permanentemente (Hard Delete): {c.full_name} ({c.email})")
            db.delete(c)

        # 2. Buscar contactos que usan el correo del doctor (Redirección Fantasma)
        doctor_email = 'milanopabloe@gmail.com'
        doctor_contacts = db.query(CampaignContact).filter(
            CampaignContact.email == doctor_email
        ).all()
        
        print(f"Encontrados {len(doctor_contacts)} contactos usando el correo del doctor ({doctor_email}).")
        for c in doctor_contacts:
            # Los eliminamos de la lista de difusión para evitar ruidos de redirección
            print(f" - Eliminando contacto de difusión erróneo: {c.full_name} ({c.email})")
            db.delete(c)

        db.commit()
        print("Mantenimiento de base de datos finalizado con éxito.")
        
    except Exception as e:
        print(f"Error crítico durante la limpieza: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    cleanup()
