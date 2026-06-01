import requests

data = {
    "email": "test422@example.com",
    "password": "password123",
    "nombre_completo": "Test User",
    "plan_id": 3
}

response = requests.post("https://api.gynsys.net/api/v1/auth/register", json=data)
print(f"Status: {response.status_code}")
print(f"Response: {response.text}")
