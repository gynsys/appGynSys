import sys
import os

# Add backend root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.email import send_email
import asyncio

async def test_resend():
    # Resend restricts free tier/unverified domains to onboarding@resend.dev
    # or the specific verified domain. 
    # Since the user hasn't verified gynsys.com yet on Resend, we must use the test sender.
    sender = "onboarding@resend.dev" 
    
    print(f"Sending test email to: {test_email} from {sender}...")
    # Update send_email to allow overriding sender if possible, 
    # but send_email uses settings.EMAILS_FROM_EMAIL. 
    # We might need to temporarily mock settings or just test the library directly.
    
    import resend
    from app.core.config import settings
    resend.api_key = settings.RESEND_API_KEY
    
    params = {
        "from": "onboarding@resend.dev",
        "to": [test_email],
        "subject": subject,
        "html": content,
    }
    
    try:
        email = resend.Emails.send(params)
        print(f"SUCCESS: Resend ID: {email}")
        return
    except Exception as e:
        print(f"FAILED DIRECT RESEND: {e}")
        
    # success = await send_email(test_email, subject, content)

if __name__ == "__main__":
    asyncio.run(test_resend())
