"""
Script simple para verificar que el setup del backend está correcto.
"""
import sys
import os

# Agregar el directorio actual al path
sys.path.insert(0, os.path.dirname(__file__))

def test_imports():
    """Verifica que todas las importaciones funcionen."""
    print("🔍 Verificando importaciones...")
    try:
        from app.core.config import settings
        print("✅ Config cargado correctamente")
        
        from app.db.base import Base, engine
        print("✅ Base de datos configurada")
        
        from app.db.models.doctor import Doctor
        from app.db.models.appointment import Appointment
        print("✅ Modelos importados correctamente")
        
        from app.core.security import hash_password, verify_password
        print("✅ Módulo de seguridad importado")
        
        from app.main import app
        print("✅ Aplicación FastAPI creada")
        
        print("\n✅ Todas las importaciones funcionan correctamente!")
        print(f"📊 Database URL: {settings.DATABASE_URL}")
        print(f"🔑 Secret Key configurada: {'Sí' if settings.SECRET_KEY != 'your-secret-key-change-in-production' else '⚠️  Usa valor por defecto (cambiar en producción)'}")
        
        return True
    except Exception as e:
        print(f"❌ Error en importaciones: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("=" * 50)
    print("🧪 Test de Setup - GynSys Backend")
    print("=" * 50)
    print()
    
    success = test_imports()
    
    print()
    print("=" * 50)
    if success:
        print("✅ Setup correcto! Puedes continuar con las migraciones.")
        print("\nPróximos pasos:")
        print("1. alembic revision --autogenerate -m 'Initial migration'")
        print("2. alembic upgrade head")
        print("3. uvicorn app.main:app --reload")
    else:
        print("❌ Hay errores en el setup. Revisa los mensajes arriba.")
    print("=" * 50)

