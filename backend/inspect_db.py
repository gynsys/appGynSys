
import sqlite3
import os

DB_PATH = "backend/sql_app.db"  # Adjust if path is different, usually in root or backend/

# Try to find the db file
possible_paths = [
    "sql_app.db",
    "app.db",
    "backend/sql_app.db",
    "backend/app.db",
    "../sql_app.db"
]

db_file = None
for p in possible_paths:
    if os.path.exists(p):
        db_file = p
        break

if not db_file:
    # Try searching recursively in current dir
    for root, dirs, files in os.walk("."):
        for file in files:
            if file.endswith(".db"):
                db_file = os.path.join(root, file)
                break
        if db_file:
            break

if not db_file:
    print("Could not find database file.")
    exit(1)

print(f"Using database: {db_file}")

try:
    conn = sqlite3.connect(db_file)
    cursor = conn.cursor()
    
    # List tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    print("Tables found:")
    for t in tables:
        print(f"- {t[0]}")
        
    # Check plans table structure if it exists
    if ('plans',) in tables:
        print("\nStructure of 'plans' table:")
        cursor.execute("PRAGMA table_info(plans);")
        columns = cursor.fetchall()
        for col in columns:
            print(col)
            
        # Check data
        print("\nData in 'plans' table:")
        cursor.execute("SELECT * FROM plans;")
        rows = cursor.fetchall()
        for row in rows:
            print(row)
    else:
        print("\n'plans' table NOT found!")

    conn.close()

except Exception as e:
    print(f"Error: {e}")
