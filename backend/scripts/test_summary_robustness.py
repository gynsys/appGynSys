import sys
import os
import json
from datetime import datetime

# Add backend directory to sys.path to allow imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.services.summary_generator import ClinicalSummaryGenerator

# Mock Class to simulate SQLAlchemy Question object if needed, 
# but the generator handles dicts too. We'll use dicts for simplicity.

def run_test(name, answers_dict):
    """
    Runs a test case.
    answers_dict: { "Question Text": "Answer Value" }
    """
    print(f"\n{'='*20} ORDEN DE PRUEBA: {name} {'='*20}")
    
    # Convert simple dict to the format expected by Generator
    # [{'question_id': 'MOCK_1', 'text_value': '...', 'question': {'text': '...'}}]
    input_payload = []
    i = 0
    for q_text, val in answers_dict.items():
        i += 1
        input_payload.append({
            "question_id": f"MOCK_{i}",
            "text_value": str(val),
            "question": {"text": q_text}
        })

    # Generate
    try:
        result = ClinicalSummaryGenerator.generate(input_payload)
        
        print(f"\n--- Resumen Generado ({name}) ---")
        print(f"GENERAL: {result.get('general')}")
        print(f"MÉDICOS: {result.get('medical')}")
        print(f"GINECO : {result.get('obstetric')}")
        print(f"FUNC.  : {result.get('functional')}")
        print(f"ESTILO : {result.get('lifestyle')}")
        print("-" * 60)
    except Exception as e:
        print(f"ERROR GENERATING SUMMARY: {e}")
        import traceback
        traceback.print_exc()

def main():
    # --- SCENARIO 1: Nuligesta, Healthy, Young ---
    case_1 = {
        "Por favor, ingresa tu nombre completo:": "Ana María Pérez",
        "¿Cuál es tu edad?": "24",
        "¿Cuál es tu ocupación?": "Estudiante",
        
        # Medical
        "¿Tu madre tiene antecedentes médicos importantes?": "No",
        "¿Tu padre tiene antecedentes médicos importantes?": "No",
        "¿Tienes antecedentes médicos personales?": "No",
        "¿Te has realizado alguna cirugía?": "No",
        "¿Tomas algún suplemento o vitamina?": "No",

        # Gyn
        "¿A qué edad tuviste tu primera menstruación?": "12",
        "¿A qué edad iniciaste tu vida sexual?": "18",
        "¿Tus ciclos menstruales son regulares?": "True", # Boolean true
        "¿Sufres de dolor menstrual (dismenorrea)?": "No",
        "¿Cuál fue la fecha de tu última menstruación?": "2024-12-01",
        "¿Usas algún método anticonceptivo?": "Sí",
        "Selecciona tus métodos anticonceptivos:": "Pastillas",
        "¿Cuándo fue tu última citología (Papanicolau)?": "2024-01-15",

        # Obs
        "Indica tu historial Obstétrico:": "Nuligesta (Ningún embarazo)",

        # Functional
        "¿Sientes dolor durante las relaciones sexuales?": "No",
        "¿Sientes dolor en las piernas?": "No",
        "¿Tienes problemas urinarios?": "No",
        "¿Tienes síntomas gastrointestinales ANTES de la regla?": "No",

        # Habits
        "¿Fumas?": "No",
        "¿Consumes alcohol?": "No",
        "¿Realizas actividad física?": "Sí",
        "¿Cuál es tu objetivo principal?": "Salud" # Context only
    }

    # --- SCENARIO 2: Multigesta, Pathology, Symptoms ---
    case_2 = {
        "Por favor, ingresa tu nombre completo:": "Elena Rodríguez",
        "¿Cuál es tu edad?": "45",
        "¿Cuál es tu ocupación?": "Abogada",

        # Medical
        "¿Tu madre tiene antecedentes médicos importantes?": "True",
        "Selecciona los antecedentes de tu madre:": "Hipertensión, Diabetes",
        "¿Tu padre tiene antecedentes médicos importantes?": "False",
        "¿Tienes antecedentes médicos personales?": "True",
        "Selecciona tus antecedentes personales:": "Asma",
        "¿Te has realizado alguna cirugía?": "True",
        "Describe tus cirugías previas:": "Apendicectomía (2010)",

        # Gyn
        "¿A qué edad tuviste tu primera menstruación?": "11",
        "¿Tus ciclos menstruales son regulares?": "False",
        "¿Sufres de dolor menstrual (dismenorrea)?": "True",
        "Del 1 al 10, ¿qué tan fuerte es el dolor?": "8",
        "¿Cuál fue la fecha de tu última menstruación?": "2024-11-20",
        "¿Usas algún método anticonceptivo?": "No",

        # Obs
        "Indica tu historial Obstétrico:": "Multigesta (Varios embarazos)",
        "¿Hubo complicaciones en el parto?": "Preeclampsia",

        # Functional (Positive findings)
        "¿Sientes dolor durante las relaciones sexuales?": "True",
        "¿El dolor es superficial o profundo?": "Profundo",
        "Del 1 al 10, ¿qué tan fuerte es el dolor profundo?": "7",
        "¿Sientes dolor en las piernas?": "True",
        "¿En qué zona sientes el dolor?": "Pantorrillas",
        "¿Tienes síntomas gastrointestinales ANTES de la regla?": "True",
        "Selecciona los síntomas (Antes):": "Distensión, Gases",

        # Habits
        "¿Fumas?": "True", 
        "¿Consumes alcohol?": "Ocasional",
        "¿Realizas actividad física?": "No"
    }

    # --- SCENARIO 3: Primigesta (First Pregnancy) ---
    case_3 = {
        "Por favor, ingresa tu nombre completo:": "Sofía G.",
        "¿Cuál es tu edad?": "28",
        
        # Gyn
        "¿Cuál fue la fecha de tu última menstruación?": "2024-09-15",
        "¿Usas algún método anticonceptivo?": "No",

        # Obs
        "Indica tu historial Obstétrico:": "Primigesta (Primer embarazo)",
        # Note: Primigesta skips complications qs usually, so none provided

        # Functional
        "¿Sientes dolor durante las relaciones sexuales?": "No",
        "¿Tienes problemas urinarios?": "True", # Common in pregnancy
        "¿Sientes dolor al orinar?": "No",
        "¿Sientes irritación urinaria?": "Sí",

        # Habits
        "¿Fumas?": "No",
        "¿Consumes alcohol?": "No"
    }

    print("Iniciando prueba de robustez del Generador de Resúmenes...\n")
    
    run_test("CASO 1: Paciente Sana / Nuligesta", case_1)
    run_test("CASO 2: Paciente Compleja / Multigesta / Síntomas", case_2)
    run_test("CASO 3: Paciente Embarazada (Primigesta)", case_3)

if __name__ == "__main__":
    main()
