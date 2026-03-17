import os
import sys

# Add current directory to path
sys.path.append(os.getcwd())
if os.path.basename(os.getcwd()) in ["scripts", "readme"]:
    sys.path.append(os.path.dirname(os.getcwd()))

from app.db.base import SessionLocal
from sqlalchemy import text

def relax_push_constraints():
    db = SessionLocal()
    try:
        print("Iniciando relajación de restricciones en push_subscriptions...")
        
        # SQL para quitar las restricciones NOT NULL
        sql_commands = [
            "ALTER TABLE push_subscriptions ALTER COLUMN endpoint DROP NOT NULL;",
            "ALTER TABLE push_subscriptions ALTER COLUMN p256dh DROP NOT NULL;",
            "ALTER TABLE push_subscriptions ALTER COLUMN auth DROP NOT NULL;"
        ]
        
        for cmd in sql_commands:
            print(f"Ejecutando: {cmd}")
            db.execute(text(cmd))
        
        db.commit()
        print("¡Mantenimiento de base de datos completado exitosamente!")
        print("Ahora la tabla aceptará registros nativos (solo token) sin errores.")
            
    except Exception as e:
        db.rollback()
        print(f"Error durante el mantenimiento de BD: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    relax_push_constraints()
