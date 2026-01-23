import requests
import sys

def get_token():
    url = "http://localhost:8000/api/v1/auth/token"
    data = {
        "username": "admin@gynsys.com",
        "password": "admin123"
    }
    response = requests.post(url, data=data)
    if response.status_code == 200:
        return response.json()["access_token"]
    else:
        print(f"Failed to get token: {response.text}")
        sys.exit(1)

def test_admin_tenants():
    token = get_token()
    url = "http://localhost:8000/api/v1/admin/tenants"
    headers = {
        "Authorization": f"Bearer {token}"
    }
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        print("Success! Tenants:")
        print(response.json())
    else:
        print(f"Failed to get tenants: {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    test_admin_tenants()
