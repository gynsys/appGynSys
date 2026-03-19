import logging
import re
from datetime import datetime
from typing import Optional, Union, List, Dict, Any

logger = logging.getLogger(__name__)

class NarrativePreconsultaSummarizer:
    """Generador de resúmenes narrativos concisos y profesionales."""
    
    def __init__(self, template_data: List[Dict]):
        """Inicializa con el template del formulario."""
        self.template = template_data
        self.question_map = {item['id']: item for item in template_data}
    
    def _get_response_value(self, question_id: str, patient_data: Dict[str, Any]) -> Any:
        """Obtiene y formatea la respuesta de una pregunta específica."""
        answer = patient_data.get(question_id)
        if answer is None or answer == "" or answer == []:
            return None
        
        question = self.question_map.get(question_id, {})
        q_type = question.get('type', 'text')
        
        # Formatear según tipo
        if q_type == 'boolean':
            if isinstance(answer, bool):
                return answer
            return str(answer).lower() in ['true', 'yes', 'sí', 'si', '1', 'verdadero']
        
        elif q_type in ['multiselect', 'single_select']:
            if isinstance(answer, list):
                return [str(item).strip() for item in answer if item]
            return str(answer).strip()
        
        elif q_type == 'date':
            try:
                if isinstance(answer, str):
                    for fmt in ['%Y-%m-%d', '%d/%m/%Y', '%m/%d/%Y']:
                        try:
                            date_obj = datetime.strptime(answer, fmt)
                            return date_obj
                        except:
                            continue
            except:
                pass
            return str(answer)
        
        elif q_type == 'range':
            return str(answer)
        
        return str(answer).strip() if answer else None
    
    def _format_list_for_summary(self, items: List[str], max_items: int = 3) -> str:
        """Formatea una lista para el resumen de manera inteligente."""
        if not items:
            return ""
        
        # Si son pocos items, mostrarlos todos
        if len(items) <= max_items:
            return ", ".join(items)
        
        # Si son muchos, mostrar los primeros y cuántos más
        return f"{', '.join(items[:max_items])} entre otros"
    
    
    def _find_question_id_by_order(self, order: int) -> Optional[str]:
        """Busca el ID de una pregunta por su orden."""
        for q in self.template:
            if q.get('order') == order or q.get('order') == str(order):
                return q['id']
        return None

    def _extract_demographics(self, patient_data: Dict[str, Any]) -> Dict[str, str]:
        """Extrae información demográfica básica."""
        demographics = {}
        
        # Edad (Order 1) - Intentar ID directo o buscar por orden
        age_id = self._find_question_id_by_order(1)
        age = self._get_response_value("TEMPLATE_1766696938087_1", patient_data)
        if not age and age_id:
             age = self._get_response_value(age_id, patient_data)
        if age:
            demographics['edad'] = age
        
        # Localidad
        loc_id = self._find_question_id_by_order(2)
        # Try known IDs (Schema vs Malta IDs)
        location = self._get_response_value("TEMPLATE_1766696938166_2", patient_data)
        if not location:
            location = self._get_response_value("TEMPLATE_1766696938458_4", patient_data) # Malta ID (Verified)
        if not location and loc_id:
            location = self._get_response_value(loc_id, patient_data)
        if location:
            demographics['localidad'] = location
        
        # Ocupación
        occ_id = self._find_question_id_by_order(3)
        # Try known IDs (Schema vs Malta IDs)
        occupation = self._get_response_value("TEMPLATE_1766696938368_3", patient_data)
        if not occupation:
             occupation = self._get_response_value("TEMPLATE_1766696938515_5", patient_data) # Malta ID (Verified)
        if not occupation and occ_id:
            occupation = self._get_response_value(occ_id, patient_data)
        if occupation:
            demographics['ocupacion'] = occupation
        
        return demographics

    def _format_list_for_summary(self, items: List[str], max_items: int = 3) -> str:
        """Formatea una lista para el resumen de manera inteligente."""
        if not items:
            return ""
        if len(items) <= max_items:
            return ", ".join(items)
        return f"{', '.join(items[:max_items])} entre otros"
    
    def _summarize_medical_history(self, patient_data: Dict[str, Any]) -> str:
        """Genera resumen conciso de antecedentes médicos."""
        sections = []
        
        # Antecedentes personales
        has_personal_history = self._get_response_value("TEMPLATE_1766696938833_7", patient_data)
        if has_personal_history:
            personal_details = self._get_response_value("TEMPLATE_1766696938927_8", patient_data)
            if personal_details and isinstance(personal_details, list) and personal_details:
                formatted = self._format_list_for_summary(personal_details)
                if formatted:
                    sections.append(f"antecedentes de {formatted}")
            else:
                 sections.append("con antecedentes personales")
        else:
            sections.append("sin antecedentes personales")
        
        # Antecedentes familiares maternos
        has_mother_history = self._get_response_value("TEMPLATE_1766696938459_4", patient_data)
        if has_mother_history:
            mother_details = self._get_response_value("TEMPLATE_1766696938531_5", patient_data)
            if mother_details and isinstance(mother_details, list) and mother_details:
                formatted = self._format_list_for_summary(mother_details, max_items=2)
                sections.append(f"antecedentes maternos de {formatted}")
        
        # Antecedentes familiares paternos
        has_father_history = self._get_response_value("TEMPLATE_1766696938634_6", patient_data)
        if has_father_history:
            father_details = self._get_response_value("TEMPLATE_1766696938719_6", patient_data)
            if father_details and isinstance(father_details, list) and father_details:
                formatted = self._format_list_for_summary(father_details, max_items=2)
                sections.append(f"antecedentes paternos de {formatted}")
        
        # Cirugías
        has_surgeries = self._get_response_value("TEMPLATE_1766696939023_9", patient_data)
        if has_surgeries:
            sections.append("cirugías previas")
        
        # Suplementos
        takes_supplements = self._get_response_value("TEMPLATE_1766696939294_13", patient_data)
        if takes_supplements:
            supplement_details = self._get_response_value("TEMPLATE_1766696939371_14", patient_data)
            if supplement_details and isinstance(supplement_details, list) and supplement_details:
                formatted = self._format_list_for_summary(supplement_details, max_items=2)
                sections.append(f"toma {formatted}")
        
        if not sections:
            return "sin antecedentes médicos de interés"
        
        # Avoid "con sin" grammar
        if len(sections) == 1 and sections[0].startswith("sin "):
            return sections[0]
            
        return f"con {', '.join(sections)}"
    
    def _find_id_by_keywords(self, keywords: List[str]) -> Optional[str]:
        """Busca el ID de una pregunta basándose en palabras clave en su texto."""
        for q in self.template:
            q_text = str(q.get('text', '')).lower()
            if any(k.lower() in q_text for k in keywords):
                return q['id']
        return None

    def _get_value_by_keywords(self, keywords: List[str], patient_data: Dict[str, Any], direct_keys: List[str] = None) -> Any:
        """Obtiene valor buscando primero por claves directas, luego por ID que contenga keywords."""
        # 1. Try Direct Keys first (Legacy/Frontend consistency)
        if direct_keys:
            for key in direct_keys:
                if key in patient_data and patient_data[key] not in [None, ""]:
                    return patient_data[key]
        
        # 2. Try by Template ID (New Dynamic Forms)
        qid = self._find_id_by_keywords(keywords)
        if qid:
            val = self._get_response_value(qid, patient_data)
            if val: return val
            
        return None

    def _summarize_gynecological_history(self, patient_data: Dict[str, Any]) -> str:
        """Genera resumen narrativo COMPLETO de historia ginecológica (GPA + Menarquía + Ciclos + ...)."""
        sections = []
        
        # --- 1. GPA Calc (Gesta, Para, Abortus, Cesarea) ---
        # NOTE: Using direct keys from the formatGynObstetricSummary JS function for compatibility
        gestas = self._get_value_by_keywords(['embarazos', 'gestas'], patient_data, direct_keys=['gestas', 'Gestas'])
        partos = self._get_value_by_keywords(['partos', 'vaginales'], patient_data, direct_keys=['partos', 'Partos'])
        cesareas = self._get_value_by_keywords(['cesáreas', 'cesareas'], patient_data, direct_keys=['cesareas', 'Cesareas'])
        abortos = self._get_value_by_keywords(['abortos', 'perdidas'], patient_data, direct_keys=['abortos', 'Abortos'])
        ectopicos = self._get_value_by_keywords(['ectópico', 'ectopico'], patient_data, direct_keys=['ectopicos'])
        molares = self._get_value_by_keywords(['molar'], patient_data, direct_keys=['molares'])

        # Try to parse from ho_table_results if present (It's a JSON string often)
        ho_table = patient_data.get('ho_table_results')
        if ho_table:
            try:
                import json
                if isinstance(ho_table, str): ho_data = json.loads(ho_table)
                else: ho_data = ho_table
                
                if ho_data:
                    gestas = ho_data.get('gestas', gestas)
                    partos = ho_data.get('partos', partos)
                    cesareas = ho_data.get('cesareas', cesareas)
                    abortos = ho_data.get('abortos', abortos)
            except: pass

        # Helper to strict int
        def to_int(val):
            try: return int(str(val).strip())
            except: return 0
            
        g = to_int(gestas) if gestas is not None else 0
        p = to_int(partos)
        c = to_int(cesareas)
        a = to_int(abortos)
        e = to_int(ectopicos)
        m = to_int(molares)

        # Fallback for "hoFormula" string (IVG IC IIIA) if stored directly
        ho_formula = patient_data.get('gyn_ho')
        if ho_formula and not (g or p or c or a):
             # Try regex extraction if counts match logic
             import re
             def parse_gpa(txt, regex):
                 match = re.search(regex, txt)
                 return int(match.group(1)) if match else 0
             
             g = parse_gpa(ho_formula, r'G(\d+)')
             p = parse_gpa(ho_formula, r'P(\d+)')
             a = parse_gpa(ho_formula, r'A(\d+)')
             c = parse_gpa(ho_formula, r'C(\d+)')
             
             if 'nuligesta' in ho_formula.lower(): g = 0


        # Si no hay datos de Gestas pero hay otros, asumir G = sum
        if gestas is None and g == 0:
             # Basic check if user skipped pregnancy section
             has_pregnancies = self._get_value_by_keywords(['ha estado embarazada', 'algún embarazo'], patient_data, direct_keys=['gyn_pregnancies'])
             if str(has_pregnancies).lower() in ['si', 'true', 'yes', '1']:
                 if p+c+a > 0: g = p+c+a
             elif str(has_pregnancies).lower() in ['no', 'false', '0']:
                 g = 0

        # Construct GPA String
        gpa_str = ""
        if g == 0 and p == 0 and c == 0 and a == 0:
            if ho_formula and "nuligesta" in ho_formula.lower():
                 gpa_str = "Nuligesta"
            elif g == 0: 
                 gpa_str = "Nuligesta" # Default assumption if no info
        else:
            def to_roman(n):
                if n <= 0: return ""
                val = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1]
                syb = ["M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"]
                roman_num = ''
                i = 0
                while  n > 0:
                    for _ in range(n // val[i]):
                        roman_num += syb[i]
                        n -= val[i]
                    i += 1
                return roman_num

            gpa_list = []
            # User wants format: IVG IC IIIA 
            if g > 0: gpa_list.append(f"{to_roman(g)}G")
            if p > 0: gpa_list.append(f"{to_roman(p)}P")
            if c > 0: gpa_list.append(f"{to_roman(c)}C")
            if a > 0: gpa_list.append(f"{to_roman(a)}A")
            if e > 0: gpa_list.append(f"{to_roman(e)}E")
            
            gpa_str = " ".join(gpa_list)
        
        if gpa_str:
            # Check for Nuligesta/Primigesta labels logic
            prefix = ""
            if g == 1: prefix = "Paciente Primigesta. "
            elif g > 1: prefix = "Paciente Multigesta. " # Optional, user mentioned "Paciente multigesta"
            
            # Legacy JS didn't always prepend "Multigesta" if formula exists, but user asked for it.
            # Let's stick to the prompt: verify why it is missing.
            # If user wants "Paciente Multigesta", we add it. 
            # Safe logic: If formula is complex, formula is better.
            # But let's add the details loop adjacent to formula.
            
            sections.append(f"{prefix}{gpa_str}")

        # --- 1.5 Birth Details (Loop Obs) ---
        # Fetch birth details list
        birth_details = self._get_value_by_keywords(['detalles nacimientos', 'hijos'], patient_data, direct_keys=['birth_details', 'gyn_birth_details'])
        
        # Fallback to ho_table children
        if not birth_details and ho_table:
             try:
                 if isinstance(ho_table, str): ho_data = json.loads(ho_table)
                 else: ho_data = ho_table
                 birth_details = ho_data.get('children')
             except: pass
        
        # Parse if string
        if birth_details and isinstance(birth_details, str):
            try:
                import json
                birth_details = json.loads(birth_details)
            except: birth_details = []

        if birth_details and isinstance(birth_details, list):
            details_list = []
            for child in birth_details:
                # Format: "year weight/height complications"
                # Check keys (legacy JS used year, weight, height, complications)
                y = child.get('year') or child.get('birth_year') or 'N/A'
                w = child.get('weight') or 'N/A'
                h = child.get('height') or 'N/A'
                comp = child.get('complications') or 'Sin complicaciones'
                
                comp_text = ", sin complicaciones" if comp == 'Sin complicaciones' else f", que cursó con {comp}"
                
                details_list.append(f"{y} {w}kg / {h}cm{comp_text}")
            
            if details_list:
                details_str = " -> " + "; ".join(details_list)
                # Append to previous section (Formula) if it exists, or new
                if sections and ('G' in sections[-1] or 'Nuligesta' in sections[-1]):
                    sections[-1] = sections[-1] + details_str
                else:
                    sections.append(details_str)

        # --- 2. Menarche & Sexarche ---
        menarche = self._get_value_by_keywords(['primera menstruación', 'menarquia', 'menarquía'], patient_data, direct_keys=['gyn_menarche'])
        sexarche = self._get_value_by_keywords(['vida sexual', 'sexarquia', 'sexarquía'], patient_data, direct_keys=['gyn_sexarche'])
        
        ms_parts = []
        if menarche: ms_parts.append(f"Menarquía a los {menarche} años") # Capitalize Start if first
        else: pass

        if sexarche: 
             if str(sexarche).lower() in ['niega', 'no', 'nunca']:
                 ms_parts.append("sexarquía niega")
             else:
                 ms_parts.append(f"sexarquía a los {sexarche}")
        
        if ms_parts:
            # Check if this is the start of sentence
            txt = ' y '.join(ms_parts)
            if not gpa_str: txt = txt.capitalize()
            sections.append(txt)

        # --- 3. Cycles ---
        regular_cycles = self._get_value_by_keywords(['regulares', 'regularidad'], patient_data, direct_keys=['gyn_cycles'])
        
        # Logic matches JS: checks if "irregulares" is in string
        is_irreg = False
        if regular_cycles:
             if 'irregulares' in str(regular_cycles).lower(): is_irreg = True
             if str(regular_cycles).lower() == 'false': is_irreg = True
        
        cycle_desc = "Refiere ciclos menstruales irregulares" if is_irreg else "Refiere ciclos menstruales regulares"
        
        # Add details if irregular (Duration X Frequency Y)
        if is_irreg and regular_cycles and 'Duración:' in str(regular_cycles):
             # Try to extract existing phrase, or just append it
             pass 

        # Dysmenorrhea
        dysmenorrhea = self._get_value_by_keywords(['dolor menstrual', 'dismenorrea'], patient_data, direct_keys=['gyn_dysmenorrhea'])
        
        pain_desc = ""
        has_pain = False
        if dysmenorrhea and str(dysmenorrhea).lower() not in ['no', 'niega', 'false']:
            has_pain = True
            intensity = self._get_value_by_keywords(['intensidad', 'fuerte'], patient_data, direct_keys=['gyn_dysmenorrhea_scale_value'])
            
            # Fallback extraction from string "intensidad: 9/10"
            if not intensity:
                 import re
                 m = re.search(r'intensidad: (\d+)', str(dysmenorrhea))
                 if m: intensity = m.group(1)

            if intensity:
                pain_desc = f", asociados a dismenorrea de intensidad {intensity}/10"
            else:
                pain_desc = ", asociados a dismenorrea"
        else:
            pain_desc = ", sin dismenorrea" # JS logic adds this

        sections.append(f"{cycle_desc}{pain_desc}")

        # --- 4. FUR (FUM) ---
        fur = self._get_value_by_keywords(['fecha última', 'fum', 'fur'], patient_data, direct_keys=['gyn_fum'])
        
        if fur:
            val_fur = str(fur)
            if isinstance(fur, datetime): val_fur = fur.strftime('%Y-%m-%d')
            sections.append(f"Su FUM fue el {val_fur}")

        # --- 5. Contraceptive ---
        uses_contr = self._get_value_by_keywords(['anticonceptivo', 'proteges'], patient_data, direct_keys=['gyn_mac'])
        
        if uses_contr and str(uses_contr).lower() not in ['no', 'false', 'ninguno']:
             # JS Logic: "Utiliza como método anticonceptivo: X"
             method = str(uses_contr).replace("['", "").replace("']", "")
             sections.append(f"Utiliza como método anticonceptivo: {method.lower()}")
        
        # --- 6. Sexual Activity / Fertility Wish ---
        sexually_active = self._get_value_by_keywords(['actividad sexual'], patient_data, direct_keys=['sexually_active'])
        fertility_intent = self._get_value_by_keywords(['deseo fertilidad'], patient_data, direct_keys=['gyn_fertility_intent'])

        # Logic from JS
        is_active = False
        if sexually_active:
             if str(sexually_active).lower() in ['si', 'sí', 'true', 'yes']: is_active = True
        
        if is_active:
             fert_text = "sin deseo de fertilidad"
             if fertility_intent:
                  intent = str(fertility_intent).lower()
                  if 'más de un año' in intent: fert_text = "con deseo de fertilidad (>1 año)"
                  elif 'no tiene' in intent: fert_text = "sin deseo de fertilidad"
                  elif 'prefiere no' in intent: fert_text = "(no especifica deseo de fertilidad)"
             
             sections.append(f"Mantiene actividad sexual activa {fert_text}")

        # --- 7. Last Checkups ---
        last_gyn = self._get_value_by_keywords(['control ginecológico', 'ginecologo'], patient_data, direct_keys=['gyn_previous_checkups'])
        last_cyto = self._get_value_by_keywords(['citología', 'papanicolau'], patient_data, direct_keys=['gyn_last_pap_smear'])
        
        # JS Logic handles "nunca" etc.
        def clean_date(d):
            if not d or str(d).lower() in ['nunca', 'no', 'n/a']: return None
            return str(d)

        lg = clean_date(last_gyn)
        lc = clean_date(last_cyto)

        if lg: sections.append(f"Su último control ginecológico fue en {lg.lower()}")
        if lc: sections.append(f"Su última citología fue realizada en {lc.lower()}")

        if not sections:
            return "Historia ginecológica sin particularidades."
        
        # Join sentences properly
        full_narrative = ". ".join(sections)
        if not full_narrative.endswith('.'): full_narrative += "."
        
        # Cleanup double dots
        full_narrative = full_narrative.replace('..', '.')
        return full_narrative
    
    def _summarize_current_symptoms(self, patient_data: Dict[str, Any]) -> str:
        """
        Genera resumen del examen funcional.
        Basado en la lógica del bot de Telegram (summaries.py).
        """
        # Verificar si hay algún dato de examen funcional
        functional_keys = [
            'functional_dispareunia', 'functional_leg_pain', 'functional_gastro_before',
            'functional_gastro_during', 'functional_dischezia', 'functional_bowel_freq',
            'functional_urinary_problem', 'functional_urinary_pain', 'functional_urinary_irritation',
            'functional_urinary_incontinence', 'functional_urinary_nocturia'
        ]
        
        has_functional_data = any(patient_data.get(k) for k in functional_keys)
        
        # Fallback por palabras clave si no están las claves directas
        if not has_functional_data:
            # Si no hay claves directas, buscamos si hay alguna respuesta en las preguntas de examen funcional
            # (IDs TEMPLATE_... que coincidan con la sección funcional)
            pass 

        if not has_functional_data:
            return "Sin síntomas relevantes."

        summary_parts = []
        
        # 1. Dispareunia
        dispareunia = patient_data.get('functional_dispareunia')
        if dispareunia and str(dispareunia).lower() == 'sí':
            d_type = patient_data.get('functional_dispareunia_type')
            d_scale = patient_data.get('functional_dispareunia_deep_scale')
            
            if d_type:
                intensity_text = f" (Intensidad: {d_scale}/10)" if d_scale else ""
                summary_parts.append(f"La paciente refiere dispareunia de tipo {str(d_type).lower()}{intensity_text}.")
            else:
                summary_parts.append("Refiere dispareunia.")
        elif dispareunia and str(dispareunia).lower() == 'no':
            summary_parts.append("Niega dispareunia.")

        # 2. Dolor en miembros inferiores
        leg_pain = patient_data.get('functional_leg_pain')
        if leg_pain and str(leg_pain).lower() == 'sí':
            p_type = patient_data.get('functional_leg_pain_type')
            p_zone = patient_data.get('functional_leg_pain_zone')
            
            type_text = f", descrito como '{p_type}'" if p_type else ""
            zone_text = f" en la {p_zone}" if p_zone else ""
            summary_parts.append(f"Presenta dolor en miembros inferiores durante la menstruación{type_text}{zone_text}.")
        elif leg_pain and str(leg_pain).lower() == 'no':
            summary_parts.append("Niega dolor en miembros inferiores durante la menstruación.")

        # 3. Gastrointestinal
        g_before = patient_data.get('functional_gastro_before')
        g_during = patient_data.get('functional_gastro_during')
        dischezia = patient_data.get('functional_dischezia')
        bowel_freq = patient_data.get('functional_bowel_freq')
        
        s_g_before = str(g_before) if g_before and g_before != 'No' else ''
        s_g_during = str(g_during) if g_during and g_during != 'No' else ''
        s_dischezia = str(dischezia) if dischezia else 'No'
        s_bowel_freq = str(bowel_freq) if bowel_freq else 'N/A'

        symptoms_set = set()
        if s_g_before:
            if isinstance(g_before, list): symptoms_set.update(str(s).lower() for s in g_before)
            else: symptoms_set.update(s.strip().lower() for s in s_g_before.split(','))
            
        if s_g_during:
            if isinstance(g_during, list): symptoms_set.update(str(s).lower() for s in g_during)
            else: symptoms_set.update(s.strip().lower() for s in s_g_during.split(','))
        
        if symptoms_set or s_dischezia.lower() != 'no':
            gastro_summary = "A nivel gastrointestinal, manifiesta"
            if "dolor al evacuar" in symptoms_set:
                symptoms_set.remove("dolor al evacuar")
            
            symptoms_text = ", ".join(sorted(list(symptoms_set)))
            final_symptoms = ""
            if symptoms_text:
                final_symptoms = f" síntomas como {symptoms_text}"
                if s_dischezia.lower() != 'no':
                    final_symptoms += f" y dolor al evacuar (disquecia {s_dischezia.lower()})"
            elif s_dischezia.lower() != 'no':
                final_symptoms = f" dolor al evacuar (disquecia {s_dischezia.lower()})"
            
            gastro_summary += final_symptoms + "."
            
            if s_bowel_freq != 'N/A':
                gastro_summary += f" Su frecuencia evacuatoria es de {s_bowel_freq.lower()}."
            summary_parts.append(gastro_summary)
        else:
            if s_bowel_freq != 'N/A':
                 summary_parts.append(f"A nivel gastrointestinal, no refiere síntomas significativos, con una frecuencia evacuatoria {s_bowel_freq.lower()}.")

        # 4. Urinario
        u_prob = patient_data.get('functional_urinary_problem')
        if u_prob and str(u_prob).lower() == 'sí':
            urinary_info = []
            u_pain = patient_data.get('functional_urinary_pain')
            if u_pain and str(u_pain).lower() == 'sí':
                u_scale = patient_data.get('functional_urinary_pain_scale')
                scale_text = f" ({u_scale}/10)" if u_scale else ""
                urinary_info.append(f"dolor al orinar{scale_text}")
            
            others = []
            if str(patient_data.get('functional_urinary_irritation')).lower() == 'sí': others.append("irritación")
            if str(patient_data.get('functional_urinary_incontinence')).lower() == 'sí': others.append("incontinencia")
            if str(patient_data.get('functional_urinary_nocturia')).lower() == 'sí': others.append("nocturia")
            
            if others:
                urinary_info.append(" y ".join(others))
            
            if urinary_info:
                summary_parts.append(f"En el sistema urinario, confirma problemas, específicamente con {', '.join(urinary_info)}.")
            else:
                summary_parts.append("En el sistema urinario, confirma problemas no especificados.")
        elif u_prob and str(u_prob).lower() == 'no':
            summary_parts.append("Hábito miccional conservado.")

        return " ".join(summary_parts)

    
    def _summarize_lifestyle(self, patient_data: Dict[str, Any]) -> str:
        """
        Genera resumen del estilo de vida usando claves directas.
        """
        summary_parts = []
        
        # 1. Physical Activity
        activity = patient_data.get('habits_physical_activity')
        if activity and str(activity).lower() == 'sí':
             summary_parts.append("La paciente refiere realizar actividad física de forma regular.")
        elif activity and str(activity).lower() == 'no':
             summary_parts.append("Niega realizar actividad física de forma regular.")

        # 2. Habits (Smoking, Alcohol, Substances)
        smoking = str(patient_data.get('habits_smoking') or 'No').lower()
        alcohol = str(patient_data.get('habits_alcohol') or 'No').lower()
        substances = str(patient_data.get('habits_substance_use') or 'No').lower()

        habits_text = ""
        if smoking == 'no' and alcohol == 'no':
            habits_text = "Manifiesta no fumar y tampoco consume alcohol"
            if substances == 'no' or 'niega' in substances:
                habits_text += ", y niega el uso de otras sustancias."
            else:
                habits_text += f", y refiere uso de otras sustancias ({substances})."
        else:
            parts = []
            if smoking != 'no':
                parts.append(f"fuma ({smoking})")
            else:
                parts.append("no fuma")
                
            if alcohol != 'no':
                parts.append(f"consume alcohol ({alcohol})")
            else:
                parts.append("no consume alcohol")
                
            habits_text = "Refiere que " + " y ".join(parts)
            if substances != 'no' and 'niega' not in substances.lower():
                habits_text += f", y confirma uso de otras sustancias ({substances})."
            else:
                habits_text += ", y niega el uso de otras sustancias."

        summary_parts.append(habits_text)
        
        return " ".join(summary_parts)
    
    def generate_summary_sections(self, patient_data: Dict[str, Any], patient_name: str) -> Dict[str, str]:
        """Genera todas las secciones del resumen."""
        # Extraer información
        demographics = self._extract_demographics(patient_data)
        medical_history = self._summarize_medical_history(patient_data)
        gynecological_history = self._summarize_gynecological_history(patient_data)
        current_symptoms = self._summarize_current_symptoms(patient_data)
        lifestyle = self._summarize_lifestyle(patient_data)
        
        # Construir descripción demográfica
        demographic_parts = []
        if 'edad' in demographics:
            demographic_parts.append(f"{demographics['edad']} años")
        if 'localidad' in demographics:
            demographic_parts.append(f"de {demographics['localidad']}")
        if 'ocupacion' in demographics:
            demographic_parts.append(f"{demographics['ocupacion']}")
        
        demographic_desc = ", ".join(demographic_parts)
        
        # Construir sección general con paréntesis
        general = f"{patient_name.upper()} ({demographic_desc})" if demographic_desc else f"{patient_name.upper()}"
        
        # Construir secciones
        return {
            "summary_general": general,
            "summary_medical": medical_history.capitalize() + ".",
            "summary_obstetric": gynecological_history.capitalize() + ".",
            "summary_functional": current_symptoms.capitalize() + ".",
            "summary_lifestyle": lifestyle.capitalize() + "."
        }


class ClinicalSummaryGenerator:
    """
    Generates a coherent clinical summary from pre-consultation chatbot answers.
    Integra el nuevo generador narrativo conciso.
    """

    @staticmethod
    def generate(appointment=None, preconsultation_answers: Union[List, Dict] = None, 
                 template_data: Optional[List[Dict]] = None) -> dict:
        """
        Main entry point. Takes appointment (optional) and preconsultation answers.
        Si se proporciona template_data, usa el nuevo generador narrativo.
        """
        if not preconsultation_answers:
            return ClinicalSummaryGenerator._empty_summary()
        
        # Si hay template_data, usar el nuevo generador narrativo
        if template_data:
            return ClinicalSummaryGenerator._generate_narrative_summary(
                appointment, preconsultation_answers, template_data
            )
        
        # Método original (legacy)
        data_map = {}
        text_map = {}
        
        # Populate maps from answers
        if isinstance(preconsultation_answers, list):
            ClinicalSummaryGenerator._populate_maps_from_list(preconsultation_answers, data_map, text_map)
        elif isinstance(preconsultation_answers, dict):
            ClinicalSummaryGenerator._populate_maps_from_dict(preconsultation_answers, data_map, text_map)
        
        # Get patient from appointment if available
        patient = appointment.patient if appointment and hasattr(appointment, 'patient') else None
        
        # Generate sections
        general = ClinicalSummaryGenerator._process_general_data(text_map, data_map, patient)
        medical = ClinicalSummaryGenerator._process_medical_history(text_map, data_map)
        obstetric = ClinicalSummaryGenerator._process_obstetric(text_map, data_map)
        functional = ClinicalSummaryGenerator._process_functional(text_map, data_map)
        lifestyle = ClinicalSummaryGenerator._process_lifestyle(text_map, data_map)
        
        full_text = ClinicalSummaryGenerator._generate_full_narrative(
            general, medical, obstetric, functional, lifestyle
        )
        
        return {
            "summary_general": general,
            "summary_medical": medical,
            "summary_obstetric": obstetric,
            "summary_functional": functional,
            "summary_lifestyle": lifestyle,
            "full_narrative_html": full_text
        }

    @staticmethod
    def _generate_narrative_summary(appointment, preconsultation_answers, template_data):
        """Genera resumen usando el nuevo generador narrativo."""
        try:
            # Convertir respuestas a formato de diccionario
            patient_data = {}
            
            if isinstance(preconsultation_answers, list):
                for ans in preconsultation_answers:
                    if isinstance(ans, dict):
                        qid = ans.get('question_id')
                        val = ans.get('text_value')
                    else:
                        qid = getattr(ans, 'question_id', None)
                        val = getattr(ans, 'text_value', None)
                    
                    if qid and val is not None:
                        patient_data[str(qid)] = val
            elif isinstance(preconsultation_answers, dict):
                patient_data = preconsultation_answers
            
            # Obtener nombre del paciente
            patient_name = "Paciente"
            if appointment:
                # Intenta obtener el nombre desde el atributo directo (modelo Appointment)
                if hasattr(appointment, 'patient_name') and appointment.patient_name:
                    patient_name = appointment.patient_name
                # O desde la relación patient
                elif hasattr(appointment, 'patient') and appointment.patient:
                     if hasattr(appointment.patient, 'name'):
                        patient_name = appointment.patient.name
            
            # Crear generador narrativo
            summarizer = NarrativePreconsultaSummarizer(template_data)
            
            # Generar secciones
            sections = summarizer.generate_summary_sections(patient_data, patient_name)
            
            # Generar HTML del resumen narrativo completo
            full_text = ClinicalSummaryGenerator._generate_narrative_html(sections)
            
            return {
                "summary_general": sections["summary_general"],
                "summary_medical": sections["summary_medical"],
                "summary_obstetric": sections["summary_obstetric"],
                "summary_functional": sections["summary_functional"],
                "summary_lifestyle": sections["summary_lifestyle"],
                "full_narrative_html": full_text
            }
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            logger.error(f"Error generando resumen narrativo: {str(e)}")
            # Fallback al método original
            return ClinicalSummaryGenerator._generate_fallback_summary(appointment, preconsultation_answers)

    @staticmethod
    def _generate_narrative_html(sections: Dict[str, str]) -> str:
        """Genera HTML para el resumen narrativo con párrafos separados."""
        narrative_parts = []
        
        # Exclude general from body, structure others as paragraphs
        keys = ["summary_medical", "summary_obstetric", "summary_functional", "summary_lifestyle"]
        
        for key in keys:
             text_content = sections.get(key)
             if text_content:
                 narrative_parts.append(f"<p>{text_content}</p>")
        
        if not narrative_parts:
            return "<p>No hay información clínica disponible.</p>"
        
        # Join with newlines (readability)
        full_text = "\n".join(narrative_parts)
        
        return f"""
        <div style="font-family: sans-serif; line-height: 1.5;">
            {full_text}
        </div>
        """.strip()

    @staticmethod
    def _generate_fallback_summary(appointment, preconsultation_answers):
        """Método de fallback cuando el nuevo generador falla."""
        data_map = {}
        text_map = {}
        
        if isinstance(preconsultation_answers, list):
            ClinicalSummaryGenerator._populate_maps_from_list(preconsultation_answers, data_map, text_map)
        elif isinstance(preconsultation_answers, dict):
            ClinicalSummaryGenerator._populate_maps_from_dict(preconsultation_answers, data_map, text_map)
        
        patient = appointment.patient if appointment and hasattr(appointment, 'patient') else None
        
        general = ClinicalSummaryGenerator._process_general_data(text_map, data_map, patient)
        medical = ClinicalSummaryGenerator._process_medical_history(text_map, data_map)
        obstetric = ClinicalSummaryGenerator._process_obstetric(text_map, data_map)
        functional = ClinicalSummaryGenerator._process_functional(text_map, data_map)
        lifestyle = ClinicalSummaryGenerator._process_lifestyle(text_map, data_map)
        
        full_text = ClinicalSummaryGenerator._generate_full_narrative(
            general, medical, obstetric, functional, lifestyle
        )
        
        return {
            "summary_general": general,
            "summary_medical": medical,
            "summary_obstetric": obstetric,
            "summary_functional": functional,
            "summary_lifestyle": lifestyle,
            "full_narrative_html": full_text
        }

    # ===========================================================================
    # MÉTODOS ORIGINALES (para compatibilidad)
    # ===========================================================================
    
    @staticmethod
    def _populate_maps_from_list(answers_list: List, data_map: Dict, text_map: Dict):
        """Populate data_map and text_map from a list of answer objects/dicts."""
        for ans in answers_list:
            # Extract data from SQLAlchemy object or dict
            if isinstance(ans, dict):
                qid = str(ans.get('question_id', ''))
                val = ans.get('text_value')
                q_node = ans.get('question')
                q_text = q_node.get('text') if isinstance(q_node, dict) else ""
            else:
                qid = str(getattr(ans, 'question_id', ''))
                val = getattr(ans, 'text_value', None)
                q_node = getattr(ans, 'question', None)
                q_text = getattr(q_node, 'text', '') if q_node else ""
            
            if qid:
                data_map[qid.lower()] = val
            if q_text:
                text_map[q_text.lower()] = val

    @staticmethod
    def _populate_maps_from_dict(answers_dict: Dict, data_map: Dict, text_map: Dict):
        """Populate data_map from a dictionary where keys are question IDs."""
        # For dict format, we only have data_map, not text_map
        for qid, val in answers_dict.items():
            data_map[str(qid).lower()] = val
        # Note: text_map remains empty in this case

    @staticmethod
    def _empty_summary() -> dict:
        """Return empty summary structure."""
        return {
            "summary_general": "",
            "summary_medical": "",
            "summary_obstetric": "",
            "summary_functional": "",
            "summary_lifestyle": "",
            "full_narrative_html": ""
        }

    @staticmethod
    def _clean_value(value) -> Optional[str]:
        """Clean value for presentation."""
        if value is None:
            return None
        
        if isinstance(value, list):
            return ", ".join(str(item).strip() for item in value if item)
        
        s = str(value).strip()
        
        # Clean list representations
        if s.startswith('[') and s.endswith(']'):
            s = s[1:-1].replace("'", "").replace('"', "").strip()
        
        return s if s else None

    @staticmethod
    def _to_bool(value) -> Optional[bool]:
        """Convert any value to boolean robustly."""
        if value is None:
            return None
        
        s = str(value).lower().strip()
        if s in ('true', '1', 'yes', 'sí', 'si', 'verdadero', 't', 'y'):
            return True
        elif s in ('false', '0', 'no', 'falso', 'f', 'n'):
            return False
        
        return None

    @staticmethod
    def _find_answer(text_map: Dict, data_map: Dict, search_terms: List[str], 
                    exclude_keywords: Optional[List[str]] = None) -> Optional[str]:
        """
        Helper to find an answer by search terms.
        """
        # Clean search terms
        search_terms = [term.lower().strip() for term in search_terms if term]
        
        # 1. Search in data_map by key (search terms that look like IDs)
        for term in search_terms:
            if term in data_map and data_map[term] not in (None, ''):
                return ClinicalSummaryGenerator._clean_value(data_map[term])
        
        # 2. Search in text_map by question text
        if not text_map:
            return None
        
        # Filter search terms for text matching (exclude ID-like terms with underscores)
        text_search_terms = [term for term in search_terms if '_' not in term]
        
        if not text_search_terms:
            return None
        
        for q_text, val in text_map.items():
            if val is None or val == '':
                continue
            
            q_lower = q_text.lower()
            
            # Check exclusions
            if exclude_keywords:
                exclude_keywords_lower = [ex.lower() for ex in exclude_keywords]
                if any(ex in q_lower for ex in exclude_keywords_lower):
                    continue
            
            # Check if all search terms are in the question text
            if all(term in q_lower for term in text_search_terms):
                return ClinicalSummaryGenerator._clean_value(val)
        
        return None

    @staticmethod
    def _process_general_data(text_map: Dict, data_map: Dict, patient=None) -> str:
        """Process general patient data."""
        # Try to get name from patient object first
        name = None
        age = None
        
        if patient:
            name = getattr(patient, 'name', None)
            # Calculate age from date of birth if available
            if hasattr(patient, 'date_of_birth') and patient.date_of_birth:
                try:
                    dob = patient.date_of_birth
                    # Handle timezone-aware datetime if necessary
                    if hasattr(dob, 'tzinfo') and dob.tzinfo:
                        from datetime import timezone
                        dob = dob.replace(tzinfo=None)
                    
                    today = datetime.now()
                    # CRITICAL: Ensure age calculation is robust
                    age_calc = today.year - dob.year
                    
                    # Adjust if birthday hasn't occurred this year
                    if (today.month, today.day) < (dob.month, dob.day):
                        age_calc -= 1
                    
                    age = str(age_calc)
                except (AttributeError, TypeError):
                    age = None
        
        # Fallback to answers if not from patient
        if not name:
            name = ClinicalSummaryGenerator._find_answer(
                text_map, data_map, 
                ['full_name', 'nombre', 'nombre completo']
            )
        
        # Try finding date of birth in answers to calculate age
        if not age:
            dob_str = ClinicalSummaryGenerator._find_answer(
                text_map, data_map,
                ['birth_date', 'fecha_nacimiento', 'fecha nacimiento', 'nacimiento']
            )
            if dob_str:
                try:
                    # Attempt common formats
                    for fmt in ['%Y-%m-%d', '%d/%m/%Y', '%d-%m-%Y']:
                        try:
                            dob = datetime.strptime(dob_str, fmt)
                            today = datetime.now()
                            age_calc = today.year - dob.year
                            if (today.month, today.day) < (dob.month, dob.day):
                                age_calc -= 1
                            age = str(age_calc)
                            break
                        except ValueError:
                            continue
                except Exception:
                    pass

        if not age:
            age = ClinicalSummaryGenerator._find_answer(
                text_map, data_map, 
                ['age', 'edad', 'TEMPLATE_1766696938087_1']
            )
        
        # Get location/address
        location = ClinicalSummaryGenerator._find_answer(
            text_map, data_map,
            ['location', 'residencia', 'dirección', 'direccion', 'dirección de residencia']
        )
        
        # Get occupation
        occupation = ClinicalSummaryGenerator._find_answer(
            text_map, data_map,
            ['occupation', 'ocupación', 'ocupacion']
        )
        
        # Build summary
        parts = []
        
        # Start with name (UPPERCASE as requested)
        name_part = str(name).upper() if name else 'PACIENTE'
        parts.append(name_part)
        
        # Add age if available
        if age:
            parts.append(f"{age} años")
        
        # Add occupation if available
        if occupation:
            parts.append(f"{occupation}")
        
        # Add location if available
        if location:
            parts.append(f"residencia en {location}")
            
        # Add reason for visit / objective if explicitly found (not the lifestyle one)
        reason = ClinicalSummaryGenerator._find_answer(
            text_map, data_map,
            ['reason_for_visit', 'motivo de consulta']
        )
        if reason:
             parts.append(f"Motivo: {reason}")
        
        return ", ".join(parts) + "."

    @staticmethod
    def _process_medical_history(text_map: Dict, data_map: Dict) -> str:
        """Process medical history section."""
        summary_parts = []
        
        # Family History - Mother
        mom_has_history = ClinicalSummaryGenerator._to_bool(
            ClinicalSummaryGenerator._find_answer(
                text_map, data_map,
                ['family_history_mother', 'madre', 'antecedentes médicos importantes madre']
            )
        )
        
        if mom_has_history is True:
            mom_details = ClinicalSummaryGenerator._find_answer(
                text_map, data_map,
                ['family_history_mother_details', 'antecedentes de tu madre', 'selecciona los antecedentes de tu madre'],
                exclude_keywords=['tiene', 'importantes']
            )
            summary_parts.append(
                f"Madre: {mom_details}" if mom_details else "Madre con antecedentes positivos"
            )
        elif mom_has_history is False:
            summary_parts.append("Madre sin antecedentes relevantes")
        
        # Family History - Father
        dad_has_history = ClinicalSummaryGenerator._to_bool(
            ClinicalSummaryGenerator._find_answer(
                text_map, data_map,
                ['family_history_father', 'padre', 'antecedentes médicos importantes padre']
            )
        )
        
        if dad_has_history is True:
            dad_details = ClinicalSummaryGenerator._find_answer(
                text_map, data_map,
                ['family_history_father_details', 'antecedentes de tu padre', 'selecciona los antecedentes de tu padre'],
                exclude_keywords=['tiene', 'importantes']
            )
            summary_parts.append(
                f"Padre: {dad_details}" if dad_details else "Padre con antecedentes positivos"
            )
        elif dad_has_history is False:
            summary_parts.append("Padre sin antecedentes relevantes")
        
        # Personal History
        personal_has_history = ClinicalSummaryGenerator._to_bool(
            ClinicalSummaryGenerator._find_answer(
                text_map, data_map,
                ['personal_history', 'antecedentes médicos personales', 'tienes antecedentes médicos personales']
            )
        )
        
        if personal_has_history is True:
            personal_details = ClinicalSummaryGenerator._find_answer(
                text_map, data_map,
                ['personal_history_details', 'selecciona tus antecedentes personales', 'antecedentes personales']
            )
            summary_parts.append(
                f"Personales: {personal_details}" if personal_details else "Antecedentes personales positivos"
            )
        elif personal_has_history is False:
            summary_parts.append("Niega patologías crónicas personales")
        
        # Surgical History
        has_surgery = ClinicalSummaryGenerator._to_bool(
            ClinicalSummaryGenerator._find_answer(
                text_map, data_map,
                ['surgical_history', 'cirugía', 'realizado alguna cirugía', 'alguna cirugía']
            )
        )
        
        if has_surgery is True:
            surgery_details = ClinicalSummaryGenerator._find_answer(
                text_map, data_map,
                ['surgical_history_details', 'describe tus cirugías', 'cirugías previas']
            )
            summary_parts.append(
                f"Quirúrgicos: {surgery_details}" if surgery_details else "Cirugías previas reportadas"
            )
        elif has_surgery is False:
            summary_parts.append("Sin antecedentes quirúrgicos")
        
        # Supplements/Medications
        takes_supplements = ClinicalSummaryGenerator._to_bool(
            ClinicalSummaryGenerator._find_answer(
                text_map, data_map,
                ['supplements', 'suplemento', 'vitamina', 'tomas algún suplemento']
            )
        )
        
        if takes_supplements is True:
            supplement_details = ClinicalSummaryGenerator._find_answer(
                text_map, data_map,
                ['supplements_details', 'indica qué suplementos', 'suplementos tomas']
            )
            if supplement_details:
                summary_parts.append(f"Suplementos: {supplement_details}")
        
        # Combine all parts
        if summary_parts:
            return "Antecedentes: " + "; ".join(summary_parts) + "."
        return "Antecedentes médicos no reportados."

    @staticmethod
    def _process_obstetric(text_map: Dict, data_map: Dict) -> str:
        """Process obstetric and gynecological history."""
        parts = []
        
        # OBSTETRIC STATUS (Priority - uppercase as requested)
        obstetric_status = ClinicalSummaryGenerator._find_answer(
            text_map, data_map,
            ['obstetric_history_type', 'historial obstétrico', 'historial obstetrico']
        )
        
        if obstetric_status:
            # Clean up status string
            clean_status = str(obstetric_status).split('(')[0].strip()
            parts.append(f"PACIENTE {clean_status.upper()}.")
        
        # Fertility Wish
        fertility_wish = ClinicalSummaryGenerator._find_answer(
             text_map, data_map,
             ['fertility_wish', 'deseo de fertilidad', 'deseas tener hijos']
        )
        if fertility_wish:
             parts.append(f"Deseo de fertilidad: {fertility_wish}.")
        
        # Check for previous pregnancies if applicable
        has_other_pregnancies = ClinicalSummaryGenerator._to_bool(
            ClinicalSummaryGenerator._find_answer(
                text_map, data_map,
                ['other_pregnancies', 'otros embarazos', 'embarazos además del actual']
            )
        )
        
        if has_other_pregnancies is True:
            complications = ClinicalSummaryGenerator._find_answer(
                text_map, data_map,
                ['obstetric_complications', 'complicaciones en el parto', 'complicaciones parto']
            )
            if complications:
                parts.append(f"Complicaciones obstétricas previas: {complications}.")

        # GPA Calculation (Gravidity, Parity, Abortions, C-Sections)
        gpa_parts = []
        
        gestas = ClinicalSummaryGenerator._find_answer(text_map, data_map, ['pregnancies_count', 'número de embarazos', 'cuántas veces has estado embarazada'])
        partos = ClinicalSummaryGenerator._find_answer(text_map, data_map, ['births_count', 'partos vaginales', 'número de partos'])
        abortos = ClinicalSummaryGenerator._find_answer(text_map, data_map, ['abortions_count', 'abortos', 'número de abortos'])
        cesareas = ClinicalSummaryGenerator._find_answer(text_map, data_map, ['c_sections_count', 'cesáreas', 'número de cesáreas'])
        
        # Heuristic for Nuligesta
        if not gestas and (str(has_other_pregnancies).lower() in ('false', 'no', '0', 'f') or str(obstetric_status).lower() == 'nuligesta'):
            gpa_parts.append("Nuligesta")
        elif gestas:
             gpa_line = f"G:{gestas}"
             if partos: gpa_line += f" P:{partos}"
             if cesareas: gpa_line += f" C:{cesareas}"
             if abortos: gpa_line += f" A:{abortos}"
             gpa_parts.append(gpa_line)
        
        if gpa_parts:
            parts.append("Formula Obstétrica: " + " ".join(gpa_parts) + ".")

        
        # GYNECOLOGICAL HISTORY
        # Menarche
        menarche = ClinicalSummaryGenerator._find_answer(
            text_map, data_map,
            ['menarche', 'primera menstruación', 'edad primera menstruacion']
        )
        if menarche:
            parts.append(f"Menarquía a los {menarche} años.")
        
        # Sexual debut
        sexarche = ClinicalSummaryGenerator._find_answer(
            text_map, data_map,
            ['sexarche', 'inicio vida sexual', 'edad inicio sexual']
        )
        if sexarche:
            parts.append(f"Sexarquía a los {sexarche} años.")
        
        # Cycle regularity
        cycles_regular = ClinicalSummaryGenerator._to_bool(
            ClinicalSummaryGenerator._find_answer(
                text_map, data_map,
                ['menstrual_cycles_regular', 'ciclos menstruales regulares', 'ciclos regulares']
            )
        )
        
        if cycles_regular is True:
            parts.append("Ciclos regulares.")
            # Get cycle details if available
            cycle_length = ClinicalSummaryGenerator._find_answer(
                text_map, data_map,
                ['cycle_length', 'duración ciclos', 'duran tus ciclos']
            )
            cycle_frequency = ClinicalSummaryGenerator._find_answer(
                text_map, data_map,
                ['cycle_frequency', 'cada cuántos días', 'viene la regla']
            )
            
            if cycle_length:
                parts.append(f"Duración: {cycle_length} días.")
            if cycle_frequency:
                parts.append(f"Frecuencia: cada {cycle_frequency} días.")
        elif cycles_regular is False:
            parts.append("Ciclos irregulares.")
        
        # Dysmenorrhea
        has_dysmenorrhea = ClinicalSummaryGenerator._to_bool(
            ClinicalSummaryGenerator._find_answer(
                text_map, data_map,
                ['dysmenorrhea', 'dolor menstrual', 'dismenorrea']
            )
        )
        
        if has_dysmenorrhea is True:
            pain_intensity = ClinicalSummaryGenerator._find_answer(
                text_map, data_map,
                ['dysmenorrhea_intensity', 'intensidad dolor', 'qué tan fuerte es el dolor']
            )
            pain_text = "Dismenorrea"
            if pain_intensity:
                pain_text += f" (intensidad {pain_intensity}/10)"
            parts.append(pain_text + ".")
        elif has_dysmenorrhea is False:
            parts.append("Sin dismenorrea.")
        
        # Last menstrual period
        lmp = ClinicalSummaryGenerator._find_answer(
            text_map, data_map,
            ['last_menstrual_period', 'última menstruación', 'fecha última regla', 'FUR']
        )
        if lmp:
            parts.append(f"FUR: {lmp}.")
        
        # Contraceptive use
        uses_contraceptive = ClinicalSummaryGenerator._to_bool(
            ClinicalSummaryGenerator._find_answer(
                text_map, data_map,
                ['contraceptive_use', 'método anticonceptivo', 'usas algún método']
            )
        )
        
        if uses_contraceptive is True:
            contraceptive_methods = ClinicalSummaryGenerator._find_answer(
                text_map, data_map,
                ['contraceptive_methods', 'métodos anticonceptivos', 'selecciona tus métodos']
            )
            if contraceptive_methods:
                parts.append(f"Método anticonceptivo: {contraceptive_methods}.")
        elif uses_contraceptive is False:
            parts.append("No usa métodos anticonceptivos.")
        
        # Last checkups
        last_checkup = ClinicalSummaryGenerator._find_answer(
            text_map, data_map,
            ['last_gyn_checkup', 'último chequeo ginecológico', 'chequeo ginecológico']
        )
        if last_checkup:
            parts.append(f"Último control ginecológico: {last_checkup}.")
        
        last_pap = ClinicalSummaryGenerator._find_answer(
            text_map, data_map,
            ['last_pap_smear', 'última citología', 'Papanicolau']
        )
        if last_pap:
            parts.append(f"Última citología: {last_pap}.")
        
        # Combine all parts
        if parts:
            return " ".join(parts)
        return "Historia gineco-obstétrica no reportada."

    @staticmethod
    def _process_functional(text_map: Dict, data_map: Dict) -> str:
        """
        Process functional exam findings using direct keys (non-heuristic).
        Based on bot logic (summaries.py).
        """
        summary_parts = []
        
        # 1. Dispareunia
        dispareunia = text_map.get('functional_dispareunia')
        if dispareunia and str(dispareunia).lower() == 'sí':
            d_type = text_map.get('functional_dispareunia_type')
            d_scale = text_map.get('functional_dispareunia_deep_scale')
            
            if d_type:
                intensity_text = f" (Intensidad: {d_scale}/10)" if d_scale else ""
                summary_parts.append(f"La paciente refiere dispareunia de tipo {str(d_type).lower()}{intensity_text}.")
            else:
                summary_parts.append("Refiere dispareunia.")
        elif dispareunia and str(dispareunia).lower() == 'no':
            summary_parts.append("Niega dispareunia.")

        # 2. Dolor en piernas
        leg_pain = text_map.get('functional_leg_pain')
        if leg_pain and str(leg_pain).lower() == 'sí':
            p_type = text_map.get('functional_leg_pain_type')
            p_zone = text_map.get('functional_leg_pain_zone')
            
            type_text = f", descrito como '{p_type}'" if p_type else ""
            zone_text = f" en la {p_zone}" if p_zone else ""
            summary_parts.append(f"Presenta dolor en miembros inferiores durante la menstruación{type_text}{zone_text}.")
        elif leg_pain and str(leg_pain).lower() == 'no':
            summary_parts.append("Niega dolor en miembros inferiores durante la menstruación.")

        # 3. Gastrointestinal
        g_before = text_map.get('functional_gastro_before')
        g_during = text_map.get('functional_gastro_during')
        dischezia = text_map.get('functional_dischezia')
        bowel_freq = text_map.get('functional_bowel_freq')
        
        s_g_before = str(g_before) if g_before and g_before != 'No' else ''
        s_g_during = str(g_during) if g_during and g_during != 'No' else ''
        s_dischezia = str(dischezia) if dischezia else 'No'
        s_bowel_freq = str(bowel_freq) if bowel_freq else 'N/A'

        symptoms_set = set()
        if s_g_before:
            if isinstance(g_before, list): symptoms_set.update(str(s).lower() for s in g_before)
            else: symptoms_set.update(s.strip().lower() for s in s_g_before.split(','))
            
        if s_g_during:
            if isinstance(g_during, list): symptoms_set.update(str(s).lower() for s in g_during)
            else: symptoms_set.update(s.strip().lower() for s in s_g_during.split(','))
        
        if symptoms_set or s_dischezia.lower() != 'no':
            gastro_summary = "A nivel gastrointestinal, manifiesta"
            if "dolor al evacuar" in symptoms_set:
                symptoms_set.remove("dolor al evacuar")
            
            symptoms_text = ", ".join(sorted(list(symptoms_set)))
            final_symptoms = ""
            if symptoms_text:
                final_symptoms = f" síntomas como {symptoms_text}"
                if s_dischezia.lower() != 'no':
                    final_symptoms += f" y dolor al evacuar (disquecia {s_dischezia.lower()})"
            elif s_dischezia.lower() != 'no':
                final_symptoms = f" dolor al evacuar (disquecia {s_dischezia.lower()})"
            
            gastro_summary += final_symptoms + "."
            
            if s_bowel_freq != 'N/A':
                gastro_summary += f" Su frecuencia evacuatoria es de {s_bowel_freq.lower()}."
            summary_parts.append(gastro_summary)
        else:
            if s_bowel_freq != 'N/A':
                 summary_parts.append(f"A nivel gastrointestinal, no refiere síntomas significativos, con una frecuencia evacuatoria {s_bowel_freq.lower()}.")

        # 4. Urinario
        u_prob = text_map.get('functional_urinary_problem')
        if u_prob and str(u_prob).lower() == 'sí':
            urinary_info = []
            u_pain = text_map.get('functional_urinary_pain')
            if u_pain and str(u_pain).lower() == 'sí':
                u_scale = text_map.get('functional_urinary_pain_scale')
                scale_text = f" ({u_scale}/10)" if u_scale else ""
                urinary_info.append(f"dolor al orinar{scale_text}")
            
            others = []
            if str(text_map.get('functional_urinary_irritation')).lower() == 'sí': others.append("irritación")
            if str(text_map.get('functional_urinary_incontinence')).lower() == 'sí': others.append("incontinencia")
            if str(text_map.get('functional_urinary_nocturia')).lower() == 'sí': others.append("nocturia")
            
            if others:
                urinary_info.append(" y ".join(others))
            
            if urinary_info:
                summary_parts.append(f"En el sistema urinario, confirma problemas, específicamente con {', '.join(urinary_info)}.")
            else:
                summary_parts.append("En el sistema urinario, confirma problemas no especificados.")
        elif u_prob and str(u_prob).lower() == 'no':
            summary_parts.append("Hábito miccional conservado.")

        return " ".join(summary_parts)

    @staticmethod
    def _process_lifestyle(text_map: Dict, data_map: Dict) -> str:
        """Process lifestyle factors using direct keys (non-heuristic)."""
        summary_parts = []
        
        # 1. Physical Activity
        activity = text_map.get('habits_physical_activity')
        if activity and str(activity).lower() == 'sí':
             summary_parts.append("La paciente refiere realizar actividad física de forma regular.")
        elif activity and str(activity).lower() == 'no':
             summary_parts.append("Niega realizar actividad física de forma regular.")

        # 2. Habits (Smoking, Alcohol, Substances)
        smoking = str(text_map.get('habits_smoking') or 'No').lower()
        alcohol = str(text_map.get('habits_alcohol') or 'No').lower()
        substances = str(text_map.get('habits_substance_use') or 'No').lower()

        habits_text = ""
        if smoking == 'no' and alcohol == 'no':
            habits_text = "Manifiesta no fumar y tampoco consume alcohol"
            if substances == 'no' or 'niega' in substances:
                habits_text += ", y niega el uso de otras sustancias."
            else:
                habits_text += f", y refiere uso de otras sustancias ({substances})."
        else:
            parts = []
            if smoking != 'no':
                parts.append(f"fuma ({smoking})")
            else:
                parts.append("no fuma")
                
            if alcohol != 'no':
                parts.append(f"consume alcohol ({alcohol})")
            else:
                parts.append("no consume alcohol")
                
            habits_text = "Refiere que " + " y ".join(parts)
            if substances != 'no' and 'niega' not in substances.lower():
                habits_text += f", y confirma uso de otras sustancias ({substances})."
            else:
                habits_text += ", y niega el uso de otras sustancias."

        summary_parts.append(habits_text)
        
        return " ".join(summary_parts)


    @staticmethod
    def _generate_full_narrative(general: str, medical: str, obstetric: str, 
                                functional: str, lifestyle: str) -> str:
        """Generate full HTML narrative from all sections."""
        sections = []
        
        if general:
            sections.append(f'<p><strong>General:</strong> {general}</p>')
        if medical:
            sections.append(f'<p><strong>Antecedentes Médicos:</strong> {medical}</p>')
        if obstetric:
            sections.append(f'<p><strong>Gineco-Obstetricia:</strong> {obstetric}</p>')
        if functional:
            sections.append(f'<p><strong>Examen Funcional:</strong> {functional}</p>')
        if lifestyle:
            sections.append(f'<p><strong>Estilo de Vida:</strong> {lifestyle}</p>')
        
        if not sections:
            return "<p>No hay información clínica disponible.</p>"
        
        return f"""
        <div style="font-family: sans-serif; line-height: 1.5;">
            {''.join(sections)}
        </div>
        """.strip()