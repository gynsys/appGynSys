import sqlite3
import os

def list_all():
    db_path = "backend/gynsys.db"
    if not os.path.exists(db_path):
        print("DB Not found")
        return
        
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("--- DOCTORS ---")
    cursor.execute("SELECT id, nombre_completo, email FROM doctors")
    for row in cursor.fetchall():
        print(row)
        
    print("\n--- ALL PUSH SUBSCRIPTIONS ---")
    # Get columns first
    cursor.execute("PRAGMA table_info(push_subscriptions)")
    cols = [c[1] for c in cursor.fetchall()]
    print(f"Columns: {cols}")
    
    cursor.execute("SELECT * FROM push_subscriptions")
    for row in cursor.fetchall():
        print(row)
        
    conn.close()

if __name__ == "__main__":
    list_all()
