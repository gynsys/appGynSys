import sys
import os

# Add backend root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.email import send_email
import asyncio

async def test_resend():
    test_email = "ie672ca@gmail.com" # User's email from logs or a safe test one
    subject = "Prueba de Integración Resend - GynSys"
    content = "<h1>¡Hola!</h1><p>Esta es una prueba directa de la integración de Resend desde el servidor.</p>"

    # Test 1: Onboarding (Safe Fallback)
    sender_fallback = "onboarding@resend.dev" 
    print(f"Test 1: Sending from {sender_fallback}...")
    
    import resend
    from app.core.config import settings
    resend.api_key = settings.RESEND_API_KEY
    
    try:
        email = resend.Emails.send({
            "from": sender_fallback,
            "to": [test_email],
            "subject": f"{subject} (Fallback)",
            "html": content,
        })
        print(f"SUCCESS (Fallback): Resend ID: {email}")
    except Exception as e:
        print(f"FAILED (Fallback): {e}")

    # Test 2: GynSys.net (User Domain)
    sender_domain = "info@gynsys.net"
    print(f"\nTest 2: Sending from {sender_domain}...")
    try:
        email = resend.Emails.send({
            "from": sender_domain,
            "to": [test_email],
            "subject": f"{subject} (Domain)",
            "html": content,
        })
        print(f"SUCCESS (Domain): Resend ID: {email}")
    except Exception as e:
        print(f"FAILED (Domain): {e}")
        print("NOTE: Verify that 'gynsys.net' is added and verified in the Resend Dashboard.")

    return
        
    # success = await send_email(test_email, subject, content)

if __name__ == "__main__":
    asyncio.run(test_resend())
