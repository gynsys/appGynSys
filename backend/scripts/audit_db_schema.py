import sys
import os
from sqlalchemy import create_engine, inspect, text

# Add parent dir to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings

def audit_schema():
    print("--- Database Schema Audit ---")
    uri = settings.DATABASE_URL
    # uri = str(uri).replace("@db", "@localhost")
    
    print(f"Connecting to: {uri}")
    try:
        engine = create_engine(uri)
        inspector = inspect(engine)
        
        tables = inspector.get_table_names()
        print(f"frac Found {len(tables)} tables.")
        
        target_tables = ['doctors', 'endometriosis_results', 'cycle_users', 'appointments']
        
        for table in target_tables:
            if table in tables:
                print(f"\n[Table: {table}]")
                columns = inspector.get_columns(table)
                col_names = [col['name'] for col in columns]
                print(f"Columns: {', '.join(col_names)}")
                
                # Check specifics
                if table == 'doctors':
                    required = ['whatsapp_url', 'visitor_count', 'theme_primary_color', 'schedule']
                    for req in required:
                        if req in col_names:
                            print(f"  OK: {req} exists")
                        else:
                            print(f"  MISSING: {req}")
            else:
                print(f"\n[Table: {table}] - MISSING!")
                
    except Exception as e:
        print(f"Audit Failed: {e}")

if __name__ == "__main__":
    audit_schema()
