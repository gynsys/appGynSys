
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.models.module import Module

# Explicitly connect to the Docker Postgres exposed on localhost:5432
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:gyn13409534@localhost:5432/gynsys"

def cleanup():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        print("Connected to Postgres DB.")
        
        # 1. List all modules
        all_mods = db.query(Module).all()
        print(f"Total Modules in Postgres: {len(all_mods)}")
        for m in all_mods:
            print(f" - ID: {m.id} | Code: {m.code} | Name: {m.name}")

        # 2. Find duplicates for 'Test de Endometriosis'
        # We want to keep 'endometriosis_test' (ID 6 usually)
        # We want to delete 'endometriosis'
        
        bad_module = db.query(Module).filter(Module.code == 'endometriosis').first()
        if bad_module:
            print(f"!!! Found bad module: {bad_module.name} (ID: {bad_module.id}, Code: {bad_module.code})")
            db.delete(bad_module)
            db.commit()
            print(">>> Deleted bad module.")
        else:
            print("No module with code 'endometriosis' found.")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    cleanup()
