
import psycopg2
import sys

# DATABASE_URL = "postgresql://postgres:gyn13409534@localhost:5432/gynsys"

db_config = {
    "dbname": "gynsys",
    "user": "postgres",
    "password": "gyn13409534",
    "host": "localhost",
    "port": "5432"
}

print(f"Connecting to DB: {db_config['dbname']} on {db_config['host']}")

try:
    conn = psycopg2.connect(**db_config)
    print("✅ Connection successful!")
    
    cur = conn.cursor()
    cur.execute("SELECT version();")
    record = cur.fetchone()
    print(f"Server version: {record}")
    
    cur.close()
    conn.close()
    
except Exception as e:
    print(f"❌ Connection failed: {e}")
    sys.exit(1)
