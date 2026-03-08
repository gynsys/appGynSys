import sys
import os
# Add app directory to sys.path
sys.path.append(os.getcwd())

from app.core.config import settings

print(f"VAPID_PUBLIC_KEY: [{settings.VAPID_PUBLIC_KEY}]")
print(f"VAPID_PRIVATE_KEY: [{settings.VAPID_PRIVATE_KEY}]")
print(f"VAPID_CLAIM_EMAIL: [{settings.VAPID_CLAIM_EMAIL}]")
print(f"EMAILS_FROM_EMAIL: [{settings.EMAILS_FROM_EMAIL}]")

# Check if they have quotes around them
if settings.VAPID_PUBLIC_KEY and settings.VAPID_PUBLIC_KEY.startswith('"'):
    print("WARNING: VAPID_PUBLIC_KEY has literal quotes!")
