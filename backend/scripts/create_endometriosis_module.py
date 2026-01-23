"""
Script para crear el módulo de Test de Endometriosis
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import create_engine, text
from app.core.config import settings

def create_endometriosis_module():
    # Usar la URL de Docker
    db_url = "postgresql://postgres:gyn13409534@db:5432/gynsys"
    engine = create_engine(db_url)
    
    with engine.connect() as connection:
        # Verificar si ya existe
        result = connection.execute(text("SELECT id FROM modules WHERE code = 'endometriosis'"))
        if result.fetchone():
            print("✅ El módulo de Endometriosis ya existe.")
        else:
            # Crear el módulo
            connection.execute(text("""
                INSERT INTO modules (name, code, description, is_active, created_at, updated_at)
                VALUES ('Test de Endometriosis', 'endometriosis', 'Cuestionario de evaluación de riesgo de endometriosis', true, NOW(), NOW())
            """))
            connection.commit()
            print("✅ Módulo de Endometriosis creado exitosamente.")
        
        # Mostrar todos los módulos
        result = connection.execute(text("SELECT id, code, name, is_active FROM modules ORDER BY id"))
        print("\n📋 Módulos disponibles:")
        for row in result:
            status = "✅" if row[3] else "❌"
            print(f"  {status} {row[0]}: {row[1]} - {row[2]}")

if __name__ == "__main__":
    create_endometriosis_module()
