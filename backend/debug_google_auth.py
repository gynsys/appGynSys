import sys
print(f"Python Executable: {sys.executable}")
print(f"Python Version: {sys.version}")

try:
    print("Attempting to import google.oauth2.id_token...")
    from google.oauth2 import id_token
    from google.auth.transport import requests
    print("SUCCESS: google-auth is installed and importable.")
except ImportError as e:
    print(f"FAILURE: Could not import google-auth. Error: {e}")
except Exception as e:
    print(f"FAILURE: Unexpected error: {e}")
