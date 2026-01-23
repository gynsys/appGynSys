from app.db.base import Base, engine
from app.db.models.cycle_user import CycleUser
from sqlalchemy import text

def fix_table():
    print("Creating missing tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created.")

    # verify
    with engine.connect() as conn:
        result = conn.execute(text("SELECT to_regclass('public.cycle_users')"))
        print(f"Check result: {result.scalar()}")

if __name__ == "__main__":
    fix_table()
