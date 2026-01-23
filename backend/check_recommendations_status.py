
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.models.module import Module

SQLALCHEMY_DATABASE_URL = "postgresql://postgres:gyn13409534@localhost:5432/gynsys"

def check_recommendations_status():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        print("Checking 'Recomendaciones' module status...\n")
        
        rec_module = db.query(Module).filter(Module.code == 'recommendations').first()
        
        if rec_module:
            print(f"✅ Module FOUND:")
            print(f"   ID: {rec_module.id}")
            print(f"   Name: {rec_module.name}")
            print(f"   Code: {rec_module.code}")
            print(f"   Active: {rec_module.is_active}")
            print(f"   Description: {rec_module.description}")
            
            if not rec_module.is_active:
                print("\n⚠️  MODULE IS INACTIVE! Activating it now...")
                rec_module.is_active = True
                db.commit()
                print("✅ Module activated successfully!")
            else:
                print("\n✅ Module is already active.")
        else:
            print("❌ Module 'recommendations' NOT FOUND in database!")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_recommendations_status()
