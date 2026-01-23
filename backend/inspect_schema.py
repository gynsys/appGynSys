import sqlite3
import json

db_path = 'gynsys.db'
conn = sqlite3.connect(db_path)
c = conn.cursor()

# Get columns for doctors
cols = c.execute("PRAGMA table_info(doctors)").fetchall()
print("Doctors columns:", [col[1] for col in cols])
conn.close()
