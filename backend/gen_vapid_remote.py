from pywebpush import vapid_helper
import json

def generate():
    keys = vapid_helper.generate_vapid_keys()
    print("---VAPID KEYS START---")
    print(f"VAPID_PUBLIC_KEY={keys['public_key']}")
    print(f"VAPID_PRIVATE_KEY={keys['private_key']}")
    print("---VAPID KEYS END---")

if __name__ == "__main__":
    generate()
