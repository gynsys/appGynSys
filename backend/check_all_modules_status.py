
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.models.module import Module

SQLALCHEMY_DATABASE_URL = "postgresql://postgres:gyn13409534@localhost:5432/gynsys"

def check_all_modules():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        all_modules = db.query(Module).all()
        print(f"Total modules in DB: {len(all_modules)}\n")
        
        for m in all_modules:
            status = "✅ ACTIVE" if m.is_active else "❌ INACTIVE"
            print(f"{status} | ID: {m.id:2d} | Code: {m.code:25s} | Name: {m.name}")
            
        inactive = [m for m in all_modules if not m.is_active]
        if inactive:
            print(f"\n⚠️  Found {len(inactive)} INACTIVE modules:")
            for m in inactive:
                print(f"   - {m.name} ({m.code})")
                
    finally:
        db.close()

if __name__ == "__main__":
    check_all_modules()
