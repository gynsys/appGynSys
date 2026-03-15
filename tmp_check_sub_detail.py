import sqlite3
import os

def check_mariel_sub():
    db_path = "backend/gynsys.db"
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check doctor email again
        cursor.execute("SELECT id, nombre_completo, email FROM doctors WHERE id = 4")
        doctor = cursor.fetchone()
        print(f"Doctor: {doctor}")
        
        # Check subscriptions
        cursor.execute("SELECT * FROM push_subscriptions WHERE doctor_id = 4")
        subs = cursor.fetchall()
        print(f"\nSubscriptions for Doctor 4: {len(subs)}")
        for s in subs:
            # Table schema usually: id, user_id, doctor_id, endpoint, p256dh, auth, created_at, updated_at, token
            print(f"- ID: {s[0]}")
            print(f"  User ID: {s[1]}")
            print(f"  Doctor ID: {s[2]}")
            print(f"  Endpoint: {s[3][:50]}..." if s[3] else "  Endpoint: None")
            print(f"  Token: {s[8][:20]}..." if len(s) > 8 and s[8] else "  Token: None")
            print(f"  Created At: {s[6]}")

        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_mariel_sub()
