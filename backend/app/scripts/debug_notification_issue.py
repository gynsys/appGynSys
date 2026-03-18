import sys
import os
from sqlalchemy import create_engine, text

# Add /app to path if running inside docker
sys.path.insert(0, '/app')

def run_queries():
    # Use the discovered password
    db_url = "postgresql://postgres:GynsysDB2026!Secure@db:5432/gynsys"
    engine = create_engine(db_url)
    
    with engine.connect() as conn:
        print("--- REPORTE DETALLADO SISTEMA ---")
        
        # Filtramos por system_ y symptom_ que es lo que agrupa el tab 'Sistema'
        query = text("""
            SELECT notification_type, title_template, message_text_template 
            FROM notification_rules 
            WHERE (notification_type LIKE 'system_%' OR notification_type LIKE 'symptom_%')
            AND tenant_id IS NULL
            ORDER BY notification_type ASC
        """)
        
        rules = conn.execute(query).fetchall()
        total = len(rules)
        null_count = sum(1 for r in rules if r[2] is None or r[2] == '')
        
        print(f"Total de reglas de sistema: {total}")
        print(f"Reglas con cuerpo NULL: {null_count}")
        print("-" * 30)
        
        for rule in rules:
            status = "OK" if rule[2] else "MISSING BODY"
            print(f"[{status}] Tipo: {rule[0]} | Título: {rule[1]}")

if __name__ == "__main__":
    run_queries()
