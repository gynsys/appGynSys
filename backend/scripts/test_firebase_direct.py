import os
import sys

# Add current directory and its parent to path to find 'app'
sys.path.append(os.getcwd())
if os.path.basename(os.getcwd()) == "scripts":
    sys.path.append(os.path.dirname(os.getcwd()))

from firebase_admin import messaging
from app.services.push_service import _init_firebase

def test_token_direct(token: str):
    print(f"Testing DIRECT push notification to token: {token[:20]}...")
    
    # Ensure firebase is initialized
    _init_firebase()
    
    message = messaging.Message(
        notification=messaging.Notification(
            title="Prueba Directa GynSys",
            body="¡Si recibes esto, el puente Firebase-GynSys es 100% funcional!",
        ),
        data={"url": "/admin/dashboard", "test": "true"},
        token=token
    )
    
    try:
        response = messaging.send(message)
        print(f"Successfully sent message: {response}")
        return True
    except Exception as e:
        print(f"Error sending message: {e}")
        return False

if __name__ == "__main__":
    test_token = "fqgpFReoTA6I0q9Rhjpj1S:APA91bEVgF65jJP8VFYgFtdB3f8CclxrF4SrZv0R5NgEbS1S0HTxOvDER3BCF-U7kbzhd4TLhUqWBFaBv7KbXzcMQlm2xWctkleditFFP07NYDgwoqmSfoE"
    test_token_direct(test_token)
