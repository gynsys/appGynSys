
from app.db.base import SessionLocal
from app.db.models.doctor import Doctor
from passlib.context import CryptContext
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def update_credentials():
    session = SessionLocal()
    try:
        doctor = session.query(Doctor).filter(Doctor.slug_url == "mariel-herrera").first()
        if not doctor:
            logger.error("Doctor 'mariel-herrera' not found.")
            return

        # Update Email
        new_email = "milanopabloe@gmail.com"
        doctor.email = new_email
        logger.info(f"Updated email to {new_email}")

        # Update Password
        new_password = "123456"
        doctor.password_hash = pwd_context.hash(new_password)
        logger.info("Updated password to '123456'")

        session.commit()
        logger.info("Successfully updated credentials!")

    except Exception as e:
        logger.error(f"Error updating credentials: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    update_credentials()
