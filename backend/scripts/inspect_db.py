
import psycopg2
from app.core.config import settings

def inspect_postgres():
    url = settings.DATABASE_URL
    # Extract params from URL (simplified)
    # postgresql://user:pass@host:port/dbname
    import re
    match = re.match(r"postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)", url)
    if not match:
        print("Could not parse DATABASE_URL")
        return

    user, password, host, port, dbname = match.groups()
    
    try:
        conn = psycopg2.connect(
            dbname=dbname,
            user=user,
            password=password,
            host=host,
            port=port
        )
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """)
        
        tables = cursor.fetchall()
        print("Tables found in PostgreSQL:")
        for table in tables:
            print(f"- {table[0]}")
            
        conn.close()
    except Exception as e:
        print(f"Error connecting to Postgres: {e}")

if __name__ == "__main__":
    inspect_postgres()
