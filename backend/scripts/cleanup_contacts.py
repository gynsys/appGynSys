import sys
import os
from sqlalchemy import text

# Determinar la raíz del backend dinámicamente
current_file = os.path.abspath(__file__)
backend_root = os.path.dirname(os.path.dirname(current_file))
sys.path.insert(0, backend_root)

# USAR DATABASE_URL DEL ENTORNO
db_url = os.getenv("DATABASE_URL")

if not db_url:
    print("ERROR: DATABASE_URL no encontrada en el entorno.")
    sys.exit(1)

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
        # Test de conexión
        db.execute(text("SELECT 1"))
        print("DEBUG: Conexión a Base de Datos de Producción SaaS Exitosa.")

        # 1. Limpieza de errores tipográficos (B vs C) - Búsqueda Ampliada
        typo_contacts = db.query(CampaignContact).filter(
            CampaignContact.email.ilike('%unicobn%')
        ).all()
        
        print(f"Encontrados {len(typo_contacts)} contactos con el error 'unicobn'.")
        for c in typo_contacts:
            print(f" - Eliminando Permanentemente (Hard Delete): {c.full_name} ({c.email})")
            db.delete(c)

        # 2. Limpieza de correo del doctor en contactos externos - Búsqueda Ampliada
        doctor_email_pattern = '%milanopabloe%'
        doctor_contacts = db.query(CampaignContact).filter(
            CampaignContact.email.ilike(doctor_email_pattern)
        ).all()
        
        print(f"Encontrados {len(doctor_contacts)} contactos relacionados al doctor.")
        for c in doctor_contacts:
            print(f" - Eliminando contacto de difusión erróneo: {c.full_name} ({c.email})")
            db.delete(c)

        db.commit()
        print("Mantenimiento de producción finalizado con éxito.")
        
    except Exception as e:
        print(f"Error crítico durante la limpieza en el servidor: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    cleanup()
