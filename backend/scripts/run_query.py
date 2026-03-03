import sys
import argparse
import psycopg2
from app.core.config import settings

def run_query(query: str):
    url = settings.DATABASE_URL
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
        cursor.execute(query)
        
        if cursor.description:
            columns = [desc[0] for desc in cursor.description]
            print(" | ".join(columns))
            print("-" * (len(" | ".join(columns))))
            rows = cursor.fetchall()
            for row in rows:
                print(" | ".join(map(str, row)))
        else:
            conn.commit()
            print("Query executed successfully (no results).")
            
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("query", help="SQL query to run")
    args = parser.parse_args()
    run_query(args.query)
