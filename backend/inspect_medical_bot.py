
import sqlite3

def inspect_db():
    try:
        conn = sqlite3.connect('medical_bot.db')
        cursor = conn.cursor()
        
        # Get tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [t[0] for t in cursor.fetchall()]
        print(f"Tables found: {len(tables)}")
        
        # Count rows in each
        for table in sorted(tables):
            if table == 'sqlite_sequence': continue
            try:
                cursor.execute(f"SELECT count(*) FROM {table}")
                count = cursor.fetchone()[0]
                print(f"{table}: {count}")
            except Exception as e:
                print(f"{table}: Error {e}")
                
        conn.close()
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    inspect_db()
