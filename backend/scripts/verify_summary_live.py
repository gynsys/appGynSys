import sys
import os
import json
from sqlalchemy import create_engine, text

# Add parent dir to path to find app.services
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.services.summary_generator import ClinicalSummaryGenerator

# Hardcoded config to avoid importing app.core
# Using localhost for script execution
DB_URL = "postgresql://postgres:gyn13409534@localhost:5432/gynsys"

def run_minimal_verification():
    print(f"Connecting to DB: {DB_URL}")
    try:
        engine = create_engine(DB_URL)
        with engine.connect() as conn:
            # 1. Fetch Questions for mapping (id -> text)
            print("Fetching questions...")
            q_result = conn.execute(text("SELECT id, text FROM preconsultation_questions"))
            q_map = {str(row[0]): row[1] for row in q_result}
            print(f"Loaded {len(q_map)} questions.")
            print(f"Sample Question IDs: {list(q_map.keys())[:5]}")
            
            # Count total preconsultations
            count_query = text("SELECT COUNT(*) FROM appointments WHERE preconsulta_answers IS NOT NULL")
            total_count = conn.execute(count_query).scalar()
            print(f"\n>>> TOTAL PRE-CONSULTATIONS IN DB: {total_count} <<<\n")

            # 2. Fetch Latest Appointment with answers
            print("Fetching latest appointment...")
            
            query = text("""
                SELECT id, patient_name, appointment_date, preconsulta_answers 
                FROM appointments 
                WHERE preconsulta_answers IS NOT NULL 
                ORDER BY id DESC 
                LIMIT 1
            """)
            result = conn.execute(query).fetchone()
            
            if not result:
                print("No preconsultation answers found in DB.")
                return

            appt_id, patient, date, answers_raw = result
            # Parse JSON if needed
            if isinstance(answers_raw, str):
                answers = json.loads(answers_raw)
            else:
                answers = answers_raw

            if not answers:
                print("Answers are empty/null.")
                return

            print(f"All Answer Keys: {list(answers.keys())}")

            # Check who the answers belong to
            ans_name = answers.get('full_name', 'Unknown')
            print(f"Processing {len(answers)} answers for Appointment Patient: {patient}")
            print(f"               Answers Name: {ans_name}")

            # 3. Format for Generator
            formatted_answers = []
            matches = 0
            for key, val in answers.items():
                q_text = q_map.get(str(key), "")
                if q_text:
                    matches += 1
                    # Log first few matches to verify text
                    if matches <= 3:
                        print(f"MATCH: {key} -> {q_text[:30]}...")
                
                formatted_answers.append({
                    "question_id": str(key),
                    "text_value": val,
                    "question": {"text": q_text}
                })
            
            print(f"Total Matches found: {matches} out of {len(answers)} keys.")

            # Mock Classes for compatibility
            class MockPatient:
                def __init__(self, name, dob=None):
                    self.name = name
                    self.date_of_birth = dob # Can be None, system handles it

            class MockAppointment:
                def __init__(self, patient):
                    self.patient = patient

            # Logic to guess DOB or use None
            # Fetch patient DOB if possible?
            # For verification script, we can skip DB join and use name as found
            mock_appt = MockAppointment(MockPatient(patient))

            # 4. Generate
            print("Running Generator...")
            summary = ClinicalSummaryGenerator.generate(mock_appt, formatted_answers)
            
            print("\n" + "="*30)
            print("       CLINICAL SUMMARY")
            print("="*30)
            narrative = summary.get('full_narrative_html', 'No narrative generated.')
            clean_text = narrative.replace("<br/>", "\n").replace("<b>", "").replace("</b>", "")
            print(clean_text)
            print("="*30 + "\n")

    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    run_minimal_verification()
