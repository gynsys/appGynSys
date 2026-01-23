import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional
from pydantic import EmailStr
from app.core.config import settings

logger = logging.getLogger(__name__)

async def send_email(
    email_to: EmailStr,
    subject: str = "",
    html_content: str = "",
) -> bool:
    """
    Send an email using SMTP settings from config.
    """
    try:
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
        message["To"] = email_to

        part = MIMEText(html_content, "html")
        message.attach(part)

        # Connect to SMTP server
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(
                settings.EMAILS_FROM_EMAIL,
                email_to,
                message.as_string()
            )
            
        logger.info(f"Email sent successfully to {email_to}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {email_to}: {e}")
        return False

async def send_welcome_email(email_to: EmailStr, name: str) -> bool:
    subject = "¡Bienvenida a Cycle Predictor!"
    try:
        with open("app/templates/welcome_email.html", "r", encoding="utf-8") as f:
            template = f.read()
        
        html_content = template.replace("{{name}}", name)
        return await send_email(email_to, subject, html_content)
    except FileNotFoundError:
        # Fallback template if file missing
        html_content = f"<h1>Hola {name}!</h1><p>Bienvenida a Cycle Predictor.</p>"
        return await send_email(email_to, subject, html_content)
