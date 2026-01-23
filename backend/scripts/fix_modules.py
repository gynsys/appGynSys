from app.db.base import SessionLocal
from app.db.models.module import Module
from app.db.models.tenant_module import TenantModule
from sqlalchemy import not_
from datetime import datetime

def fix_modules():
    db = SessionLocal()
    try:
        # 1. Define the exact desired state
        allowed_codes = ['endometriosis_test', 'blog', 'cycle_predictor', 'recommendations', 'chat']
        print(f"🎯 Target Allowed Modules: {allowed_codes}")
        
        # 2. Identify trash modules
        trash_modules = db.query(Module).filter(
            not_(Module.code.in_(allowed_codes))
        ).all()
        
        trash_ids = [m.id for m in trash_modules]
        print(f"🔍 Found {len(trash_ids)} trash modules to delete: {[m.code for m in trash_modules]}")
        
        if trash_ids:
            # 3. Delete dependencies in tenant_modules first
            deleted_tm = db.query(TenantModule).filter(
                TenantModule.module_id.in_(trash_ids)
            ).delete(synchronize_session=False)
            print(f"🗑️ Deleted {deleted_tm} dependent records from 'tenant_modules'.")
            
            # 4. Delete the modules
            deleted_m = db.query(Module).filter(
                Module.id.in_(trash_ids)
            ).delete(synchronize_session=False)
            print(f"🗑️ Deleted {deleted_m} modules from 'modules' table.")
        else:
            print("✨ No trash modules found to delete.")

        # 5. Ensure Chat exists
        chat = db.query(Module).filter(Module.code == 'chat').first()
        if not chat:
            print("➕ Creating 'chat' module...")
            new_chat = Module(
                name='Chat en Vivo',
                description='Sistema de mensajería en tiempo real',
                code='chat',
                is_active=False,
                created_at=datetime.now()
            )
            db.add(new_chat)
            print("✅ 'chat' module created.")
        else:
            print("✅ 'chat' module already exists.")
            
        db.commit()
        
        # 6. Verify Final State
        final_list = db.query(Module).all()
        print("\n📋 Final Module List in DB:")
        for m in final_list:
            print(f" - {m.name} [{m.code}]")

    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == '__main__':
    fix_modules()
