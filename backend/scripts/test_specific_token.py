import os
import sys

# Add current directory and its parent to path to find 'app'
sys.path.append(os.getcwd())
if os.path.basename(os.getcwd()) == "scripts":
    sys.path.append(os.path.dirname(os.getcwd()))

from app.services.push_service import send_push_to_actor
from app.db.base import SessionLocal
from app.db.models.doctor import Doctor

def test_token_push(token: str):
    print(f"Testing push notification to token: {token[:20]}...")
    
    db = SessionLocal()
    try:
        # We need an actor to "own" the subscription for the generic function
        # Let's pick mariel-herrera
        actor = db.query(Doctor).filter(Doctor.slug_url == 'mariel-herrera').first()
        if not actor:
            print("Doctor mariel-herrera not found")
            return
            
        print(f"Using actor: {actor.nombre_completo}")
        
        # We simulate a "mock" subscription object
        class MockSub:
            def __init__(self, token, id):
                self.token = token
                self.id = id
        
        mock_sub = MockSub(token, 9999)
        
        # Override actor's subscriptions for this test
        # Note: In the real function it accesses them via relationships
        # We'll just temporarily mock the attribute
        original_subs = getattr(actor, 'doctor_push_subscriptions', [])
        actor.doctor_push_subscriptions = [mock_sub]
        
        try:
            result = send_push_to_actor(
                actor=actor,
                title="Prueba Final GynSys",
                body="¡Si recibes esto, el sistema es 100% reactivo!",
                data={"url": "/admin/dashboard"}
            )
            print(f"Result: {result}")
        finally:
            actor.doctor_push_subscriptions = original_subs
    finally:
        db.close()

if __name__ == "__main__":
    test_token = "fqgpFReoTA6I0q9Rhjpj1S:APA91bEVgF65jJP8VFYgFtdB3f8CclxrF4SrZv0R5NgEbS1S0HTxOvDER3BCF-U7kbzhd4TLhUqWBFaBv7KbXzcMQlm2xWctkleditFFP07NYDgwoqmSfoE"
    test_token_push(test_token)
