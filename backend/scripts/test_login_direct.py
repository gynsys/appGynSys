import requests

def test_login():
    url = "http://localhost:8000/api/v1/auth/token"
    payload = {
        "username": "admin@gynsys.com",
        "password": "12345678"
    }
    headers = {
        "Content-Type": "application/x-www-form-urlencoded"
    }
    
    try:
        print(f"Attempting login to {url}...")
        response = requests.post(url, data=payload, headers=headers)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ Login successful!")
        else:
            print("❌ Login failed.")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_login()
