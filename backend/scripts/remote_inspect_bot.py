import sqlite3
import os
from cryptography.fernet import Fernet
import json

ENCRYPTION_KEY = "A8up0W_HbqQ7xs-biRIqLPPAUMZtS1vrQc2QeJ1AhzU="
DB_PATH = "/root/bot/database/medical_bot.db"

def decrypt_field(cipher_text, cipher):
    if not cipher_text:
        return None
    try:
        if isinstance(cipher_text, str):
            cipher_text = cipher_text.encode()
        return cipher.decrypt(cipher_text).decode()
    except Exception:
        return cipher_text # Return as is if decryption fails (might not be encrypted)

def inspect_and_sample():
    if not os.path.exists(DB_PATH):
        print(f"DB not found: {DB_PATH}")
        return

    cipher = Fernet(ENCRYPTION_KEY)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [t[0] for t in cursor.fetchall()]
    print(f"Tables: {tables}")

    if 'medical_histories' in tables:
        cursor.execute("SELECT * FROM medical_histories WHERE status='completed' LIMIT 1")
        row = cursor.fetchone()
        if row:
            # Get column names
            cursor.execute("PRAGMA table_info(medical_histories)")
            cols = [c[1] for c in cursor.fetchall()]
            data = dict(zip(cols, row))
            
            # Sample decryption
            print("\n--- Raw Sample (Completed) ---")
            print(f"ID: {data['id']}, Bot ID: {data.get('bot_id')}")
            
            decrypted = {}
            for k, v in data.items():
                if isinstance(v, (str, bytes)) and len(str(v)) > 20: # Heuristic for encrypted fields
                    decrypted[k] = decrypt_field(v, cipher)
                else:
                    decrypted[k] = v
            
            print("\n--- Decrypted Sample ---")
            print(json.dumps(decrypted, indent=2, ensure_ascii=False))
        else:
            print("No completed histories found.")

    conn.close()

if __name__ == "__main__":
    inspect_and_sample()
