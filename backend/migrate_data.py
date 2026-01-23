
import sqlite3
import psycopg2
from psycopg2.extras import execute_values
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Config
SQLITE_DB_PATH = "gynsys.db"
POSTGRES_DB_URI = "dbname=gynsys user=postgres password=gyn13409534 host=localhost port=5432"

def dict_factory(cursor, row):
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d

def migrate():
    # Connect to SQLite
    try:
        sqlite_conn = sqlite3.connect(SQLITE_DB_PATH)
        sqlite_conn.row_factory = dict_factory
        sqlite_cursor = sqlite_conn.cursor()
        logger.info("Connected to SQLite")
    except Exception as e:
        logger.error(f"Failed to connect to SQLite: {e}")
        return

    # Connect to Postgres
    try:
        pg_conn = psycopg2.connect(POSTGRES_DB_URI)
        pg_cursor = pg_conn.cursor()
        logger.info("Connected to PostgreSQL")
    except Exception as e:
        logger.error(f"Failed to connect to PostgreSQL: {e}")
        return

    # Define table migration order (respect foreign keys)
    # Order: Users (Tenants) -> Users (Accounts) -> Doctors -> Locations -> Services -> BlogPosts -> Gallery -> Testimonials etc.
    # Note: Adjust logic based on actual schema. Assuming 'users' table holds both admins and doctors logic if applicable, 
    # but based on file list, we have separate models.
    
    # 1. Tenants (if any, checking schema via sqlite)
    migrate_table(sqlite_cursor, pg_cursor, "tenants")

    # 2. Plans & Modules (if any)
    migrate_table(sqlite_cursor, pg_cursor, "plans")
    migrate_table(sqlite_cursor, pg_cursor, "modules")
    
    # 3. Users (Base accounts)
    migrate_table(sqlite_cursor, pg_cursor, "users")

    # 4. Doctors (and their profiles)
    migrate_table(sqlite_cursor, pg_cursor, "doctors")

    # 5. Locations
    migrate_table(sqlite_cursor, pg_cursor, "locations")
    
    # 6. Services & Blog Posts (Services might link to blog posts or vice versa)
    # BlogPosts seems independent or linked to users/doctors
    migrate_table(sqlite_cursor, pg_cursor, "blog_posts")
    migrate_table(sqlite_cursor, pg_cursor, "services")

    # 7. Gallery
    migrate_table(sqlite_cursor, pg_cursor, "gallery_images")

    # 8. Testimonials
    migrate_table(sqlite_cursor, pg_cursor, "testimonials")

    # 9. FAQ
    migrate_table(sqlite_cursor, pg_cursor, "faqs")

    # 10. Appointments / Patients / Consultations
    migrate_table(sqlite_cursor, pg_cursor, "patients")
    migrate_table(sqlite_cursor, pg_cursor, "appointments")
    migrate_table(sqlite_cursor, pg_cursor, "consultations")
    migrate_table(sqlite_cursor, pg_cursor, "preconsultation_questions")

    pg_conn.commit()
    logger.info("Migration completed successfully!")
    
    sqlite_conn.close()
    pg_conn.close()

def migrate_table(sqlite_cursor, pg_cursor, table_name):
    logger.info(f"Migrating table: {table_name}")
    
    # Check if table exists in SQLite
    sqlite_cursor.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table_name}';")
    if not sqlite_cursor.fetchone():
        logger.warning(f"Table {table_name} not found in SQLite. Skipping.")
        return

    # Get data
    sqlite_cursor.execute(f"SELECT * FROM {table_name}")
    rows = sqlite_cursor.fetchall()
    
    if not rows:
        logger.info(f"Table {table_name} is empty. Skipping.")
        return

    # Get columns
    columns = list(rows[0].keys())
    columns_str = ', '.join(columns)
    placeholders = ', '.join(['%s'] * len(columns))
    
    # Prepare data for Postgres (convert boolean integers to bools if needed, or dicts to json)
    pg_rows = []
    for row in rows:
        values = []
        for col in columns:
            val = row[col]
            # Handle SQLite nuances if any (e.g. booleans as 0/1 are usually fine for PG if schema matches)
            # Handle potential JSON fields stored as strings in SQLite that need to be JSON objects in PG? 
            # Psycopg2 handles basic types well.
            values.append(val)
        pg_rows.append(tuple(values))

    # Insert into Postgres
    query = f"INSERT INTO {table_name} ({columns_str}) VALUES %s ON CONFLICT DO NOTHING"
    
    # Introspect Postgres to find boolean columns
    pg_cursor.execute(f"SELECT column_name FROM information_schema.columns WHERE table_name = '{table_name}' AND data_type = 'boolean'")
    bool_cols = [row[0] for row in pg_cursor.fetchall()]
    
    # Create a mapping of column index to boolean for faster checking
    bool_indices = {i for i, col in enumerate(columns) if col in bool_cols}
    
    final_rows = []
    for row in pg_rows:
        new_row = list(row)
        for idx in bool_indices:
            val = new_row[idx]
            if val == 1: new_row[idx] = True
            elif val == 0: new_row[idx] = False
        final_rows.append(tuple(new_row))

    try:
        execute_values(pg_cursor, query, final_rows)
        pg_cursor.connection.commit() # Commit after each table
        logger.info(f"Inserted {len(final_rows)} rows into {table_name}")
    except Exception as e:
        pg_cursor.connection.rollback() # Rollback transaction to allow next table
        logger.error(f"Error migrating {table_name}: {e}")

if __name__ == "__main__":
    migrate()
