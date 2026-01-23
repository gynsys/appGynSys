import sys
from sqlalchemy import create_engine, text

# Database URL from config.py
DATABASE_URL = "postgresql://postgres:gyn13409534@localhost:5432/gynsys"

def create_blog_module():
    try:
        engine = create_engine(DATABASE_URL)
        with engine.connect() as connection:
            # Check if it exists first
            result = connection.execute(text("SELECT id FROM modules WHERE code = 'blog'"))
            if result.fetchone():
                print("Blog module already exists.")
                return

            # Insert
            print("Creating Blog module...")
            connection.execute(text("""
                INSERT INTO modules (name, code, description, is_active)
                VALUES ('Blog', 'blog', 'Gestión de artículos y publicaciones para pacientes.', true)
            """))
            connection.commit()
            print("Blog module created successfully.")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    create_blog_module()
