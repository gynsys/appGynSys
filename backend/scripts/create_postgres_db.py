
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def create_database():
    passwords_to_try = ["gyn13409534"]
    
    for pwd in passwords_to_try:
        print(f"Trying password: '{pwd}'...")
        params = {
            "user": "postgres",
            "password": pwd,
            "host": "localhost",
            "port": "5432"
        }

        try:
            # Connect to default database
            conn = psycopg2.connect(**params)
            conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
            cursor = conn.cursor()
            
            # Check if database exists
            cursor.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = 'gynsys'")
            exists = cursor.fetchone()
            
            if not exists:
                print("Creating database 'gynsys'...")
                cursor.execute('CREATE DATABASE gynsys')
                print("Database 'gynsys' created successfully!")
            else:
                print("Database 'gynsys' already exists.")
                
            cursor.close()
            conn.close()
            
            # If successful, update config.py with the correct password
            # (This is a bit hacky but helps for now)
            print(f"SUCCESS! Password is: '{pwd}'")
            return True
            
        except Exception as e:
            # Handle encoding errors in error messages (common on Windows with Spanish locale)
            error_msg = str(e)
            try:
                if hasattr(e, 'diag') and hasattr(e.diag, 'message_primary'):
                    error_msg = e.diag.message_primary
            except:
                pass
                
            print(f"Failed with password '{pwd}': {error_msg}")
            continue
            
    print("Could not connect with any common password.")
    return False

if __name__ == "__main__":
    create_database()
