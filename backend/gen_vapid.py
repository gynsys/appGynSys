import v_v  # Wait, pywebpush might not be installed here.
# I will use a more standard approach if possible or just try to import.
try:
    from pywebpush import vapid_helper
    keys = vapid_helper.generate_vapid_keys()
    print(f"VAPID_PUBLIC_KEY={keys['public_key']}")
    print(f"VAPID_PRIVATE_KEY={keys['private_key']}")
except ImportError:
    print("pywebpush not installed locally. I'll use another way.")
