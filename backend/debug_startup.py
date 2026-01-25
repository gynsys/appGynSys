import sys
import os

# Add current directory to path so we can import app
sys.path.append(os.getcwd())

print("🔍 Testing Backend Startup Integrity...")

try:
    print("1. Importing Settings...")
    from app.core.config import settings
    print(f"   ✅ Settings loaded. DB URL: {settings.DATABASE_URL.split('@')[-1]}") # Hide password

    print("2. Importing Database Base...")
    from app.db.base import Base
    print("   ✅ Base loaded.")

    print("3. Importing Models (via app.db.base)...")
    # This triggers the import of all models defined in base.py
    # If there is a relationship error, it often triggers here or during configure_mappers
    from sqlalchemy.orm import configure_mappers
    configure_mappers()
    print("   ✅ Models mapped successfully.")

    print("4. Importing Main App...")
    from app.main import app
    print("   ✅ FastAPI App loaded.")

    print("\n🎉 SUCCESS! The backend code seems importable and valid.")

except Exception as e:
    print(f"\n❌ CRITICAL STARTUP ERROR: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
