from py_vapid import Vapid01
import base64

# Generate VAPID keys
vapid = Vapid01()
vapid.generate_keys()

# Save to temp files
vapid.save_key('/tmp/vapid_private.pem')
vapid.save_public_key('/tmp/vapid_public.pem')

# Read PEM files and extract base64 (remove headers/footers)
with open('/tmp/vapid_private.pem', 'r') as f:
    pem_private = f.read()
    # Remove PEM headers and newlines
    private_b64 = ''.join([line for line in pem_private.split('\n') 
                           if not line.startswith('-----')])

with open('/tmp/vapid_public.pem', 'r') as f:
    pem_public = f.read()
    # Remove PEM headers and newlines
    public_b64 = ''.join([line for line in pem_public.split('\n') 
                          if not line.startswith('-----')])

print(f'VAPID_PRIVATE_KEY="{private_b64}"')
print(f'VAPID_PUBLIC_KEY="{public_b64}"')

import os
os.remove('/tmp/vapid_private.pem')
os.remove('/tmp/vapid_public.pem')
