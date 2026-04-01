import os
from sqlalchemy import create_engine, inspect

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:GynsysDB2026!Secure@db:5432/gynsys")

def inspect_db():
    print(f"Inspecting {DATABASE_URL}...")
    engine = create_engine(DATABASE_URL)
    inspector = inspect(engine)
    
    tables = inspector.get_table_names()
    print(f"Tables found: {tables}")
    
    for table_name in ['diffusion_campaign', 'campaign_contact']:
        if table_name in tables:
            print(f"\n--- {table_name} ---")
            columns = inspector.get_columns(table_name)
            for col in columns:
                print(f"  {col['name']}: {col['type']}")
        else:
            print(f"\n--- {table_name} NOT FOUND ---")

if __name__ == "__main__":
    inspect_db()
