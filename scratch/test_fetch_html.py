import requests
import re

url = "https://www.thelancet.com/journals/lancet/article/PII-S0140-6736(26)00717-8/fulltext"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

try:
    response = requests.get(url, headers=headers, timeout=10)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        title_match = re.search(r'<title>(.*?)</title>', response.text, re.IGNORECASE)
        if title_match:
            print(f"Title: {title_match.group(1)}")
        else:
            print("No title found.")
except Exception as e:
    print(f"Error: {e}")
