
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "postgresql://postgres:gyn13409534@localhost:5432/gynsys"

def compare_modules():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Get the 3 working modules
        working_codes = ['blog', 'endometriosis_test', 'cycle_predictor']
        
        print("=" * 80)
        print("COMPARISON: Working modules vs Recommendations")
        print("=" * 80)
        
        result = db.execute(text("SELECT * FROM modules WHERE code IN ('blog', 'endometriosis_test', 'cycle_predictor', 'recommendations') ORDER BY id"))
        
        for row in result:
            status = "✅ WORKS" if row.code in working_codes else "❌ DOESN'T WORK"
            print(f"\n{status} | {row.name} ({row.code})")
            print(f"  ID: {row.id}")
            print(f"  is_active: {row.is_active}")
            print(f"  created_at: {row.created_at}")
            print(f"  updated_at: {row.updated_at}")
            
        # Check if there's any other table that might be filtering
        print("\n" + "=" * 80)
        print("Checking for additional filtering tables...")
        print("=" * 80)
        
        # Check if there's a table that defines "visible" modules
        result = db.execute(text("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE '%module%'
            ORDER BY table_name
        """))
        
        tables = result.fetchall()
        print(f"\nTables with 'module' in name: {[t[0] for t in tables]}")
        
    finally:
        db.close()

if __name__ == "__main__":
    compare_modules()
