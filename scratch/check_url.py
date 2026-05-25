import urllib.request

try:
    url = 'https://gynsys.net/assets/index-uCqw2lKI.js'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response:
        content = response.read().decode('utf-8')
        print(f"Success! Length: {len(content)}")
        print(f"Contains 'CARGAR INFORME RECIENTE': {'CARGAR INFORME RECIENTE' in content}")
        print(f"Contains 'Cargar Otro Informe Reciente': {'Cargar Otro Informe Reciente' in content}")
        print(f"Contains 'top-3 right-3': {'top-3 right-3' in content}")
except Exception as e:
    print(f"Error fetching URL: {e}")
