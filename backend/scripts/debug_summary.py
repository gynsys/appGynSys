
import sys
import os
import json
import traceback

# Add backend directory to sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
sys.path.append(backend_dir)

from app.services.summary_generator import ClinicalSummaryGenerator, NarrativePreconsultaSummarizer

def debug_crash():
    print("--- START DEBUG ---")
    
    # Mock Appointment
    class MockPatient:
        name = "Malta Perez"
    class MockAppt:
        patient_name = "Malta Perez"
        patient = MockPatient()
    
    appt = MockAppt()
    
    # Mock Questions (Template)
    template_data = [
        {"id": "TEMPLATE_1766696938087_1", "text": "Age", "type": "number", "category": "general", "order": 1},
        {"id": "TEMPLATE_1766696938166_2", "text": "Location", "type": "text", "category": "general", "order": 2},
        {"id": "TEMPLATE_1766696938368_3", "text": "Occupation", "type": "text", "category": "general", "order": 3}
    ]
    
    # Mock Answers
    answers = [
        {"question_id": "TEMPLATE_1766696938087_1", "text_value": "40"},
        {"question_id": "TEMPLATE_1766696938166_2", "text_value": "Caracas"},
        {"question_id": "TEMPLATE_1766696938368_3", "text_value": "Ingeniera"}
    ]
    
    try:
        print("Instantiating Summarizer...")
        summarizer = NarrativePreconsultaSummarizer(template_data)
        print("Generating Sections...")
        
        patient_data = {a['question_id']: a['text_value'] for a in answers}
        sections = summarizer.generate_summary_sections(patient_data, "Malta Perez")
        print("Sections generated:", sections)
        
        print("Generating HTML...")
        html = ClinicalSummaryGenerator._generate_narrative_html(sections)
        print("HTML:", html)
        
    except Exception:
        traceback.print_exc()

if __name__ == "__main__":
    debug_crash()
