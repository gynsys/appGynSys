import sqlite3
import os

DB_PATH = '/root/bot/database/medical_bot.db'
if not os.path.exists(DB_PATH):
    print(f"Error: {DB_PATH} not found")
    exit(1)

conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row
print("--- BOTS TABLE ---")
for r in conn.execute('SELECT * FROM bots'):
    print(dict(r))

print("\n--- DOCTORS TABLE ---")
for r in conn.execute('SELECT * FROM doctors LIMIT 5'):
    print(dict(r))
conn.close()
