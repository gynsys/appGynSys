
from sqlalchemy import create_engine, text

SQLALCHEMY_DATABASE_URL = "postgresql://postgres:gyn13409534@localhost:5432/gynsys"

engine = create_engine(SQLALCHEMY_DATABASE_URL)

with engine.connect() as conn:
    result = conn.execute(text("SELECT id, code, name, is_active FROM modules WHERE code = 'cycle_predictor'"))
    row = result.fetchone()
    
    if row:
        print(f"✅ FOUND: cycle_predictor")
        print(f"   ID: {row.id}")
        print(f"   Name: {row.name}")
        print(f"   Active: {row.is_active}")
    else:
        print("❌ cycle_predictor NOT FOUND in database!")
        print("\nLet me search ALL modules:")
        result = conn.execute(text("SELECT id, code, name FROM modules ORDER BY id"))
        for r in result:
            print(f"  [{r.id}] {r.code} - {r.name}")
