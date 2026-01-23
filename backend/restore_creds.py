
from sqlalchemy import create_engine, text
from app.core.config import settings
from passlib.context import CryptContext
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def restore_credentials():
    engine = create_engine(settings.DATABASE_URL)
    
    # Credentials to restore
    # milanopabloe@gmail.com -> Dr. Mariel Profile (user)
    # admin@appgynsys.com -> Admin (admin)
    
    users = [
        {
            "email": "milanopabloe@gmail.com",
            "password": "marielpassword", # Temporary password to be changed
            "role": "user",
            "nombre": "Dra. Mariel Herrera",
            "slug": "mariel-herrera"
        },
        {
            "email": "admin@appgynsys.com",
            "password": "adminpassword", # Temporary password to be changed
            "role": "admin",
            "nombre": "Administrador",
            "slug": "admin-system"
        }
    ]
    
    with engine.connect() as conn:
        for user in users:
            hashed_pwd = get_password_hash(user["password"])
            
            # Check if user exists by email OR slug
            result = conn.execute(text("SELECT id FROM doctors WHERE email = :email OR slug_url = :slug"), 
                                 {"email": user["email"], "slug": user["slug"]})
            row = result.fetchone()
            
            if row:
                # Update existing user
                conn.execute(text("""
                    UPDATE doctors 
                    SET password_hash = :hash, role = :role, is_active = true, status = 'approved', email = :email
                    WHERE id = :id
                """), {"hash": hashed_pwd, "role": user["role"], "email": user["email"], "id": row[0]})
                logger.info(f"Updated credentials for {user['email']}")
            else:
                # Create user if it doesn't exist (only if it's the admin or if we need a fresh start)
                # For Mariel, it should already exist from the seed
                conn.execute(text("""
                    INSERT INTO doctors (email, password_hash, nombre_completo, slug_url, role, is_active, status)
                    VALUES (:email, :hash, :nombre, :slug, :role, true, 'approved')
                """), {
                    "email": user["email"], 
                    "hash": hashed_pwd, 
                    "nombre": user["nombre"], 
                    "slug": user["slug"], 
                    "role": user["role"]
                })
                logger.info(f"Created user {user['email']} with role {user['role']}")
        
        conn.commit()
    logger.info("Credentials restoration complete.")

if __name__ == "__main__":
    restore_credentials()
