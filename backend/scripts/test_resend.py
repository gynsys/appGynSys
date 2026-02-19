import sys
import os

# Add backend root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.email import send_email
import asyncio

async def test_resend():
    print("--- Testing Resend Integration ---")
    test_email = "ie672ca@gmail.com" # User's email from logs or a safe test one
    subject = "Prueba de Integración Resend - GynSys"
    content = "<h1>¡Hola!</h1><p>Esta es una prueba directa de la integración de Resend desde el servidor.</p>"
    
    print(f"Sending test email to: {test_email}...")
    success = await send_email(test_email, subject, content)
    
    if success:
        print("SUCCESS: Resend reported successful delivery.")
    else:
        print("FAILED: Check backend logs for errors.")

if __name__ == "__main__":
    asyncio.run(test_resend())
