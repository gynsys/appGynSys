@celery_app.task
def process_google_auth_background(email: str, name: str, token: str):
    """
    Process Google Auth in background:
    1. Verify Token (if not verified)
    2. Create/Update User
    3. Apply Template (Heavy IO)
    4. Send Welcome Email
    """
    # ... logic ...
    pass
