"""
Generador de resúmenes clínicos a partir de datos estructurados de preconsulta.
Versión adaptada para leer ho_table_results y children.
"""

import json
import re
from datetime import datetime
from typing import Any, Dict, List, Optional

# -----------------------------------------------------------------------------
# Funciones auxiliares
# -----------------------------------------------------------------------------

def _to_roman(num: int) -> str:
    """Convierte un número a romanos (hasta 3999)."""
    if not isinstance(num, int) or not 0 < num < 4000:
        return str(num)
    val = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1]
    syb = ["M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"]
    roman = ''
    i = 0
    while num > 0:
        for _ in range(num // val[i]):
            roman += syb[i]
            num -= val[i]
        i += 1
    return roman


def _normalize_value(val: Any) -> str:
    """
    Convierte cualquier valor a string limpio.
    Si es lista, une con comas. Si es booleano, retorna "sí" o "no".
    """
    if val is None:
        return ""
    if isinstance(val, bool):
        return "sí" if val else "no"
    if isinstance(val, list):
        elementos = [str(v).strip() for v in val if v is not None and str(v).strip()]
        return ", ".join(elementos)
    return str(val).strip()


def _format_date_for_summary(date_str: Optional[str]) -> Optional[str]:
    """
    Convierte fecha YYYY-MM-DD a formato legible: "mes del año".
    Si no se puede, retorna el original o None.
    """
    if not date_str or str(date_str).lower() in ['nunca', 'no', 'n/a', 'no recuerdo']:
        return None
    try:
        meses = {
            '01': 'enero', '02': 'febrero', '03': 'marzo', '04': 'abril',
            '05': 'mayo', '06': 'junio', '07': 'julio', '08': 'agosto',
            '09': 'septiembre', '10': 'octubre', '11': 'noviembre', '12': 'diciembre'
        }
        if len(date_str) >= 7:
            year, month = date_str[:4], date_str[5:7]
            mes_nombre = meses.get(month, '')
            if mes_nombre:
                return f"{mes_nombre} del {year}"
        return date_str
    except Exception:
        return date_str


def _es_si(valor: Any) -> bool:
    """Determina si un valor representa 'sí'."""
    if valor is None:
        return False
    if isinstance(valor, bool):
        return valor is True
    return str(valor).lower() in ['sí', 'si', 'true', '1']


def _to_int(valor: Any) -> int:
    """Convierte a entero de forma segura."""
    try:
        return int(valor)
    except (TypeError, ValueError):
        return 0


# -----------------------------------------------------------------------------
# Generador principal
# -----------------------------------------------------------------------------

class GeneradorResumenes:
    """Genera resúmenes clínicos a partir de un diccionario de datos."""

    def __init__(self, datos: Dict[str, Any]):
        self.d = datos
        # Extraer ho_table_results si existe
        self.ho = datos.get('ho_table_results', {})
        if isinstance(self.ho, str):
            try:
                self.ho = json.loads(self.ho)
            except:
                self.ho = {}

    # -------------------------------------------------------------------------
    # Resumen general
    # -------------------------------------------------------------------------
    def generar_general(self, nombre_paciente: str = "Paciente") -> str:
        """Construye la línea inicial con nombre, edad, ocupación, localidad."""
        partes = []
        partes.append(nombre_paciente.upper())

        edad = self.d.get('age') or self.d.get('edad')
        if edad:
            partes.append(f"{edad} años")

        ocupacion = self.d.get('occupation') or self.d.get('ocupacion')
        if ocupacion:
            partes.append(ocupacion)

        localidad = self.d.get('address') or self.d.get('localidad')
        if localidad:
            partes.append(f"residencia en {localidad}")

        return ", ".join(partes) + "."

    # -------------------------------------------------------------------------
    # Antecedentes médicos
    # -------------------------------------------------------------------------
    def generar_antecedentes(self) -> str:
        """Resume antecedentes personales, familiares, quirúrgicos, suplementos."""
        secciones = []

        if self.d.get('personal_history_bool'):
            hist = self.d.get('personal_history', [])
            if hist:
                secciones.append(f"antecedentes de {_normalize_value(hist)}")
            else:
                secciones.append("con antecedentes personales")
        else:
            secciones.append("sin antecedentes personales")

        if self.d.get('family_history_mother_bool'):
            hist_m = self.d.get('family_history_mother', [])
            if hist_m:
                secciones.append(f"antecedentes maternos de {_normalize_value(hist_m)}")

        if self.d.get('family_history_father_bool'):
            hist_p = self.d.get('family_history_father', [])
            if hist_p:
                secciones.append(f"antecedentes paternos de {_normalize_value(hist_p)}")

        if self.d.get('surgical_history_bool'):
            secciones.append("cirugías previas")

        if self.d.get('supplements_bool'):
            supl = self.d.get('supplements')
            if supl:
                secciones.append(f"toma {_normalize_value(supl)}")

        if not secciones:
            return "sin antecedentes médicos de interés."

        if len(secciones) == 1 and secciones[0].startswith("sin "):
            return secciones[0] + "."

        return "con " + ", ".join(secciones) + "."

    # -------------------------------------------------------------------------
    # Historia gineco-obstétrica
    # -------------------------------------------------------------------------
    def generar_gineco(self) -> str:
        """Resume historia ginecológica y obstétrica."""
        partes = []

        # --- Obtener valores de ho_table_results o de la raíz ---
        g = _to_int(self.ho.get('gestas')) or _to_int(self.d.get('gestas'))
        p = _to_int(self.ho.get('partos')) or _to_int(self.d.get('partos'))
        c = _to_int(self.ho.get('cesareas')) or _to_int(self.d.get('cesareas'))
        a = _to_int(self.ho.get('abortos')) or _to_int(self.d.get('abortos'))
        e = _to_int(self.ho.get('ectopicos')) or _to_int(self.d.get('ectopicos'))
        m = _to_int(self.ho.get('molares')) or _to_int(self.d.get('molares'))

        # Si no hay gestas pero sí partos/cesáreas, asumir suma
        if g == 0 and (p > 0 or c > 0):
            g = p + c + a

        # --- Construir fórmula en romanos ---
        if g == 0 and p == 0 and c == 0 and a == 0:
            # Usar obstetric_history_type si existe
            tipo = self.d.get('obstetric_history_type', '')
            if tipo:
                partes.append(f"Paciente {tipo.lower()}.")
            else:
                partes.append("Nuligesta.")
        else:
            romanos = []
            if g > 0:
                romanos.append(f"{_to_roman(g)}G")
            if p > 0:
                romanos.append(f"{_to_roman(p)}P")
            if c > 0:
                romanos.append(f"{_to_roman(c)}C")
            if a > 0:
                romanos.append(f"{_to_roman(a)}A")
            if e > 0:
                romanos.append(f"{_to_roman(e)}E")
            if m > 0:
                romanos.append(f"{_to_roman(m)}M")
            partes.append(f"Paciente con {' '.join(romanos)}.")

        # --- Detalles de nacimientos (children) ---
        children = self.ho.get('children', [])
        if children and isinstance(children, list):
            birth_parts = []
            for child in children:
                year = child.get('year', 'N/A')
                weight = child.get('weight', 'N/A')
                height = child.get('height', 'N/A')
                comp = child.get('complications', 'Sin complicaciones')
                prefix = "con " if comp and comp.lower() != 'sin complicaciones' else ""
                birth_parts.append(f"{year} {weight}kg / {height}cm, que cursó {prefix}{comp}")
            if birth_parts:
                partes.append("Detalles de nacimientos: " + "; ".join(birth_parts) + ".")

        # --- Menarquia y sexarquia ---
        men = self.d.get('gyn_menarche')
        sex = self.d.get('gyn_sexarche')
        if men:
            texto_men = f"Menarquía a los {men} años"
            if sex:
                texto_sex = f"sexarquía a los {sex}" if str(sex).lower() not in ['niega', 'no', 'nunca'] else "sexarquía niega"
                partes.append(f"{texto_men} y {texto_sex}.")
            else:
                partes.append(f"{texto_men}.")
        elif sex:
            texto_sex = f"Sexarquía a los {sex}" if str(sex).lower() not in ['niega', 'no', 'nunca'] else "Sexarquía niega"
            partes.append(f"{texto_sex}.")

        # --- Ciclos y dismenorrea ---
        ciclos = self.d.get('gyn_cycles', 'Regulares')
        if 'irregulares' in str(ciclos).lower():
            ciclo_desc = "ciclos menstruales irregulares"
        else:
            ciclo_desc = "ciclos menstruales regulares"

        dism = self.d.get('gyn_dysmenorrhea')
        escala_dism = self.d.get('gyn_dysmenorrhea_scale_value')
        if dism and str(dism).lower() not in ['no', 'niega']:
            if escala_dism:
                ciclo_desc += f", asociados a dismenorrea de intensidad {escala_dism}/10"
            else:
                ciclo_desc += ", asociados a dismenorrea"
        else:
            ciclo_desc += ", sin dismenorrea"

        partes.append(f"Refiere {ciclo_desc}.")

        # --- FUR ---
        fur = self.d.get('gyn_fum')
        if fur:
            partes.append(f"Su FUM fue el {fur}.")

        # --- Método anticonceptivo ---
        if self.d.get('gyn_mac_bool'):
            metodos = self.d.get('gyn_mac', [])
            if metodos:
                partes.append(f"Utiliza como método anticonceptivo: {_normalize_value(metodos).lower()}.")

        # --- Actividad sexual y deseo de fertilidad ---
        activa = self.d.get('sexually_active')
        if activa and str(activa).lower() in ['sí', 'si', 'true']:
            fert = self.d.get('gyn_fertility_intent', '')
            if 'no tiene' in fert.lower():
                texto_fert = "sin deseo de fertilidad"
            elif fert:
                texto_fert = f"con {fert.lower()}"
            else:
                texto_fert = "sin deseo de fertilidad especificado"
            partes.append(f"Mantiene actividad sexual activa {texto_fert}.")
        else:
            partes.append("No mantiene actividad sexual actualmente.")

        # --- Últimos controles ---
        def form_fecha(val):
            if val and str(val).lower() not in ['nunca', 'no recuerdo']:
                return _format_date_for_summary(str(val))
            return None

        f_gine = form_fecha(self.d.get('gyn_previous_checkups'))
        f_pap = form_fecha(self.d.get('gyn_last_pap_smear'))

        if f_gine and f_pap and f_gine == f_pap:
            partes.append(f"Su último control ginecológico y citología fueron en {f_gine}.")
        else:
            if f_gine:
                partes.append(f"Su último control ginecológico fue en {f_gine}.")
            if f_pap:
                partes.append(f"Su última citología fue realizada en {f_pap}.")

        return " ".join(partes)

    # -------------------------------------------------------------------------
    # Examen funcional (mejorado)
    # -------------------------------------------------------------------------
    def generar_funcional(self) -> Optional[str]:
        """Resume el examen funcional. Retorna None si no hay datos."""
        claves_funcionales = [
            'functional_dispareunia', 'functional_leg_pain', 'functional_gastro_before',
            'functional_gastro_during', 'functional_dischezia', 'functional_bowel_freq',
            'functional_urinary_problem', 'functional_urinary_pain'
        ]
        if not any(self.d.get(k) for k in claves_funcionales):
            return None

        partes = []

        # 1. Dispareunia
        if _es_si(self.d.get('functional_dispareunia')):
            tipo = self.d.get('functional_dispareunia_type')
            escala = self.d.get('functional_dispareunia_deep_scale')
            tipo_str = _normalize_value(tipo)
            if escala:
                try:
                    intensidad = int(escala)
                    if intensidad >= 7:
                        desc = "de alta intensidad"
                    elif intensidad >= 4:
                        desc = "de moderada intensidad"
                    else:
                        desc = "de leve intensidad"
                    if tipo_str:
                        partes.append(f"La paciente refiere dispareunia de tipo {tipo_str.lower()} {desc} ({intensidad}/10).")
                    else:
                        partes.append(f"La paciente refiere dispareunia {desc} ({intensidad}/10).")
                except:
                    if tipo_str:
                        partes.append(f"La paciente refiere dispareunia de tipo {tipo_str.lower()}.")
                    else:
                        partes.append("La paciente refiere dispareunia.")
            else:
                if tipo_str:
                    partes.append(f"La paciente refiere dispareunia de tipo {tipo_str.lower()}.")
                else:
                    partes.append("La paciente refiere dispareunia.")
        else:
            partes.append("Niega dispareunia.")

        # 2. Dolor piernas
        if _es_si(self.d.get('functional_leg_pain')):
            tipo = self.d.get('functional_leg_pain_type')
            zona = self.d.get('functional_leg_pain_zone')
            tipo_str = _normalize_value(tipo)
            zona_str = _normalize_value(zona)
            if tipo_str and zona_str:
                partes.append(f"Presenta dolor en miembros inferiores, descrito como '{tipo_str.lower()}' en {zona_str.lower()}.")
            else:
                partes.append("Refiere dolor en miembros inferiores no especificado.")
        else:
            partes.append("Niega dolor en miembros inferiores durante la menstruación.")

        # 3. Gastrointestinal
        gastro_before = self.d.get('functional_gastro_before', [])
        gastro_during = self.d.get('functional_gastro_during', [])
        dischezia = self.d.get('functional_dischezia')
        bowel_freq = self.d.get('functional_bowel_freq', 'N/A')

        sintomas = set()
        for item in gastro_before if isinstance(gastro_before, list) else [gastro_before]:
            if item and str(item).lower() != 'no':
                sintomas.add(str(item).strip().lower())
        for item in gastro_during if isinstance(gastro_during, list) else [gastro_during]:
            if item and str(item).lower() != 'no':
                sintomas.add(str(item).strip().lower())

        tiene_dischezia = dischezia and str(dischezia).lower() not in ['no', 'false']

        if sintomas or tiene_dischezia:
            gastro_text = "A nivel gastrointestinal, manifiesta"
            if "dolor al evacuar" in sintomas:
                sintomas.remove("dolor al evacuar")
            lista_sint = sorted(sintomas)
            if lista_sint and tiene_dischezia:
                gastro_text += f" síntomas como {', '.join(lista_sint)} y dolor al evacuar (disquecia {_normalize_value(dischezia).lower()})"
            elif lista_sint:
                gastro_text += f" síntomas como {', '.join(lista_sint)}"
            elif tiene_dischezia:
                gastro_text += f" dolor al evacuar (disquecia {_normalize_value(dischezia).lower()})"
            gastro_text += "."

            if bowel_freq and bowel_freq != 'N/A':
                if not lista_sint and tiene_dischezia and 'eventual' in str(dischezia).lower():
                    gastro_text += f" Su frecuencia evacuatoria {_normalize_value(bowel_freq).lower()}."
                else:
                    gastro_text += f" Su frecuencia evacuatoria es de {_normalize_value(bowel_freq).lower()}."
            partes.append(gastro_text)
        else:
            if bowel_freq and bowel_freq != 'N/A':
                partes.append(f"A nivel gastrointestinal, no refiere síntomas significativos, con una frecuencia evacuatoria {_normalize_value(bowel_freq).lower()}.")

        # 4. Urinario
        if _es_si(self.d.get('functional_urinary_problem')):
            urinario_parts = []
            if _es_si(self.d.get('functional_urinary_pain')):
                escala = self.d.get('functional_urinary_pain_scale')
                if escala:
                    try:
                        intensidad = int(escala)
                        if intensidad >= 7:
                            desc = "muy alta"
                        elif intensidad >= 4:
                            desc = "moderada"
                        else:
                            desc = "leve"
                        urinario_parts.append(f"dolor al orinar de intensidad {desc} ({intensidad}/10)")
                    except:
                        urinario_parts.append("dolor al orinar")
                else:
                    urinario_parts.append("dolor al orinar")

            otros = []
            if _es_si(self.d.get('functional_urinary_irritation')):
                otros.append("irritación")
            if _es_si(self.d.get('functional_urinary_incontinence')):
                otros.append("incontinencia")
            if _es_si(self.d.get('functional_urinary_nocturia')):
                otros.append("nocturia")
            if otros:
                urinario_parts.append("acompañado de " + " y ".join(otros))

            if urinario_parts:
                partes.append("En el sistema urinario, confirma problemas, con " + ", ".join(urinario_parts) + ".")
            else:
                partes.append("En el sistema urinario, confirma problemas no especificados.")
        else:
            partes.append("Hábito miccional conservado.")

        return " ".join(partes)

    # -------------------------------------------------------------------------
    # Estilo de vida
    # -------------------------------------------------------------------------
    def generar_estilo_vida(self) -> str:
        """Resume actividad física y hábitos."""
        partes = []

        # 1. Actividad física
        if _es_si(self.d.get('habits_physical_activity')):
            partes.append("Realiza actividad física de forma regular.")
        else:
            partes.append("Niega realizar actividad física de forma regular.")

        fuma = _normalize_value(self.d.get('habits_smoking', 'no')).lower()
        alcohol = _normalize_value(self.d.get('habits_alcohol', 'no')).lower()
        sustancias = _normalize_value(self.d.get('habits_substance_use', 'no')).lower()

        habitos_lista = []
        
        # 2. Fumar
        if _es_si(fuma):
            habitos_lista.append("es fumadora")
        else:
            habitos_lista.append("no es fumadora")
            
        # 3. Alcohol
        if alcohol == 'ocasional' or alcohol == 'ocasionalmente':
            habitos_lista.append("consume alcohol ocasionalmente")
        elif _es_si(alcohol):
            habitos_lista.append("consume bebidas alcohólicas")
        else:
            habitos_lista.append("no consume bebidas alcohólicas")
            
        # 4. Sustancias
        if _es_si(sustancias):
            habitos_lista.append("refiere uso de otras sustancias")
        else:
            habitos_lista.append("niega uso de otras sustancias")

        texto_habitos = "En cuanto a hábitos: " + ", ".join(habitos_lista) + "."
        partes.append(texto_habitos)
        
        return " ".join(partes)

    # -------------------------------------------------------------------------
    # Método principal: genera todas las secciones
    # -------------------------------------------------------------------------
    def generar_todo(self, nombre_paciente: str = "Paciente") -> Dict[str, str]:
        """Retorna un diccionario con todas las secciones del resumen."""
        return {
            "general": self.generar_general(nombre_paciente),
            "antecedentes": self.generar_antecedentes().capitalize(),
            "gineco": self.generar_gineco(),
            "funcional": self.generar_funcional() or "",
            "estilo_vida": self.generar_estilo_vida().capitalize()
        }


