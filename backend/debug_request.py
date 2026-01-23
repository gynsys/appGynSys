
import sys
import os

# Ensure backend directory is in path
sys.path.append(os.getcwd())

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

print("--- STARTING REQUEST DEBUG ---")
try:
    response = client.get("/api/v1/testimonials/public/mariel-herrera")
    print(f"Status: {response.status_code}")
    print(f"Body: {response.text}")
except Exception as e:
    print("--- CAUGHT EXCEPTION ---")
    import traceback
    traceback.print_exc()
