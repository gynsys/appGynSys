import psycopg2
import os

def list_doctors():
    # Use the local docker port if running on user machine
    url = "postgresql://postgres:gyn13409534@127.0.0.1:5433/gynsys"

    try:
        conn = psycopg2.connect(url)
        cursor = conn.cursor()
        
        cursor.execute("SELECT id, nombre_completo, email, slug_url FROM doctors")
        doctors = cursor.fetchall()
        print(f"Doctors found: {len(doctors)}")
        for d in doctors:
            print(f"ID: {d[0]} | Name: {d[1]} | Email: {d[2]} | Slug: {d[3]}")
            
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    list_doctors()
