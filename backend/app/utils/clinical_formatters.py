"""
app/utils/clinical_formatters.py

Utility functions for formatting clinical and obstetric data.
Extracted from email_tasks.py to keep task modules focused
on sending logic only.
"""
import json
from typing import Any, Dict


def to_roman(num: int) -> str:
    """Convert an integer to a Roman numeral string."""
    if not isinstance(num, int) or num < 1:
        return ""
    val = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1]
    syb = ["M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"]
    roman_num = ''
    i = 0
    while num > 0:
        while num >= val[i]:
            roman_num += syb[i]
            num -= val[i]
        i += 1
    return roman_num


def format_obstetric_history(data: Dict[str, Any]) -> str:
    """
    Format a patient's obstetric history from preconsultation data
    into a human-readable string (e.g. 'IIG IP IA').
    """
    g = p = a = c = 0
    ho_formula = data.get('gyn_ho', '') or ''
    used_table = False

    ho_table = data.get('ho_table_results')
    if ho_table and isinstance(ho_table, dict):
        try:
            g = int(ho_table.get('gestas', 0))
            p = int(ho_table.get('partos', 0))
            c = int(ho_table.get('cesareas', 0))
            a = int(ho_table.get('abortos', 0))
            used_table = True
        except Exception:
            pass
    else:
        if 'nuligesta' in str(ho_formula).lower():
            return "Paciente Nuligesta"
        if 'primigesta' in str(ho_formula).lower():
            return "Paciente Primigesta"

    if g == 0 and p == 0 and a == 0 and c == 0:
        if not used_table and ho_formula and ho_formula != "No registrado":
            return ho_formula
        return "Paciente Nuligesta"

    parts = []
    if g > 0:
        parts.append(f"{to_roman(g)}G")
    if p > 0:
        parts.append(f"{to_roman(p)}P")
    if c > 0:
        parts.append(f"{to_roman(c)}C")
    if a > 0:
        parts.append(f"{to_roman(a)}A")

    result = " ".join(parts)

    try:
        birth_details = data.get('birth_details', [])
        if isinstance(birth_details, str):
            birth_details = json.loads(birth_details)

        if birth_details and isinstance(birth_details, list):
            details_list = []
            for birth in birth_details:
                if not isinstance(birth, dict):
                    continue
                year = birth.get('birth_year', 'N/A')
                weight = birth.get('weight', 'N/A')
                height = birth.get('height', 'N/A')
                comps = birth.get('complications', 'Sin complicaciones')
                details_list.append(f"{year} {weight}kg / {height}cm, que cursó {comps}")
            if details_list:
                result += " -> " + "; ".join(details_list)
    except Exception:
        pass

    return result


def format_full_gyn_obstetric_summary(data: Dict[str, Any]) -> str:
    """
    Build a complete, human-readable gyneco-obstetric narrative paragraph
    from preconsultation data, suitable for inclusion in medical reports.
    """
    parts = []

    # 1. Obstetric history
    ho_text = format_obstetric_history(data)
    if ho_text:
        parts.append(ho_text if ho_text.endswith('.') else f"{ho_text}.")

    # 2. Menarche / Sexarche
    menarche = data.get('gyn_menarche')
    sexarche = data.get('gyn_sexarche')
    menarche_text = f"Menarquía a los {menarche} años" if menarche else ""
    sexarche_text = ""

    if sexarche:
        if 'nunca' in str(sexarche).lower():
            sexarche_text = "Sexarquía: niega"
        else:
            sexarche_text = f"sexarquía a los {sexarche}"

    if menarche_text and sexarche_text:
        parts.append(f"{menarche_text} y {sexarche_text}.")
    elif menarche_text:
        parts.append(f"{menarche_text}.")
    elif sexarche_text:
        parts.append(f"{sexarche_text[0].upper() + sexarche_text[1:]}.")

    # 3. Menstrual cycles
    cycles = data.get('gyn_cycles', 'Regulares')
    dysmenorrhea = data.get('gyn_dysmenorrhea', 'No')
    cycle_text = "ciclos menstruales regulares"

    if 'irregulares' in str(cycles).lower():
        cycle_text = f"ciclos menstruales irregulares ({cycles})"

    if str(dysmenorrhea).lower() != 'no':
        cycle_text += f", asociados a dismenorrea ({dysmenorrhea})"
    else:
        cycle_text += ", sin dismenorrea"
    parts.append(f"Refiere {cycle_text}.")

    # 4. FUM / MAC
    if data.get('gyn_fum'):
        parts.append(f"Su FUM fue el {data.get('gyn_fum')}.")
    if data.get('gyn_mac') and str(data.get('gyn_mac')).lower() != 'no':
        parts.append(f"Utiliza como método anticonceptivo: {str(data.get('gyn_mac')).lower()}.")

    # 5. Sexual activity
    sex = data.get('sexually_active')
    is_menopause = str(data.get('is_menopause')).lower() in ['sí', 'si', 'true', '1']
    
    if sex and str(sex).lower() in ['sí', 'si', 'true']:
        fert = data.get('gyn_fertility_intent')
        f_text = ""
        
        if fert and 'no tiene' not in str(fert).lower():
            f_text = f" con {str(fert).lower()}"
        elif not is_menopause:
            # Solo añadir la coletilla de "sin deseo" si NO es menopausia
            f_text = " sin deseo de fertilidad"
            
        parts.append(f"Mantiene actividad sexual activa{f_text}.")
    elif sex and str(sex).lower() == 'no':
        parts.append("No mantiene actividad sexual actualmente.")

    return " ".join(parts)
