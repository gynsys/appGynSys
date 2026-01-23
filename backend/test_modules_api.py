
import requests
import json

# First, we need to login to get a token
print("1. Logging in to get admin token...")
login_response = requests.post(
    "http://localhost:8000/api/v1/auth/token",
    data={
        "username": "mariel.herrera@gynsys.com",  # Adjust email if needed
        "password": "mariel123"  # Adjust password if needed
    }
)

if login_response.status_code != 200:
    print(f"❌ Login failed: {login_response.status_code}")
    print(login_response.text)
    exit(1)

token = login_response.json()["access_token"]
print(f"✅ Got token: {token[:20]}...")

# Now call the modules endpoint
print("\n2. Fetching modules from /admin/modules...")
headers = {"Authorization": f"Bearer {token}"}
modules_response = requests.get(
    "http://localhost:8000/api/v1/admin/modules",
    headers=headers
)

print(f"Status Code: {modules_response.status_code}")

if modules_response.status_code == 200:
    modules = modules_response.json()
    print(f"\n✅ Received {len(modules)} modules:")
    for m in modules:
        print(f"  [{m['id']:2d}] {m['code']:25s} | {m['name']}")
    
    # Check if recommendations is in the list
    rec_module = next((m for m in modules if m['code'] == 'recommendations'), None)
    if rec_module:
        print(f"\n✅ FOUND recommendations in API response:")
        print(json.dumps(rec_module, indent=2))
    else:
        print(f"\n❌ recommendations NOT in API response!")
        print("\nModule codes received:")
        print([m['code'] for m in modules])
else:
    print(f"❌ Error: {modules_response.text}")
