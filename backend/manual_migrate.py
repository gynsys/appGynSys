import sqlite3
import os

db_path = 'gynsys.db'
conn = sqlite3.connect(db_path)
c = conn.cursor()

# Create cycle_users
try:
    c.execute("""
    CREATE TABLE IF NOT EXISTS cycle_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email VARCHAR NOT NULL,
        password_hash VARCHAR NOT NULL,
        nombre_completo VARCHAR NOT NULL,
        doctor_id INTEGER NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP,
        FOREIGN KEY(doctor_id) REFERENCES doctors(id)
    )
    """)
    # Unique index on email
    c.execute("CREATE UNIQUE INDEX IF NOT EXISTS ix_cycle_users_email ON cycle_users (email)")
    print("Ensured cycle_users table")
except Exception as e:
    print(f"cycle_users error: {e}")

conn.commit()
conn.close()
