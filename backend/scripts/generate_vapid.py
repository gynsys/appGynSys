from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization
import base64

def generate_vapid_keys():
    # Generate private key (SECP256R1)
    private_key = ec.generate_private_key(ec.SECP256R1())
    
    # Get PEM of private key
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    ).decode('utf-8')

    # Get Public Key in base64url (uncompressed point) for browser
    public_key = private_key.public_key()
    public_bytes = public_key.public_bytes(
        encoding=serialization.Encoding.X962,
        format=serialization.PublicFormat.UncompressedPoint
    )

    def b64url(data):
        return base64.urlsafe_b64encode(data).decode('utf-8').rstrip('=')

    print("--- VAPID PRIVATE KEY (PEM) ---")
    print(private_pem)
    print("--- VAPID PUBLIC KEY (Base64URL) ---")
    print(b64url(public_bytes))

if __name__ == "__main__":
    generate_vapid_keys()
