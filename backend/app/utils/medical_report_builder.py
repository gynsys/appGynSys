import re
import logging

logger = logging.getLogger(__name__)

def format_simple_antecedente(value: str) -> str:
    if value is None or str(value).strip() == '' or str(value).strip() == 'None':
        return "No contributorios."
    cleaned_value = str(value).strip()
    if cleaned_value.lower() == 'no':
        return "Niega."
    return cleaned_value.title()

def format_family_history(mother_history: str, father_history: str) -> str:
    mother_val = str(mother_history).strip() if mother_history and str(mother_history) != 'None' else None
    father_val = str(father_history).strip() if father_history and str(father_history) != 'None' else None

    is_mother_no = mother_val is not None and mother_val.lower() == 'no'
    is_father_no = father_val is not None and father_val.lower() == 'no'

    if is_mother_no and is_father_no:
        return "Niega antecedentes familiares de importancia."

    if mother_val is None and father_val is None:
        return "No contributorios."

    parts = []
    if not is_mother_no and mother_val:
        parts.append(f"Madre: {mother_val.title()}.")
    if not is_father_no and father_val:
        parts.append(f"Padre: {father_val.title()}.")

    return "<br/>".join(parts) if parts else "Niega antecedentes familiares de importancia."

def format_clinical_list_with_bold(text: str) -> str:
    if not text:
        return ""
    lines = text.split('\n')
    formatted_lines = []
    for line in lines:
        trimmed = line.strip()
        if not trimmed:
            formatted_lines.append(line)
            continue
        
        # Check if already has <b> tags at start or in text
        if trimmed.startswith('<b>') or '<b>' in trimmed:
            formatted_lines.append(line)
            continue
            
        # Match patterns like "1.", "1)", "•", "-" at the start of the line
        match = re.match(r'^(\s*)([-•*]|\d+[.)])(\s+)(.*)', line)
        if match:
            indent, marker, space, content = match.groups()
            formatted_lines.append(f"{indent}<b>{marker}</b>{space}{content}")
        else:
            formatted_lines.append(line)
    return '\n'.join(formatted_lines)

def format_unified_report_content(text: str) -> str:
    if not text:
        return ""
    lines = text.split('\n')
    formatted_lines = []
    for line in lines:
        trimmed = line.strip()
        if not trimmed:
            formatted_lines.append(line)
            continue
        
        # Match standard clinical section headers and wrap them in bold if they aren't already
        # (e.g. "DIAGNÓSTICOS:", "ECOGRAFÍA GINECOLÓGICA:", "PLAN TERAPÉUTICO:", etc.)
        headers = [
            "ECOGRAFÍA GINECOLÓGICA:", "DIAGNÓSTICOS:", "PLAN TERAPÉUTICO:",
            "ECOGRAFÍA:", "PLAN:", "DIAGNOSTICO:", "DIAGNOSTICOS:"
        ]
        is_header = False
        for h in headers:
            if trimmed.upper() == h or trimmed.upper() == h.replace(":", ""):
                # Wrap the header in bold
                indent_len = len(line) - len(line.lstrip())
                indent = line[:indent_len]
                # If already bolded, keep it
                if trimmed.startswith('<b>') or '<b>' in trimmed:
                    formatted_lines.append(line)
                else:
                    # Make it uppercase and bold
                    clean_h = trimmed.upper()
                    if not clean_h.endswith(':'):
                        clean_h += ':'
                    formatted_lines.append(f"{indent}<b>{clean_h}</b>")
                is_header = True
                break
        
        if is_header:
            continue
            
        # Check if already has <b> tags at start or in text
        if trimmed.startswith('<b>') or '<b>' in trimmed:
            formatted_lines.append(line)
            continue
            
        # Match patterns like "1.", "1)", "•", "-" at the start of the line
        match = re.match(r'^(\s*)([-•*]|\d+[.)])(\s+)(.*)', line)
        if match:
            indent, marker, space, content = match.groups()
            formatted_lines.append(f"{indent}<b>{marker}</b>{space}{content}")
        else:
            formatted_lines.append(line)
    return '\n'.join(formatted_lines)


def build_narrative_summary(report_data: dict, include_functional_exam: bool = True) -> dict:
    """
    Toma los datos crudos y devuelve un diccionario con los textos formateados,
    incluyendo un párrafo narrativo completo y coherente.
    """
    context = {}
    
    # --- Datos básicos que se usarán fuera del párrafo ---
    context['full_name'] = str(report_data.get('full_name') or '').title()
    context['age'] = str(report_data.get('age') or '')
    context['ci'] = str(report_data.get('ci') or '')

    # --- Construcción del Párrafo Narrativo ---
    narrative_parts = []
    
    # 1. Motivo de consulta
    reason = str(report_data.get('reason_for_visit') or '').strip().lower()
    if reason:
        # Si es "control ginecológico" o similar, usar "a" en lugar de "por presentar"
        if 'control' in reason or 'consulta' in reason or 'revisión' in reason:
            narrative_parts.append(f"Paciente quien acude a consulta a {reason}.")
        else:
            narrative_parts.append(f"Paciente quien acude a consulta por presentar {reason}.")

    # 2. Hallazgos Funcionales (Bot Parity)
    findings_parts = []
    
    is_menopause_raw = report_data.get('is_menopause')
    is_menopause = False
    if is_menopause_raw is not None:
        if isinstance(is_menopause_raw, bool):
            is_menopause = is_menopause_raw is True
        else:
            is_menopause = str(is_menopause_raw).lower() in ['sí', 'si', 'true', '1']

    if is_menopause:
        # A. Calorones
        hf = report_data.get('menopause_hot_flashes')
        if hf and str(hf).lower() in ['sí', 'si', 'true', '1']:
            findings_parts.append("presencia de sofocos")
        else:
            findings_parts.append("niega sofocos")
            
        # B. Concentración
        conc = report_data.get('menopause_concentration')
        if conc and str(conc).lower() in ['sí', 'si', 'true', '1']:
            findings_parts.append("pérdida de concentración")
            
        # C. Sueño
        sleep = report_data.get('menopause_sleep_issues')
        if sleep and str(sleep).lower() in ['sí', 'si', 'true', '1']:
            findings_parts.append("problemas para conciliar el sueño")
            
        # D. Resequedad vaginal
        dry = report_data.get('menopause_vaginal_dryness')
        if dry and str(dry).lower() in ['sí', 'si', 'true', '1']:
            findings_parts.append("resequedad vaginal")
        else:
            findings_parts.append("niega resequedad vaginal")
    else:
        # A. Dismenorrea
        dismenorrhea = report_data.get('gyn_dysmenorrhea', '')
        if not dismenorrhea or str(dismenorrhea).lower() in ['no', 'niega', 'none']:
            findings_parts.append("no presentar dismenorrea")
        else:
            eva_match = re.search(r'intensidad: (\d+)/10', str(dismenorrhea))
            score = int(eva_match.group(1)) if eva_match else report_data.get('gyn_dysmenorrhea_scale_value', 0)
            intensity_desc = "severa" if score >= 7 else "moderada" if score >= 4 else "leve"
            findings_parts.append(f"dismenorrea {intensity_desc} ({score}/10)")
    
        # B. Dispareunia
        dispareunia = report_data.get('functional_dispareunia', '')
        if not dispareunia or str(dispareunia).lower() in ['no', 'niega', 'none', 'false']:
            findings_parts.append("niega dispareunia")
        else:
            eva_match = re.search(r'intensidad: (\d+)/10', str(dispareunia), re.IGNORECASE)
            score = int(eva_match.group(1)) if eva_match else report_data.get('functional_dispareunia_deep_scale', 0)
            if score >= 10: intensity_desc = "de máxima intensidad"
            elif score >= 7: intensity_desc = "de alta intensidad"
            elif score >= 4: intensity_desc = "moderada"
            else: intensity_desc = "leve"
            findings_parts.append(f"dispareunia {intensity_desc} ({score}/10)")
    
        # C. Disquecia
        dischezia = report_data.get('functional_dischezia', '')
        if not dischezia or str(dischezia).lower() in ['no', 'niega', 'none', 'false']:
            findings_parts.append("niega disquecia")
        elif 'eventual' in str(dischezia).lower():
            findings_parts.append("disquecia eventual")
        else:
            eva_match = re.search(r'intensidad: (\d+)/10', str(dischezia), re.IGNORECASE)
            score = int(eva_match.group(1)) if eva_match else (report_data.get('functional_dischezia_scale') or report_data.get('functional_dischezia_scale_value', 0))
            if score >= 10: intensity_desc = "de máxima intensidad"
            elif score >= 7: intensity_desc = "de alta intensidad"
            elif score >= 4: intensity_desc = "moderada"
            else: intensity_desc = "leve"
            findings_parts.append(f"disquecia {intensity_desc} ({score}/10)")
    
        # D. Deseo de fertilidad
        infertility = report_data.get('gyn_fertility_intent', '')
        if infertility and "Con deseo" in str(infertility):
            findings_parts.append("con deseo de fertilidad no logrado")
        else:
            findings_parts.append("sin deseo de fertilidad aparente")

    # Unir todo en un solo párrafo estilo Bot
    if findings_parts:
        if len(findings_parts) > 1:
            findings_str = ", ".join(findings_parts[:-1]) + " y " + findings_parts[-1]
        else:
            findings_str = findings_parts[0]
        narrative_parts.append(f"Al interrogatorio, manifiesta {findings_str}.")

    # 3. Hallazgos del Médico
    ultrasound = report_data.get('admin_ultrasound')
    if ultrasound:
        narrative_parts.append(f"El ultrasonido transvaginal reporta: {ultrasound}.")

    diagnosis = report_data.get('admin_diagnosis')
    if diagnosis:
        # Formatear diagnóstico numerado si es necesario
        diag_items = [d.strip() for d in diagnosis.strip().split('\n') if d.strip()]
        if len(diag_items) > 1 or (diag_items and re.match(r'^\d+\)', diag_items[0])):
             # Extraer la operación fuera del f-string (no se pueden usar backslashes en expresiones de f-strings)
             diagnosis_formatted = format_clinical_list_with_bold(diagnosis).replace('\n', '<br/>')
             narrative_parts.append(f"Se establecen los siguientes diagnósticos:<br/>{diagnosis_formatted}")
        else:
            narrative_parts.append(f"Se establece el diagnóstico de {format_clinical_list_with_bold(diagnosis)}.")

    plan = report_data.get('admin_plan')
    '''if plan:
        # Formatear plan con viñetas si es necesario
        plan_items = [p.strip() for p in plan.strip().split('\n')]
        if len(plan_items) > 1 or plan_items[0].startswith('•'):
            # Extraer la operación fuera del f-string (no se pueden usar backslashes en expresiones de f-strings)
            plan_formatted = plan.replace('\n', '<br/>')
            narrative_parts.append(f"Se indica el siguiente plan:<br/>{plan_formatted}")
        else:
            narrative_parts.append(f"Se indica como plan: {plan}.")'''
    if plan:
        # Siempre introducimos el plan con un texto y un salto de línea.
        narrative_parts.append("Se indica como plan:")
    
        # Dividimos el plan en ítems detectando marcadores de inicio de item
        # (guiones -, viñetas •, o números seguidos de . o ))
        # Esto evita dividir incorrectamente cuando hay saltos de línea dentro de un mismo item
        pattern = r'^[-•]\s*|^\d+[.)]\s*'
        lines = plan.strip().split('\n')
        plan_items = []
        current_item = []
        has_markers = False  # Para saber si hay marcadores en el plan
        
        for line in lines:
            stripped = line.strip()
            
            # Si la línea está vacía, la ignoramos (son espacios de formato dentro del mismo item)
            if not stripped:
                continue
            
            # Si la línea empieza con un marcador de item nuevo
            if re.match(pattern, stripped):
                has_markers = True
                # Guardar el item anterior si existe
                if current_item:
                    plan_items.append(' '.join(current_item))
                # Iniciar nuevo item
                current_item = [stripped]
            else:
                # Continuar el item actual (es una continuación de la línea anterior)
                # Esto agrupa líneas consecutivas sin marcador como parte del mismo item
                if current_item:
                    current_item.append(stripped)
                else:
                    # Primer item sin marcador explícito
                    current_item = [stripped]
        
        # Guardar el último item
        if current_item:
            plan_items.append(' '.join(current_item))
        
        # Si no se detectaron marcadores, significa que el plan fue introducido item por item
        # (como cuando el doctor añade items uno por uno). En ese caso, cada línea es un item separado
        if not has_markers:
            # Dividir por saltos de línea, cada línea es un item
            plan_items = [line.strip() for line in plan.strip().split('\n') if line.strip()]
    
        # Construimos una lista numerada (1., 2., etc.) en lugar de viñetas
        # Esto es más confiable que las viñetas en ReportLab
        numbered_list_parts = []
        for i, item in enumerate(plan_items, 1):
            # Quitamos marcadores manuales si el usuario los puso (como '•', '-', o números)
            cleaned_item = re.sub(r'^[•*-]\s*|^\d+[.)]\s*', '', item)
            # Agregar número con punto y espacio
            numbered_list_parts.append(f"<b>{i}.</b> {cleaned_item}")
        
        # Unir los ítems con saltos de línea
        # Usamos <br/> para separar cada ítem y leftIndent se aplicará en el estilo
        plan_formatted_as_list = "<br/>".join(numbered_list_parts)
        
        # Añadimos la lista formateada a nuestras partes narrativas.
        narrative_parts.append(plan_formatted_as_list)

    # Unir las partes con espacios, pero manejar correctamente los <br/>
    narrative_text = " ".join(narrative_parts)
    
    # Reemplazar múltiples espacios seguidos por un solo espacio (excepto los <br/>)
    narrative_text = re.sub(r' +', ' ', narrative_text)
    # Asegurar que no haya espacios antes de <br/>
    narrative_text = re.sub(r' +<br/>', '<br/>', narrative_text)
    # Asegurar que no haya espacios después de <br/>
    narrative_text = re.sub(r'<br/> +', '<br/>', narrative_text)
    
    context['narrative_summary'] = narrative_text
    return context
