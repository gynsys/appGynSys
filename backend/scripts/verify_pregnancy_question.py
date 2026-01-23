import asyncio
import os
import sys

# Add backend directory to python path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_root = os.path.dirname(current_dir)
sys.path.insert(0, backend_root)

try:
    from app.db.base import SessionLocal
    from app.db.models.preconsultation import PreconsultationQuestion
except ImportError as e:
    print(f"Import Error: {e}")
    sys.exit(1)

async def check_question():
    db = SessionLocal()
    try:
        # Search targets
        old_text_fragment = "otros embarazos además del actual"
        new_text = "¿Estas embarazada actualmente?"
        
        # Check by ID
        target_id = "ASK_OTHER_PREGNANCIES" # Based on known ID or similar
        
        print("\n--- Checking Database Content ---")
        
        # 1. Check if ANY question has the old text
        old_questions = db.query(PreconsultationQuestion).filter(
            PreconsultationQuestion.text.like(f"%{old_text_fragment}%")
        ).all()
        
        if old_questions:
            print(f"[FAIL] Found {len(old_questions)} questions with OLD text:")
            for q in old_questions:
                print(f"  ID: {q.id} | Text: {q.text}")
        else:
            print("[PASS] No questions found with OLD text.")
            
        # 2. Check if the question with the expected ID has the NEW text
        q_id = db.query(PreconsultationQuestion).filter(
            PreconsultationQuestion.id == target_id
        ).first()

        if q_id:
             print(f"\n[INFO] Question ID '{target_id}':")
             print(f"  Text: {q_id.text}")
             if q_id.text == new_text:
                 print("  [PASS] Text matches expected NEW text.")
             else:
                 print("  [FAIL] Text does NOT match expected NEW text.")
        else:
             # Try finding the new text generic
             new_qs = db.query(PreconsultationQuestion).filter(
                 PreconsultationQuestion.text == new_text
             ).all()
             if new_qs:
                 print(f"\n[PASS] Found question(s) with NEW text '{new_text}':")
                 for q in new_qs:
                     print(f"  ID: {q.id}")
             else:
                 print(f"\n[FAIL] Could not find any question with text '{new_text}'.")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(check_question())
