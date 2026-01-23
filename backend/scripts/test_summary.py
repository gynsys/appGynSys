import sys
import os
from datetime import datetime

# Fix path to map to backend
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.services.summary_generator import ClinicalSummaryGenerator

# Mock Answer Object
class MockAnswer:
    def __init__(self, qid, text, value):
        self.question_id = qid
        self.text_value = value
        self.question = MockQuestion(text)

class MockQuestion:
    def __init__(self, text):
        self.text = text

def run_test():
    print("--- Running Clinical Summary Generator Tests ---\n")

    # CASE 1: Healthy (Nuligesta)
    answers_1 = [
        MockAnswer(1, "¿Indica tu historial Obstétrico?", "Nuligesta"),
        MockAnswer(2, "Fecha de última menstruación", "2023-12-15"),
        MockAnswer(3, "¿Sientes dolor pélvico?", "No"),
        MockAnswer(4, "¿Sientes dolor durante las relaciones sexuales?", "No"),
        MockAnswer(5, "¿Sientes dolor en las piernas?", "No"),
        MockAnswer(6, "¿Fumas?", "No"),
        MockAnswer(7, "¿Consumes alcohol?", "No"),
        MockAnswer(8, "¿Realizas actividad física?", "Sí"),
        MockAnswer(9, "¿Qué tipo de actividad?", "Crossfit"),
    ]
    print(f"CASE 1 (Healthy):\n{ClinicalSummaryGenerator.generate(answers_1)['narrative_full']}\n")

    # CASE 2: Obstetric Complex
    answers_2 = [
        MockAnswer(1, "¿Indica tu historial Obstétrico?", "Multigesta"),
        # Assuming table data is not easily mocked yet, just testing the status
        MockAnswer(2, "Fecha de última menstruación", "2023-12-01"),
        MockAnswer(3, "¿Sientes dolor pélvico?", "Sí"),
        MockAnswer(31, "Indica el tipo de dolor", "Cólico"),
        MockAnswer(32, "Escala de dolor (intensidad)", "8"),
        MockAnswer(4, "¿Sientes dolor durante las relaciones sexuales?", "No"),
        MockAnswer(6, "¿Fumas?", "Sí"),
        MockAnswer(61, "¿Frecuencia con la que fumas?", "Ocasional"),
        MockAnswer(7, "¿Consumes alcohol?", "No"),
        MockAnswer(8, "¿Realizas actividad física?", "No"),
    ]
    print(f"CASE 2 (Complex):\n{ClinicalSummaryGenerator.generate(answers_2)['narrative_full']}\n")

    # CASE 3: Leg Pain
    answers_3 = [
        MockAnswer(1, "¿Indica tu historial Obstétrico?", "Primigesta"),
        MockAnswer(2, "Fecha de última menstruación", "2023-11-20"),
        MockAnswer(3, "¿Sientes dolor pélvico?", "No"),
        MockAnswer(5, "¿Sientes dolor en las piernas?", "Sí"),
        MockAnswer(51, "¿En qué zona sientes el dolor?", "Gemelar"),
        MockAnswer(6, "¿Fumas?", "No"),
        MockAnswer(8, "¿Realizas actividad física?", "No"),
    ]
    print(f"CASE 3 (Legs):\n{ClinicalSummaryGenerator.generate(answers_3)['narrative_full']}\n")

if __name__ == "__main__":
    run_test()
