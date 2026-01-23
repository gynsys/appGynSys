from app.db.base import engine
from sqlalchemy import text
import sqlalchemy as sa
from sqlalchemy import inspect

def ensure_column():
    inspector = inspect(engine)
    columns = [c['name'] for c in inspector.get_columns('locations')]
    
    if 'schedule' not in columns:
        print("Adding 'schedule' column to 'locations' table...")
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE locations ADD COLUMN schedule JSON"))
            conn.commit()
        print("Column added.")
    else:
        print("'schedule' column already exists.")

if __name__ == "__main__":
    ensure_column()
