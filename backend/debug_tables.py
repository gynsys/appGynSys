from app.db.base import SessionLocal
from app.db.models.doctor import Doctor
from app.db.models.tenant import Tenant
from sqlalchemy import text

db = SessionLocal()
try:
    print("--- Database Info ---")
    
    # Check if tables exist and row counts
    tables = ["doctors", "tenants", "tenant_modules"]
    for table in tables:
        try:
            count = db.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar()
            print(f"Table '{table}': {count} rows")
        except Exception as e:
            print(f"Table '{table}': Not found or error: {e}")

    # Check some data consistency
    docs = db.query(Doctor).limit(3).all()
    print("\n--- Recent Doctors ---")
    for d in docs:
        print(f"ID: {d.id}, Email: {d.email}, Slug: {d.slug_url}")

    tens = db.query(Tenant).limit(3).all()
    print("\n--- Recent Tenants ---")
    for t in tens:
        print(f"ID: {t.id}, Email: {t.email}, Slug: {t.slug}")

except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
