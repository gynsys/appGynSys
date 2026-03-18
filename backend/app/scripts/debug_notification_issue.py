import sys
import os
import re
from sqlalchemy import create_engine, text

# Add /app to path if running inside docker
sys.path.insert(0, '/app')

def run_queries():
    # Use the discovered password
    db_url = "postgresql://postgres:GynsysDB2026!Secure@db:5432/gynsys"
    engine = create_engine(db_url)
    
    with engine.connect() as conn:
        print("--- NOTIFICACIONES CALCULADORA MENSTRUAL (MÉTODO RITMO Y CICLO DIARIO) ---")
        
        # Filtramos por los tipos que pertenecen a la calculadora menstrual/ciclo
        query = text("""
            SELECT notification_type, title_template, message_text_template 
            FROM notification_rules 
            WHERE (notification_type LIKE 'day_%' 
               OR notification_type LIKE 'rhythm_%' 
               OR notification_type = 'period_late_1_day')
            AND tenant_id IS NULL
        """)
        
        rules = conn.execute(query).fetchall()
        
        def sort_key(rule):
            ntype = rule[0]
            if ntype.startswith('day_'):
                match = re.search(r'day_(\d+)', ntype)
                return (0, int(match.group(1)) if match else 0)
            if ntype.startswith('rhythm_after'):
                return (1, int(ntype[-1]))
            if ntype.startswith('rhythm_before'):
                return (2, int(ntype[-1]))
            if ntype == 'period_late_1_day':
                return (3, 0)
            return (4, 0)
            
        sorted_rules = sorted(rules, key=sort_key)
        
        for rule in sorted_rules:
            print(f"Tipo: {rule[0]}")
            print(f"Título: {rule[1]}")
            print(f"Cuerpo: {rule[2]}")
            print("-" * 30)

if __name__ == "__main__":
    run_queries()
