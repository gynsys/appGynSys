
import logging
from sqlalchemy import text
from app.db.base import SessionLocal

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_data():
    db = SessionLocal()
    try:
        # 1. Check if user 1212pemc@gmail.com exists
        print("\n--- Checking for User: 1212pemc@gmail.com ---")
        query_user = text("SELECT id, email, nombre_completo FROM cycle_users WHERE email = '1212pemc@gmail.com'")
        user = db.execute(query_user).fetchone()
        
        if user:
            print(f"FOUND: ID={user.id}, Email={user.email}, Name={user.nombre_completo}")
        else:
            print("NOT FOUND: User 1212pemc@gmail.com does not exist in cycle_users table.")
            # Let's see the latest 5 users to be sure
            print("\n--- Latest 5 Registered Users ---")
            query_latest = text("SELECT id, email, created_at FROM cycle_users ORDER BY created_at DESC LIMIT 5")
            latest = db.execute(query_latest).fetchall()
            for u in latest:
                print(f"ID={u.id}, Email={u.email}, Created={u.created_at}")

        # 2. Check Push Subscriptions
        print("\n--- Push Subscription Statistics ---")
        count_push = db.execute(text("SELECT count(*) FROM push_subscriptions")).scalar()
        print(f"Total Push Subscriptions in DB: {count_push}")
        
        if count_push > 0:
            print("\n--- Users with Active Push Subscriptions ---")
            query_push_users = text("""
                SELECT u.id, u.email, count(ps.id) as sub_count
                FROM cycle_users u
                JOIN push_subscriptions ps ON u.id = ps.user_id
                GROUP BY u.id, u.email
            """)
            push_users = db.execute(query_push_users).fetchall()
            for pu in push_users:
                print(f"User ID: {pu.id}, Email: {pu.email}, Active Subs: {pu.sub_count}")
        else:
            print("No push subscriptions found in the database.")

    except Exception as e:
        print(f"Error during data check: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_data()
