from sqlalchemy import create_engine, text
from app.core.config import settings

def update_schema():
    engine = create_engine(settings.DATABASE_URL)
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE doctors ADD COLUMN stripe_customer_id VARCHAR"))
            print("Added stripe_customer_id column")
        except Exception as e:
            print(f"Error adding stripe_customer_id: {e}")
            
        try:
            conn.execute(text("ALTER TABLE doctors ADD COLUMN subscription_end_date TIMESTAMP WITH TIME ZONE"))
            print("Added subscription_end_date column")
        except Exception as e:
            print(f"Error adding subscription_end_date: {e}")
            
        conn.commit()

if __name__ == "__main__":
    update_schema()
