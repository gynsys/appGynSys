
from app.db.base import SessionLocal
from app.db.models.module import Module

def cleanup():
    db = SessionLocal()
    try:
        # Find the incorrect module
        bad_module = db.query(Module).filter(Module.code == 'endometriosis').first()
        if bad_module:
            print(f"Found bad module to delete: {bad_module.name} (Code: {bad_module.code}, ID: {bad_module.id})")
            db.delete(bad_module)
            db.commit()
            print("Successfully deleted module 'endometriosis'.")
        else:
            print("Module with code 'endometriosis' NOT found in this database.")
            
        # List remaining modules to verify
        print("\nRemaining Modules:")
        modules = db.query(Module).all()
        for m in modules:
            print(f"- [{m.id}] {m.name} ({m.code})")
            
    except Exception as e:
        print(f"Error executing cleanup: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    cleanup()
