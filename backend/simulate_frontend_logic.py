from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import json
import sys

# DATABASE CONNECTION
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/appgynsys"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

def to_roman(num):
    if not num or num < 1: return ""
    val = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1]
    syb = ["M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"]
    roman_num = ''
    i = 0
    while  num > 0:
        for _ in range(num // val[i]):
            roman_num += syb[i]
            num -= val[i]
        i += 1
    return roman_num

def format_obstetric_history(data):
    """
    Python implementation of frontends formatObstetricHistory
    """
    g, p, c, a = 0, 0, 0, 0
    used_table = False
    
    ho_table = data.get('ho_table_results')
    
    if ho_table:
        print(f"\n[LOGIC] Found ho_table_results: {ho_table} (Type: {type(ho_table)})")
        # Frontend logic: checks for string
        if isinstance(ho_table, str):
            try:
                ho_table = json.loads(ho_table)
                print("[LOGIC] Parsed stringified ho_table_results")
            except:
                ho_table = {}
        
        # Frontend logic: checks lowercase and capitalized
        # Note: In Python .get defaults to None if key missing
        
        def safe_int(v):
            try: return int(v)
            except: return 0
            
        g = safe_int(ho_table.get('gestas') or ho_table.get('Gestas'))
        p = safe_int(ho_table.get('partos') or ho_table.get('Partos'))
        c = safe_int(ho_table.get('cesareas') or ho_table.get('Cesareas'))
        a = safe_int(ho_table.get('abortos') or ho_table.get('Abortos'))
        
        print(f"[LOGIC] Extracted -> G:{g} P:{p} C:{c} A:{a}")
        used_table = True
        
    else:
        print("[LOGIC] No ho_table_results found.")
        
    if g == 0 and p == 0 and c == 0 and a == 0:
        return "Paciente Nuligesta"
        
    parts = []
    if g > 0: parts.append(f"{to_roman(g)}G")
    if p > 0: parts.append(f"{to_roman(p)}P")
    if c > 0: parts.append(f"{to_roman(c)}C")
    if a > 0: parts.append(f"{to_roman(a)}A")
    
    return " ".join(parts)

def simulate_logic(appt_id):
    print(f"--- SIMULATING FRONTEND LOGIC FOR APPOINTMENT {appt_id} ---")
    
    # FETCH
    query = text("SELECT id, patient_name, preconsulta_answers FROM appointments WHERE id = :id")
    result = db.execute(query, {"id": appt_id}).fetchone()
    
    if not result:
        print("Appointment not found")
        return

    raw_json = result[2]
    
    print(f"RAW DB JSON (First 100 chars): {str(raw_json)[:100]}...")
    
    # PARSE (Frontend: try/catch parse)
    answers = {}
    if raw_json:
        if isinstance(raw_json, str):
            try:
                answers = json.loads(raw_json)
                print("[SUCCESS] Parsed main JSON")
            except Exception as e:
                print(f"[ERROR] JSON Parse failed: {e}")
                return
        elif isinstance(raw_json, dict):
            answers = raw_json
    
    # CHECK KEYS
    print("\n--- CHECKING KEYS ---")
    print(f"summary_gyn_obstetric found? {'summary_gyn_obstetric' in answers}")
    print(f"obstetric_history_summary found? {'obstetric_history_summary' in answers}")
    
    if 'obstetric_history_summary' in answers:
        print(f"Value in DB: '{answers['obstetric_history_summary']}'")
        
    # SIMULATE FORMATTER
    print("\n--- RUNNING OBSTETRIC FORMATTER ---")
    generated_summary = format_obstetric_history(answers)
    print(f"GENERATED RESULT: '{generated_summary}'")
    
    # VERDICT
    print("\n--- FINAL UI VERDICT ---")
    target_value = answers.get('summary_gyn_obstetric') or answers.get('obstetric_history_summary') or generated_summary
    print(f"The UI Field 'Historia Gineco-Obstétrica' SHOULD display: '{target_value}'")

if __name__ == "__main__":
    simulate_logic(41) # Hardcoded ID for OTRA PRUEBA
