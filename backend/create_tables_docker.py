
import psycopg2

# Connect to the Docker PostgreSQL database
conn = psycopg2.connect(
    host="localhost",
    port=5432,
    database="gynsys",
    user="postgres",
    password="gyn13409534"
)

cursor = conn.cursor()

try:
    print("Creating recommendation_categories table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS recommendation_categories (
            id SERIAL PRIMARY KEY,
            tenant_id INTEGER NOT NULL REFERENCES doctors(id),
            name VARCHAR NOT NULL
        );
    """)
    
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS ix_recommendation_categories_id 
        ON recommendation_categories(id);
    """)
    
    print("Creating recommendations table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS recommendations (
            id SERIAL PRIMARY KEY,
            tenant_id INTEGER NOT NULL REFERENCES doctors(id),
            category_id INTEGER REFERENCES recommendation_categories(id),
            title VARCHAR NOT NULL,
            description TEXT,
            image_url VARCHAR,
            action_type VARCHAR DEFAULT 'LINK',
            action_url VARCHAR,
            price VARCHAR,
            is_active BOOLEAN DEFAULT true
        );
    """)
    
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS ix_recommendations_id 
        ON recommendations(id);
    """)
    
    conn.commit()
    print("✅ Tables created successfully!")
    
    # Verify tables exist
    cursor.execute("""
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('recommendations', 'recommendation_categories')
        ORDER BY table_name;
    """)
    
    tables = cursor.fetchall()
    print(f"\n✅ Verified tables: {[t[0] for t in tables]}")
    
except Exception as e:
    print(f"❌ Error: {e}")
    conn.rollback()
finally:
    cursor.close()
    conn.close()
