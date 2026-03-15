import sqlite3
import os
from datetime import date

def verify_db_data():
    db_path = "backend/gynsys.db"
    if not os.path.exists(db_path):
        print(f"File {db_path} not found.")
        return

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # 1. Total counts
        cursor.execute("SELECT count(*) FROM appointments")
        print(f"Total Appointments: {cursor.fetchone()[0]}")
        cursor.execute("SELECT count(*) FROM notification_logs")
        print(f"Total Notification Logs: {cursor.fetchone()[0]}")
        cursor.execute("SELECT count(*) FROM pending_notifications")
        print(f"Total Pending Notifications: {cursor.fetchone()[0]}")

        # 2. Latest activity
        print("\nLast 5 Appointment dates:")
        cursor.execute("SELECT appointment_date FROM appointments ORDER BY appointment_date DESC LIMIT 5")
        for row in cursor.fetchall():
            print(f"- {row[0]}")

        print("\nLast 5 Notification Log dates:")
        cursor.execute("SELECT sent_at FROM notification_logs ORDER BY sent_at DESC LIMIT 5")
        for row in cursor.fetchall():
            print(f"- {row[0]}")

        # 3. Check for Mariel (ID 4)
        print("\nAny activity for Mariel (ID 4) ever?")
        cursor.execute("SELECT count(*) FROM appointments WHERE doctor_id = 4")
        print(f"- Appointments: {cursor.fetchone()[0]}")
        cursor.execute("SELECT count(*) FROM notification_logs WHERE doctor_id = 4")
        print(f"- Logs: {cursor.fetchone()[0]}")

        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    verify_db_data()
