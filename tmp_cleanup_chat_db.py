import sys
import os

# Add the app directory to sys.path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlalchemy import text
from app.db.session import SessionLocal

def cleanup_chat():
    db = SessionLocal()
    try:
        print("Dropping chat tables...")
        # Order matters for constraints
        db.execute(text("DROP TABLE IF EXISTS chat_messages CASCADE"))
        db.execute(text("DROP TABLE IF EXISTS chat_participants CASCADE"))
        db.execute(text("DROP TABLE IF EXISTS chat_rooms CASCADE"))
        
        print("Removing 'chat' module entry...")
        db.execute(text("DELETE FROM modules WHERE code = 'chat'"))
        
        db.commit()
        print("Database cleanup completed successfully.")
    except Exception as e:
        db.rollback()
        print(f"Error during database cleanup: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    cleanup_chat()
