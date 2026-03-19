#!/usr/bin/env python3
# test_summarizer.py
# Script para probar el generador de resúmenes con datos reales de la BD

from clinical_summary_generator import NarrativePreconsultaSummarizer, ClinicalSummaryGenerator

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

    # Instanciamos el generador narrativo con un template vacío (no tenemos los metadatos de las preguntas)
    template_data = []  # Vacío, porque no tenemos la estructura de preguntas

    summarizer = NarrativePreconsultaSummarizer(template_data)

    # Generar todas las secciones del resumen
    sections = summarizer.generate_summary_sections(ana_data, patient_name)

    # Mostrar resultados
    print("=" * 60)
    print("RESUMEN CLÍNICO GENERADO")
    print("=" * 60)
    print("\n[ GENERAL ]")
    print(sections.get("summary_general", "No disponible"))

    print("\n[ ANTECEDENTES MÉDICOS ]")
    print(sections.get("summary_medical", "No disponible"))

    print("\n[ HISTORIA GINECO-OBSTÉTRICA ]")
    print(sections.get("summary_obstetric", "No disponible"))

    print("\n[ EXAMEN FUNCIONAL ]")
    func = sections.get("summary_functional")
    if func:
        print(func)
    else:
        print("No hay datos de examen funcional.")

    print("\n[ ESTILO DE VIDA ]")
    print(sections.get("summary_lifestyle", "No disponible"))

    # También podemos generar el HTML completo usando el método legacy (opcional)
    print("\n" + "=" * 60)
    print("VISTA HTML COMPLETA")
    print("=" * 60)
    html = ClinicalSummaryGenerator._generate_narrative_html(sections)
    print(html)

if __name__ == "__main__":
    main()