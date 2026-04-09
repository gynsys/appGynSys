import sys
import os

# Add project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.services.summary_generator import GeneradorResumenes
from app.utils.clinical_formatters import format_full_gyn_obstetric_summary

def test_intelligent_fertility_summary():
    print("--- Probando Inteligencia de Fertilidad en Menopausia ---")
    
    # 1. Caso: Menopausia + Actividad Sexual (Sin deseo especificado)
    datos_menopausia = {
        'age': '52',
        'is_menopause': 'Sí',
        'sexually_active': 'Sí',
        'gyn_fertility_intent': '', # Vacío
        'gyn_menarche': '13',
        'gyn_sexarche': '18',
        'gestas': 0,
        'partos': 0,
        'cesareas': 0,
        'abortos': 0
    }

    gen = GeneradorResumenes(datos_menopausia)
    resumen_gineco = gen.generar_gineco()
    print("\n[Resumen Gineco (Menopausia) - Summary Generator]:")
    print(resumen_gineco)
    
    # Verificación
    assert "Mantiene actividad sexual activa." in resumen_gineco
    assert "sin deseo de fertilidad especificado" not in resumen_gineco
    print("✅ OK: No menciona fertilidad en menopausia si no se especificó.")

    # 2. Caso: NO Menopausia + Actividad Sexual (Sin deseo especificado)
    datos_no_menopausia = {
        'age': '30',
        'is_menopause': 'No',
        'sexually_active': 'Sí',
        'gyn_fertility_intent': '', # Vacío
        'gyn_menarche': '13',
        'gyn_sexarche': '18',
        'gestas': 0
    }

    gen2 = GeneradorResumenes(datos_no_menopausia)
    resumen_gineco2 = gen2.generar_gineco()
    print("\n[Resumen Gineco (Fértil) - Summary Generator]:")
    print(resumen_gineco2)
    
    # Verificación
    assert "sin deseo de fertilidad especificado" in resumen_gineco2
    print("✅ OK: Menciona 'sin deseo especificado' en edad fértil.")

    # 3. Probar Examen Funcional Intelligence
    print("\n[Probando Examen Funcional Intelligence]:")
    resumen_funcional = gen.generar_funcional()
    print("Menopausia Funcional:", resumen_funcional)
    assert "Niega dispareunia" not in resumen_funcional
    assert "durante la menstruación" not in resumen_funcional
    print("✅ OK: Omitió negaciones innecesarias en menopausia.")

    resumen_funcional_2 = gen2.generar_funcional()
    print("Fértil Funcional:", resumen_funcional_2)
    assert "Niega dispareunia" in resumen_funcional_2
    assert "durante la menstruación" in resumen_funcional_2
    print("✅ OK: Mantuvo negaciones en edad fértil.")

    # 4. Probar clinical_formatters
    print("\n[Probando Clinical Formatters]:")
    summary_formatter = format_full_gyn_obstetric_summary(datos_menopausia)
    print("Menopausia Formatter:", summary_formatter)
    assert "Mantiene actividad sexual activa." in summary_formatter
    assert "sin deseo de fertilidad" not in summary_formatter
    
    summary_formatter_2 = format_full_gyn_obstetric_summary(datos_no_menopausia)
    print("Fértil Formatter:", summary_formatter_2)
    assert "sin deseo de fertilidad" in summary_formatter_2

    print("\n✅ Todas las pruebas de inteligencia clínica pasaron correctamente.")

if __name__ == "__main__":
    test_intelligent_fertility_summary()
