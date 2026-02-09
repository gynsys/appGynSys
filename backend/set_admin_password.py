"""
Script to set a password for an OAuth-created admin account
"""
from passlib.context import CryptContext

# Password hasher (same as backend)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Set your desired password
new_password = "TU_PASSWORD_AQUI"  # CHANGE THIS

# Generate hash
password_hash = pwd_context.hash(new_password)

print(f"Password hash for '{new_password}':")
print(password_hash)
print("\nRun this SQL in your database:")
print(f"UPDATE doctors SET password_hash = '{password_hash}' WHERE email = 'marilouh.mh@gmail.com';")
