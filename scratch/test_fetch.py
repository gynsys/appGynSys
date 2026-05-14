import requests

url = "https://www.thelancet.com/action/showPdf?pii=S0140-6736%2826%2900717-8"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

try:
    response = requests.get(url, headers=headers, timeout=10)
    print(f"Status: {response.status_code}")
    print(f"Content-Type: {response.headers.get('Content-Type')}")
    if response.status_code == 200:
        print(f"Content length: {len(response.content)}")
        # If it's a PDF, maybe save it or check first few bytes
        if "pdf" in response.headers.get("Content-Type", "").lower():
            print("Successfully fetched PDF content!")
except Exception as e:
    print(f"Error: {e}")
