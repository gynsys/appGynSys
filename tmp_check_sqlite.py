import sqlite3
import os
from datetime import date

def check_sqlite_db():
    db_path = "backend/gynsys.db"
    if not os.path.exists(db_path):
        print(f"File {db_path} not found.")
        return

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # List tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [t[0] for t in cursor.fetchall()]
        print(f"Tables found: {', '.join(tables)}")

        # Find Mariel
        mariel_id = None
        if "doctors" in tables:
            cursor.execute("SELECT id, nombre_completo, email FROM doctors WHERE nombre_completo LIKE '%Mariel%'")
            results = cursor.fetchall()
            if results:
                mariel_id, name, email = results[0]
                print(f"Doctor Found: {name} (ID: {mariel_id}, Email: {email})")
            else:
                print("Mariel Herrera not found in doctors table.")
        
        # Check today's appointments
        today = "2026-03-14"
        if "appointments" in tables and mariel_id:
            cursor.execute("SELECT patient_name, appointment_date, status FROM appointments WHERE doctor_id = ? AND date(appointment_date) = ?", (mariel_id, today))
            apps = cursor.fetchall()
            print(f"\nAppointments for {today}: {len(apps)}")
            for a in apps:
                print(f"- {a[0]} | {a[1]} | {a[2]}")

        # Check today's notifications
        if "notification_logs" in tables and mariel_id:
            cursor.execute("SELECT notification_type, title_sent, status, sent_at FROM notification_logs WHERE doctor_id = ? AND date(sent_at) = ?", (mariel_id, today))
            logs = cursor.fetchall()
            print(f"\nSent Notifications for {today}: {len(logs)}")
            for l in logs:
                print(f"- {l[0]} | {l[1]} | {l[2]} | {l[3]}")

        if "pending_notifications" in tables and mariel_id:
            cursor.execute("SELECT notification_rule_id, subject, status, scheduled_for FROM pending_notifications WHERE doctor_id = ? AND date(scheduled_for) = ?", (mariel_id, today))
            pending = cursor.fetchall()
            print(f"\nPending Notifications for {today}: {len(pending)}")
            for p in pending:
                print(f"- {p[0]} | {p[1]} | {p[2]} | {p[3]}")

        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_sqlite_db()
