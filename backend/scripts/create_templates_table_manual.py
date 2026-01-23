from sqlalchemy import create_engine, text
from app.core.config import settings

def create_table():
    engine = create_engine(settings.DATABASE_URL)
    with engine.connect() as conn:
        print("Checking for preconsultation_templates table...")
        
        # Check if table exists
        result = conn.execute(text("SELECT to_regclass('public.preconsultation_templates')")).scalar()
        
        if result:
            print("Table 'preconsultation_templates' already exists.")
        else:
            print("Creating 'preconsultation_templates' table...")
            sql = """
            CREATE TABLE public.preconsultation_templates (
                id SERIAL PRIMARY KEY,
                name VARCHAR NOT NULL,
                description TEXT,
                questions JSON NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE
            );
            """
            conn.execute(text(sql))
            conn.commit()
            print("Table created successfully!")

if __name__ == "__main__":
    create_table()
