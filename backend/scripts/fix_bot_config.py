import os
import re

path = '/root/bot/config.py'
if os.path.exists(path):
    with open(path, 'r') as f:
        content = f.read()
    
    # Remove any existing malformed or old entries
    content = re.sub(r'\nWEBAPP_SYNC_URL = .*', '', content)
    
    # Append correctly
    content += '\nWEBAPP_SYNC_URL = "https://api.gynsys.net/api/v1/consultations/sync-bot"\n'
    
    with open(path, 'w') as f:
        f.write(content)
    print("Successfully patched config.py")
else:
    print(f"Error: {path} not found")
