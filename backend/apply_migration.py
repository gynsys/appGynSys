from app.db.base import SessionLocal, engine
from sqlalchemy import text

def add_column():
    print("Attempting to add 'whatsapp_url' column to 'doctors' table...")
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE doctors ADD COLUMN whatsapp_url VARCHAR"))
            conn.commit()
        print("Success: Column added.")
    except Exception as e:
        print(f"Error (might already exist): {e}")

if __name__ == "__main__":
    add_column()
