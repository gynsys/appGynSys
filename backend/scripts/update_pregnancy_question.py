import asyncio
import os
import sys

# Robust path setup
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_root = os.path.dirname(current_dir) # Go up from scripts/ to backend/
sys.path.insert(0, backend_root)

print(f"Added to sys.path: {backend_root}")

try:
    from app.db.base import SessionLocal
    from app.db.models.preconsultation import PreconsultationQuestion
except ImportError as e:
    print(f"Import Error: {e}")
    print(f"Current Files in {backend_root}/app: {os.listdir(os.path.join(backend_root, 'app'))}")
    sys.exit(1)

async def update_question():
    db = SessionLocal()
    try:
        # Search targets
        targets = [
            "¿Has tenido otros embarazos además del actual?",
            "¿Has tenido otros embarazos además del actual"
        ]
        target_id = "ASK_OTHER_PREGNANCIES"
        new_text = "¿Estas embarazada actualmente?"
        
        updated_count = 0
        
        # 1. Try by ID (Sources of Truth)
        q_by_id = db.query(PreconsultationQuestion).filter(
            PreconsultationQuestion.id == target_id
        ).first()
        
        if q_by_id:
            print(f"Found by ID {target_id}: '{q_by_id.text}'")
            if q_by_id.text != new_text:
                q_by_id.text = new_text
                db.add(q_by_id)
                updated_count += 1
                print(f"Updated by ID to: '{new_text}'")
            else:
                print("Text already matches new text.")

        # 2. Try by Text (Cleanup old versions if any)
        for target in targets:
            questions = db.query(PreconsultationQuestion).filter(
                PreconsultationQuestion.text.like(f"%{target}%")
            ).all()
            
            for q in questions:
                # Avoid double updating if ID match already handled it
                if q_by_id and q.id == q_by_id.id:
                    continue
                    
                print(f"Found by Text Match ID {q.id}: '{q.text}'")
                q.text = new_text
                db.add(q)
                updated_count += 1
        
        if updated_count > 0:
            db.commit()
            print(f"Successfully updated {updated_count} question(s).")
        else:
            print("No updates needed or no matching questions found.")
            
    except Exception as e:
        print(f"Database Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(update_question())
