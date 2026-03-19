import sys
import os
import json

# Add backend to path to import actual logic
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.services.summary_generator import GeneradorResumenes

def main():
    # Datos de la paciente Ana (extraídos de la BD)
    ana_data = {
        "full_name": "Ana",
        "phone": "04129972355",
        "occupation": "medico",
        "address": "caracas",
        "family_history_mother_bool": True,
        "family_history_mother": ["Diabetes"],
        "family_history_father_bool": True,
        "family_history_father": ["Alergias"],
        "personal_history_bool": True,
        "personal_history": ["Tiroides"],
        "supplements_bool": True,
        "supplements": "calcio",
        "surgical_history_bool": True,
        "surgical_history": "cesarea",
        "gyn_menarche": "15",
        "gyn_sexarche": "17",
        "obstetric_history_type": "Primigesta",
        "sexually_active": True,
        "gyn_fertility_intent": "No tiene deseo de fertilidad",
        "gyn_cycles": "Irregulares",
        "gyn_cycles_duration": "27",
        "gyn_dysmenorrhea": "Sí",
        "gyn_dysmenorrhea_scale_value": 9,
        "gyn_fum": "2026-02-25",
        "gyn_mac_bool": True,
        "gyn_mac": ["Implante"],
        "gyn_previous_checkups": "2025-05-01",
        "gyn_last_pap_smear": "No recuerdo",
        "functional_dispareunia": True,
        "functional_dispareunia_type": "Profunda",
        "functional_dispareunia_deep_scale": 10,
        "functional_leg_pain": True,
        "functional_leg_pain_type": ["Quemante"],
        "functional_leg_pain_zone": ["Muslos"],
        "functional_gastro_before_bool": True,
        "functional_gastro_before": ["Estreñimiento"],
        "functional_gastro_during": ["Distensión"],
        "functional_dischezia": "Sí",
        "functional_dischezia_scale": 9,
        "functional_bowel_freq": "Diario",
        "functional_urinary_problem": True,
        "functional_urinary_pain": True,
        "functional_urinary_pain_scale": 8,
        "functional_urinary_irritation": True,
        "functional_urinary_incontinence": True,
        "functional_urinary_nocturia": True,
        "habits_physical_activity": "No",
        "habits_smoking": "Sí",
        "habits_alcohol": "Ocasional",
        "habits_substance_use": "No"
    }

    patient_name = ana_data.get("full_name", "Paciente")

    # Usamos el generador REAL del backend
    generador = GeneradorResumenes(ana_data)

    # Generar todas las secciones del resumen
    sections = generador.generar_todo(patient_name)

    # Mostrar resultados
    print("=" * 60)
    print("RESUMEN CLÍNICO GENERADO (VERSIÓN DINÁMICA)")
    print("=" * 60)
    print("\n[ GENERAL ]")
    print(sections.get("general", "No disponible"))

    print("\n[ ANTECEDENTES MÉDICOS ]")
    print(sections.get("antecedentes", "No disponible"))

    print("\n[ HISTORIA GINECO-OBSTÉTRICA ]")
    print(sections.get("gineco", "No disponible"))

    print("\n[ EXAMEN FUNCIONAL ]")
    func = sections.get("funcional")
    if func:
        print(func)
    else:
        print("No hay datos de examen funcional.")

    print("\n[ ESTILO DE VIDA ]")
    print(sections.get("estilo_vida", "No disponible"))

    print("\n" + "=" * 60)
    print("FIN DE LA PRUEBA")
    print("=" * 60)

if __name__ == "__main__":
    main()

if __name__ == "__main__":
    main()