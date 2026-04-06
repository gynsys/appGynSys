import psycopg2

try:
    conn = psycopg2.connect("postgresql://postgres:gyn13409534@127.0.0.1:5433/gynsys")
    cur = conn.cursor()
    cur.execute("ALTER TABLE campaign_contact ADD COLUMN ci VARCHAR(50);")
    cur.execute("ALTER TABLE campaign_contact ADD COLUMN city VARCHAR(255);")
    conn.commit()
    print("Migrated successfully")
except Exception as e:
    print("Migration error (might already exist):", e)
finally:
    if 'conn' in locals():
        conn.close()
