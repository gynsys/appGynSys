
import sys
import os

# Robustly add the 'backend' folder to sys.path so we can import 'app'
# script is in backend/scripts, so we go up one level to 'backend'
# actually, 'app' is IN backend. So we need to add 'backend' to path? 
# No, if we add '.../backend', then 'import app' works if 'app' is a package inside it.
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir) # c:\...\backend
sys.path.append(backend_dir) 

from app.services.summary_generator import ClinicalSummaryGenerator

# Mock Data matching the NEW input format
text_map = {
    "¿Tu madre tiene antecedentes médicos importantes?": "Sí",  # Boolean (sent as "Sí" or True)
    "Selecciona los antecedentes de tu madre:": ["Diabetes", "Otro: Hipertensión controlada"],
    "¿Tu padre tiene antecedentes médicos importantes?": False,
    "¿Tienes antecedentes médicos personales?": True,
    "Selecciona tus antecedentes personales:": ["Otro: Asma leve"]
}

data_map = {
    "family_history_mother": True,
    "family_history_mother_details": ["Diabetes", "Otro: Hipertensión controlada"], # Note: keys might differ in reality, usually matched by finding text
    "family_history_father": False
}

# The generator relies heavily on text_map keys for matching if keys don't exist in data_map
# Let's simulate what `_find_answer` sees.

print("--- Testing Summary Generation ---")
try:
    # We call specific processors to debug
    print("\nProcessing Medical History...")
    med = ClinicalSummaryGenerator._process_medical_history(text_map, data_map)
    print(f"Result: {med}")
    
    # Test Full Narrative
    print("\nFull Narrative...")
    full = ClinicalSummaryGenerator._generate_full_narrative(text_map, data_map)
    print(full)

except Exception as e:
    print(f"\nCRASHED: {e}")
    import traceback
    traceback.print_exc()

