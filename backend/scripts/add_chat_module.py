"""
Add Chat module to the modules table with is_active=False (disabled by default)
"""
from app.db.base import SessionLocal
from app.db.models.module import Module
from datetime import datetime

def add_chat_module():
    db = SessionLocal()
    try:
        # Check if exists
        existing = db.query(Module).filter(Module.code == 'chat').first()
        if existing:
            print("✅ Módulo 'chat' ya existe con ID:", existing.id)
            print(f"   Estado actual: {'Activo' if existing.is_active else 'Inactivo'}")
            # Ensure it's disabled
            if existing.is_active:
                existing.is_active = False
                db.commit()
                print("   ⚠️  Cambiado a INACTIVO")
            return
        
        # Create new module
        chat_module = Module(
            name='Chat en Vivo',
            description='Sistema de mensajería en tiempo real para consultas con pacientes',
            code='chat',
            is_active=False,  # DISABLED by default
            created_at=datetime.now()
        )
        db.add(chat_module)
        db.commit()
        db.refresh(chat_module)
        
        print("✅ Módulo 'chat' creado exitosamente")
        print(f"   ID: {chat_module.id}")
        print(f"   Código: {chat_module.code}")
        print(f"   Estado: {'Activo' if chat_module.is_active else 'INACTIVO'}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == '__main__':
    add_chat_module()
