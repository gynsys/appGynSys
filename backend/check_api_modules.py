
import requests

try:
    response = requests.get("http://localhost:8000/api/v1/admin/modules", timeout=5)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        modules = response.json()
        print(f"\nTotal modules returned: {len(modules)}")
        for m in modules:
            print(f"  [{m['id']}] {m['name']} ({m['code']}) - Active: {m['is_active']}")
    else:
        print(f"Error: {response.text}")
except Exception as e:
    print(f"Error connecting to API: {e}")
