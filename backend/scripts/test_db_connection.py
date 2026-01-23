import psycopg2
import os

# Configuration from docker-compose or defaults
DB_HOST = os.getenv("DB_HOST", "127.0.0.1") # Using 127.0.0.1 for local connection
DB_PORT = os.getenv("DB_PORT", "5433")
DB_NAME = os.getenv("DB_NAME", "gynsys")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "gyn13409534")

print(f"Testing connection to: postgres://{DB_USER}:***@{DB_HOST}:{DB_PORT}/{DB_NAME}")

try:
    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        connect_timeout=5
    )
    print("Connection SUCCESSFUL!")
    cursor = conn.cursor()
    cursor.execute("SELECT version();")
    record = cursor.fetchone()
    print("Database version:", record)
    conn.close()
except Exception as e:
    print("Connection FAILED:")
    print(e)
