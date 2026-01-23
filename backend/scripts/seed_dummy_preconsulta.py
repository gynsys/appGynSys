
import sys
import os
import json
from sqlalchemy import create_engine, text

# DB Connection
DB_URL = "postgresql://postgres:gyn13409534@localhost:5432/gynsys"

def seed_dummy_data():
    print(f"Connecting to DB: {DB_URL}")
    try:
        engine = create_engine(DB_URL)
        with engine.connect() as conn:
            # 1. Get latest appointment ID
            result = conn.execute(text("SELECT id FROM appointments ORDER BY id DESC LIMIT 1")).fetchone()
            if not result:
                print("No appointments found to seed.")
                return
            
            appt_id = result[0]
            print(f"Seeding data for Appointment ID: {appt_id}")
            
            # 2. Get questions map to simulate realistic keys (using text matching if needed, or just raw keys if backend handles it)
            # Backend summary generator matches keys OR text. I will use text keys for robustness as that's what frontend sends often?
            # Actually frontend sends ID keys. Backend maps ID -> Text -> Answer.
            # But the backend summary generator allows matching by Question Text if available.
            # Let's see what `verify_summary_live` does. It fetches text from `preconsultation_questions`.
            # So I need to fetch the IDs of the questions to construct the answer map correctly.
            
            q_res = conn.execute(text("SELECT id, text FROM preconsultation_questions"))
            q_map = {row[1]: str(row[0]) for row in q_res} # Text -> ID
            
            # Helper to get ID by partial text
            def get_id(part):
                for t, i in q_map.items():
                    if part.lower() in t.lower():
                        return i
                return "UNKNOWN_Q"

            # Construct Answers
            answers = {
                # General
                get_id("nombre completo"): "Isabella Dummy",
                get_id("cuál es tu edad"): "28",
                get_id("dirección de residencia"): "Caracas, Venezuela",
                
                # Medical
                get_id("madre tiene antecedentes"): True,
                get_id("antecedentes de tu madre"): ["Diabetes", "Otro: Hipertensión controlada"],
                get_id("padre tiene antecedentes"): False,
                get_id("antecedentes médicos personales"): True,
                get_id("selecciona tus antecedentes personales"): ["Otro: Asma leve"],
                get_id("cirugía"): True,
                get_id("describe tus cirugías"): "Apendicectomía 2015",
                
                # Gyn
                get_id("primera menstruación"): "12",
                get_id("vida sexual"): "18",
                get_id("sexualmente activa"): True,
                get_id("ciclos menstruales"): True,
                get_id("dolor menstrual"): True,
                get_id("intensidad"): "7",
                get_id("última menstruación"): "10/12/2024",
                get_id("método anticonceptivo"): True,
                get_id("selecciona tus métodos"): ["Pastillas"],
                
                # Obstetric
                get_id("historial obstétrico"): "Nuligesta (Ningún embarazo)",
                
                # Lifestyle
                get_id("fuma"): False,
                get_id("alcohol"): "Ocasionalmente",
                get_id("actividad física"): True,
                get_id("frecuencia"): "3 veces por semana"
            }
            
            print(f"Constructed {len(answers)} answers.")
            
            # Update DB
            update_sql = text("UPDATE appointments SET preconsulta_answers = :ans WHERE id = :id")
            conn.execute(update_sql, {"ans": json.dumps(answers), "id": appt_id})
            conn.commit()
            print("Successfully seeded dummy answers!")
            
    except Exception as e:
        print(f"Error seeding: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    seed_dummy_data()
