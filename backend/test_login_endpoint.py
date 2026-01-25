import requests
import json

url = "http://localhost:8000/api/v1/auth/login/google"
payload = {"token": "fake_token_for_testing_crash"}
headers = {"Content-Type": "application/json"}

print(f"Sending POST to {url}...")
try:
    response = requests.post(url, json=payload, headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.text}")
    
    if response.status_code == 500:
        print("CRITICAL: Server returned 500. The crash is reproducible.")
    elif response.status_code == 401:
        print("SUCCESS: Server handled invalid token correctly (401). Logic is working.")
    else:
        print(f"Unexpected status: {response.status_code}")

except Exception as e:
    print(f"Connection failed: {e}")
