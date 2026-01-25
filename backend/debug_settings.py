import sys
import os

# Ensure we can import from app
sys.path.append(os.getcwd())

try:
    from app.core.config import settings
    print(f"GOOGLE_CLIENT_ID from settings: {settings.GOOGLE_CLIENT_ID}")
    
    if settings.GOOGLE_CLIENT_ID:
        print("SUCCESS: Settings loaded correctly.")
    else:
        print("FAILURE: GOOGLE_CLIENT_ID is None or Empty.")
        
except Exception as e:
    print(f"FAILURE: Could not import settings. {e}")
