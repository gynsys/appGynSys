import sys
import os
from pathlib import Path

# Add backend directory to path
sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.db.base import SessionLocal
from app.db.models.preconsultation import PreconsultationQuestion

def swap_cycle_order():
    db = SessionLocal()
    try:
        # Search by text
        q_dur = db.query(PreconsultationQuestion).filter(PreconsultationQuestion.text.like("%duran tus ciclos%")).first()
        q_freq = db.query(PreconsultationQuestion).filter(PreconsultationQuestion.text.like("%Cada cuántos días%")).first()
        
        if q_dur and q_freq:
            print(f"Found Questions:\nDuration: '{q_dur.text}' (Order {q_dur.order})\nFrequency: '{q_freq.text}' (Order {q_freq.order})")
            
            # Target: Frequency=22, Duration=23
            # We assign to temp values first to avoid unique constraint collisions if strict
            # But usually swapping is fine if deferred, or just brute force it.
            
            q_freq.order = 22
            q_dur.order = 23
            
            db.commit()
            print(f"SUCCESS: Swapped Order.\nFrequency is now {q_freq.order}\nDuration is now {q_dur.order}")
        else:
            print("Questions not found by text.")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    swap_cycle_order()
