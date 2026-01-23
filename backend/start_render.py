import os
import subprocess
import uvicorn
from alembic.config import Config
from alembic import command
from sqlalchemy import inspect
from app.db.base import Base, engine

def run_migrations():
    print("Running DB Migrations...")
    try:
        # Construct path to alembic.ini (assuming it's in the same directory as this script)
        alembic_ini_path = os.path.join(os.path.dirname(__file__), "alembic.ini")
        alembic_cfg = Config(alembic_ini_path)
        # Point to the script location (backend/alembic)
        alembic_cfg.set_main_option("script_location", "alembic")
        
        command.upgrade(alembic_cfg, "head")
        print("Migrations complete.")
    except Exception as e:
        print(f"Error running migrations: {e}")
        # Retry with subprocess just in case alembic API fails due to path/config weirdness
        print("Retrying with subprocess...")
        try:
            subprocess.run(["alembic", "upgrade", "head"], check=False)
        except Exception as sub_e:
            print(f"Subprocess migration failed: {sub_e}")

def check_and_fix_schema():
    print("Checking database schema integrity...")
    try:
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        if "doctors" not in tables:
            print("CRITICAL: 'doctors' table missing despite migrations. Forcing create_all()...")
            Base.metadata.create_all(bind=engine)
            print("Schema created successfully via create_all().")
        else:
            print(f"Schema looks good. Tables found: {len(tables)}")
    except Exception as e:
        print(f"Error checking/fixing schema: {e}")

if __name__ == "__main__":
    run_migrations()
    check_and_fix_schema()
    
    # Auto-seed initial data (Mariel Herrera)
    print("Checking/Seeding initial data...")
    try:
        from seed_mariel import seed_mariel
        seed_mariel()
    except Exception as e:
        print(f"Error executing seed_mariel: {e}")

    try:
        from populate_mariel import populate_data
        populate_data()
    except Exception as e:
        print(f"Error executing populate_data: {e}")

    try:
        from create_admin_user import create_super_admin
        create_super_admin()
    except Exception as e:
        print(f"Error creating admin: {e}")

    print("Starting Server...")
    # This replaces the process with Uvicorn (similar to exec) if possible, 
    # but calling uvicorn.run is fine for this context.
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000)
