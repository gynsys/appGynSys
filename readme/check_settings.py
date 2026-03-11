from app.core.config import settings
import json

def check_settings():
    print(f"DEBUG: VAPID_PUBLIC_KEY: >{settings.VAPID_PUBLIC_KEY}<")
    print(f"DEBUG: VAPID_PRIVATE_KEY: >{'*' * len(settings.VAPID_PRIVATE_KEY) if settings.VAPID_PRIVATE_KEY else 'None'}<")
    print(f"DEBUG: VAPID_CLAIM_EMAIL: >{settings.VAPID_CLAIM_EMAIL}<")

if __name__ == "__main__":
    check_settings()
