import sys
import os
import json
from datetime import datetime

# Adjust path to /app as it's the root in most containers
if os.path.exists('/app'):
    sys.path.append('/app')

from app.db.session import SessionLocal
from app.db.models.appointment import Appointment
from app.db.models.doctor import Doctor
from app.services.summary_generator import GeneradorResumenes

def simulate_menopause_record():
    db = SessionLocal()
    try:
        # Get doctor with id 1 if exists, or first one
        doctor = db.query(Doctor).filter(Doctor.id == 1).first()
        if not doctor:
            doctor = db.query(Doctor).first()
        
        if not doctor:
            print("No doctor found to attach the test appointment.")
            return

        # Mock preconsulta answers for a menopausal patient
        mock_answers = {
            "full_name": "Paciente Marta Prueba Menopausia",
            "age": "52",
            "ci": "87654321",
            "address": "Maracay, Aragua",
            "is_menopause": "Sí",
            "menopause_hot_flashes": "Sí",
            "menopause_concentration": "Sí",
            "menopause_vaginal_dryness": "Sí",
            "menopause_gastro": ["Gases", "Diarrea"],
            "family_history_mother_bool": "Sí",
            "family_history_mother": ["Osteoporosis"],
            "surgical_history_bool": "No",
            "gyn_menarche": "13",
            "gyn_sexarche": "19",
            "obstetric_history_type": "Multigesta",
            "ho_table_results": {
                "gestas": 3,
                "partos": 2,
                "cesareas": 0,
                "abortos": 1,
                "children": [
                    {"year": "1995", "weight": "3.1", "height": "49", "complications": "Ninguna"},
                    {"year": "1998", "weight": "3.3", "height": "51", "complications": "Ninguna"}
                ]
            },
            "sexually_active": "Sí",
            "gyn_mac_bool": "No",
            "gyn_previous_checkups": "2023-05-01",
            "gyn_last_pap_smear": "2023-05-01"
        }

        # Create the Appointment record
        new_app = Appointment(
            doctor_id=doctor.id,
            patient_name=mock_answers["full_name"],
            patient_dni=mock_answers["ci"],
            patient_phone="04241234567",
            patient_email="marta_test@example.com",
            appointment_date=datetime.now(),
            appointment_time="11:00",
            status="preconsulta_completed", # Show summary
            preconsulta_answers=mock_answers,
            created_at=datetime.now()
        )

        db.add(new_app)
        db.commit()
        db.refresh(new_app)

        print(f"Record created for 'Marta Prueba' with ID: {new_app.id}")
        
        # Test the Narrative Generator
        gen = GeneradorResumenes(mock_answers)
        resumenes = gen.generar_todo(mock_answers["full_name"])
        
        print("\n--- GINECO-OBSTÉTRICO (NARRATIVA) ---")
        print(resumenes["gineco"])
        
        print("\n--- EXAMEN FUNCIONAL (NARRATIVA) ---")
        print(resumenes["funcional"])
        
        return new_app.id

    except Exception as e:
        db.rollback()
        print(f"Error creating record: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    simulate_menopause_record()
