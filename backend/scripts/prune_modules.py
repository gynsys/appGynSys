from app.db.base import SessionLocal
from app.db.models.module import Module
from sqlalchemy import not_

def prune_modules():
    db = SessionLocal()
    try:
        # The only 4 modules that should exist
        allowed = ['endometriosis_test', 'blog', 'cycle_predictor', 'recommendations']
        
        print(f"🔍 Keeping only: {allowed}")
        
        # Count before
        total_before = db.query(Module).count()
        print(f"📊 Total modules before: {total_before}")
        
        # Delete any module NOT in the allowed list
        # synchronize_session=False is required for IN/NOT IN deletions
        rows_deleted = db.query(Module).filter(
            not_(Module.code.in_(allowed))
        ).delete(synchronize_session=False)
        
        db.commit()
        print(f"✅ Deleted {rows_deleted} extra modules.")
        
        # Verify result
        remaining = db.query(Module).all()
        print("\n📋 Remaining Modules:")
        for m in remaining:
            print(f" - {m.name} ({m.code})")
            
        if len(remaining) != 4:
            print(f"\n⚠️ Warning: Expected 4 modules, found {len(remaining)}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == '__main__':
    prune_modules()
