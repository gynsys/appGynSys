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

def build_narrative_summary(report_data: dict, include_functional_exam: bool = True) -> dict:
    """
    Toma los datos crudos y devuelve un diccionario con los textos formateados,
    incluyendo un párrafo narrativo completo y coherente.
    """
    context = {}
    
    # --- Datos básicos que se usarán fuera del párrafo ---
    context['full_name'] = report_data.get('full_name', '').title()
    context['age'] = report_data.get('age', '')
    context['ci'] = report_data.get('ci', '')

    # --- Construcción del Párrafo Narrativo ---
    narrative_parts = []
    
    # 1. Motivo de consulta
    reason = report_data.get('reason_for_visit', '').lower()
    if reason:
        # Si es "control ginecológico" o similar, usar "a" en lugar de "por presentar"
        if 'control' in reason or 'consulta' in reason or 'revisión' in reason:
            narrative_parts.append(f"Paciente quien acude a consulta a {reason}.")
        else:
            narrative_parts.append(f"Paciente quien acude a consulta por presentar {reason}.")

    # 2. Hallazgos Funcionales
    findings_parts = []

    # Verificar si el examen funcional fue realizado (hay datos) Y está habilitado en la configuración
    has_functional_data = include_functional_exam and any(
        report_data.get(key) for key in [
            'functional_dispareunia', 'functional_leg_pain', 'functional_gastro_before',
            'functional_gastro_during', 'functional_dischezia', 'functional_bowel_freq',
            'functional_urinary_problem', 'functional_urinary_pain', 'functional_urinary_irritation',
            'functional_urinary_incontinence', 'functional_urinary_nocturia'
        ]
    )

    # Dismenorrea (siempre se incluye, es parte de antecedentes ginecológicos)
    dismenorrhea = report_data.get('gyn_dysmenorrhea', '')
    if not dismenorrhea or dismenorrhea.lower() == 'no':
        findings_parts.append("no presentar dismenorrea")
    else:
        eva_match = re.search(r'intensidad: (\d+)/10', dismenorrhea)
        score = int(eva_match.group(1)) if eva_match else 0
        intensity_desc = "severa" if score >= 7 else "moderada" if score >= 4 else "leve"
        findings_parts.append(f"dismenorrea {intensity_desc} ({score}/10)")

    # Solo incluir información del examen funcional si hay datos (fue habilitado)
    if has_functional_data:
        # Dispareunia
        dispareunia = report_data.get('functional_dispareunia', '')
        if not dispareunia or dispareunia.lower() == 'no':
            findings_parts.append("niega dispareunia")
        else:
            eva_match = re.search(r'\(Intensidad: (\d+)/10\)', dispareunia)
            if eva_match:
                score = int(eva_match.group(1).split('/')[0])
                intensity_desc = "de alta intensidad" if score >= 10 else "severa" if score >= 7 else "moderada" if score >= 4 else "leve"
                findings_parts.append(f"dispareunia {intensity_desc} ({score}/10)")
                
        # Disquecia
        dischezia = report_data.get('functional_dischezia', '')
        if not dischezia or dischezia.lower() == 'no':
            findings_parts.append("niega disquecia")
        elif 'eventual' in dischezia.lower():
            findings_parts.append("disquecia eventual")
        else:
            eva_match = re.search(r'\(Intensidad: (\d+)/10\)', dischezia)
            if eva_match:
                score = int(eva_match.group(1).split('/')[0])
                intensity_desc = "de máxima intensidad" if score >= 10 else "severa" if score >= 7 else "moderada" if score >= 4 else "leve"
                findings_parts.append(f"disquecia {intensity_desc} ({score}/10)")

    # Infertilidad
    infertility = report_data.get('gyn_fertility_intent', '')
    if infertility and "Con deseo" in infertility:
        findings_parts.append("con deseo de fertilidad no logrado")
    else:
        findings_parts.append("sin deseo de fertilidad aparente")

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
        # Formatear diagnóstico con viñetas si hay múltiples líneas
        diag_items = [d.strip() for d in diagnosis.strip().split('\n') if d.strip()]
        if len(diag_items) > 1:
             bullet_list = []
             for item in diag_items:
                 # Limpiar marcadores existentes si los hay
                 cleaned = re.sub(r'^[•*-]\s*|^\d+[.)]\s*', '', item)
                 bullet_list.append(f"&bull; {cleaned}")
             diagnosis_formatted = "<br/>".join(bullet_list)
             narrative_parts.append(f"Se establecen los siguientes diagnósticos:<br/>{diagnosis_formatted}")
        else:
            narrative_parts.append(f"Se establece el diagnóstico de {diagnosis}.")

    plan = report_data.get('admin_plan')
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
    
        # Construimos una lista con viñetas
        bullet_list_parts = []
        for item in plan_items:
            # Quitamos marcadores manuales si el usuario los puso (como '•', '-', o números)
            cleaned_item = re.sub(r'^[•*-]\s*|^\d+[.)]\s*', '', item)
            # Agregar bullet con espacio
            bullet_list_parts.append(f"&bull; {cleaned_item}")
        
        # Unir los ítems con saltos de línea
        # Usamos <br/> para separar cada ítem
        plan_formatted_as_list = "<br/>".join(bullet_list_parts)
        
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

    # Add Observations separately
    observations = report_data.get('admin_observations')
    if observations:
        obs_items = [o.strip() for o in observations.strip().split('\n') if o.strip()]
        if obs_items:
             obs_bullets = []
             for item in obs_items:
                 cleaned = re.sub(r'^[•*-]\s*|^\d+[.)]\s*', '', item)
                 obs_bullets.append(f"&bull; {cleaned}")
             context['observations_formatted'] = "<br/>".join(obs_bullets)

    return context
