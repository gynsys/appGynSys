"""
Generador de resúmenes clínicos a partir de datos estructurados de preconsulta.
Versión simplificada y enfocada en el formato JSON actual.
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
        # Filtra elementos vacíos y une
        elementos = [str(v).strip() for v in val if v is not None and str(v).strip()]
        return ", ".join(elementos)
    return str(val).strip()


def _format_date_for_summary(date_str: Optional[str]) -> Optional[str]:
    """
    Convierte fecha YYYY-MM-DD a formato legible: "mes del año".
    Si no se puede, retorna el original o None.
    """
    if not date_str or str(date_str).lower() in ['nunca', 'no', 'n/a']:
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


# -----------------------------------------------------------------------------
# Generador principal
# -----------------------------------------------------------------------------

class ResumenClinico:
    """Genera resúmenes clínicos a partir de un diccionario de datos."""

    def __init__(self, datos: Dict[str, Any]):
        self.d = datos  # acceso directo a los datos

    # -------------------------------------------------------------------------
    # Resumen general
    # -------------------------------------------------------------------------
    def generar_general(self, nombre_paciente: str = "Paciente") -> str:
        """Construye la línea inicial con nombre, edad, ocupación, localidad."""
        partes = []
        # Nombre (en mayúsculas)
        partes.append(nombre_paciente.upper())

        # Edad (si está presente como campo separado o calculada desde fecha nacimiento)
        edad = self.d.get('age') or self.d.get('edad')
        if edad:
            partes.append(f"{edad} años")

        # Ocupación
        ocupacion = self.d.get('occupation') or self.d.get('ocupacion')
        if ocupacion:
            partes.append(ocupacion)

        # Localidad
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

        # Personales
        if self.d.get('personal_history_bool'):
            hist = self.d.get('personal_history', [])
            if hist:
                secciones.append(f"antecedentes de {_normalize_value(hist)}")
            else:
                secciones.append("con antecedentes personales")
        else:
            secciones.append("sin antecedentes personales")

        # Familiares maternos
        if self.d.get('family_history_mother_bool'):
            hist_m = self.d.get('family_history_mother', [])
            if hist_m:
                secciones.append(f"antecedentes maternos de {_normalize_value(hist_m)}")

        # Familiares paternos
        if self.d.get('family_history_father_bool'):
            hist_p = self.d.get('family_history_father', [])
            if hist_p:
                secciones.append(f"antecedentes paternos de {_normalize_value(hist_p)}")

        # Cirugías
        if self.d.get('surgical_history_bool'):
            secciones.append("cirugías previas")

        # Suplementos
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

        # --- Fórmula obstétrica (GPA) ---
        # Intentar obtener gestas, partos, cesáreas, abortos
        g = self._to_int(self.d.get('gestas'))
        p = self._to_int(self.d.get('partos'))
        c = self._to_int(self.d.get('cesareas'))
        a = self._to_int(self.d.get('abortos'))
        e = self._to_int(self.d.get('ectopicos'))
        m = self._to_int(self.d.get('molares'))

        # Si no hay gestas pero sí partos/cesáreas, asumir que gestas es la suma
        if g == 0 and (p > 0 or c > 0):
            g = p + c + a

        # Construir fórmula en romanos
        if g == 0 and p == 0 and c == 0 and a == 0:
            # Verificar si es nuligesta por el campo obstetric_history_type
            if self.d.get('obstetric_history_type') == 'Nuligesta':
                partes.append("Paciente nuligesta.")
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
        mac = self.d.get('gyn_mac_bool')
        if mac:
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
        ult_gine = self.d.get('gyn_previous_checkups')
        ult_pap = self.d.get('gyn_last_pap_smear')

        def form_fecha(val):
            if val and str(val).lower() not in ['nunca', 'no recuerdo']:
                return _format_date_for_summary(str(val))
            return None

        f_gine = form_fecha(ult_gine)
        f_pap = form_fecha(ult_pap)

        if f_gine and f_pap and f_gine == f_pap:
            partes.append(f"Su último control ginecológico y citología fueron en {f_gine}.")
        else:
            if f_gine:
                partes.append(f"Su último control ginecológico fue en {f_gine}.")
            if f_pap:
                partes.append(f"Su última citología fue realizada en {f_pap}.")

        return " ".join(partes)

    def _to_int(self, val) -> int:
        try:
            return int(val)
        except (TypeError, ValueError):
            return 0

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
        if self._es_si(self.d.get('functional_dispareunia')):
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
        if self._es_si(self.d.get('functional_leg_pain')):
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
                # Si solo hay disquecia eventual sin otros síntomas, omitir "de"
                if not lista_sint and tiene_dischezia and 'eventual' in str(dischezia).lower():
                    gastro_text += f" Su frecuencia evacuatoria {_normalize_value(bowel_freq).lower()}."
                else:
                    gastro_text += f" Su frecuencia evacuatoria es de {_normalize_value(bowel_freq).lower()}."
            partes.append(gastro_text)
        else:
            if bowel_freq and bowel_freq != 'N/A':
                partes.append(f"A nivel gastrointestinal, no refiere síntomas significativos, con una frecuencia evacuatoria {_normalize_value(bowel_freq).lower()}.")

        # 4. Urinario
        if self._es_si(self.d.get('functional_urinary_problem')):
            urinario_parts = []
            if self._es_si(self.d.get('functional_urinary_pain')):
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
            if self._es_si(self.d.get('functional_urinary_irritation')):
                otros.append("irritación")
            if self._es_si(self.d.get('functional_urinary_incontinence')):
                otros.append("incontinencia")
            if self._es_si(self.d.get('functional_urinary_nocturia')):
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

    def _es_si(self, valor) -> bool:
        """Determina si un valor representa 'sí'."""
        if valor is None:
            return False
        if isinstance(valor, bool):
            return valor is True
        return str(valor).lower() in ['sí', 'si', 'true', '1']

    # -------------------------------------------------------------------------
    # Estilo de vida
    # -------------------------------------------------------------------------
    def generar_estilo_vida(self) -> str:
        """Resume actividad física y hábitos."""
        partes = []

        # Actividad física
        if self._es_si(self.d.get('habits_physical_activity')):
            partes.append("La paciente refiere realizar actividad física de forma regular.")
        else:
            partes.append("Niega realizar actividad física de forma regular.")

        # Hábitos: tabaco, alcohol, sustancias
        fuma = _normalize_value(self.d.get('habits_smoking', 'no'))
        alcohol = _normalize_value(self.d.get('habits_alcohol', 'no'))
        sustancias = _normalize_value(self.d.get('habits_substance_use', 'no'))

        if fuma == 'no' and alcohol == 'no':
            texto = "Manifiesta no fumar y tampoco consume alcohol"
            if sustancias == 'no':
                texto += ", y niega el uso de otras sustancias."
            else:
                texto += f", y refiere uso de otras sustancias ({sustancias})."
        else:
            lista = []
            lista.append("no fuma" if fuma == 'no' else f"fuma ({fuma})")
            if alcohol == 'no':
                lista.append("no consume alcohol")
            elif alcohol == 'ocasional':
                lista.append("consume alcohol ocasionalmente")
            else:
                lista.append(f"consume alcohol ({alcohol})")
            if sustancias == 'no':
                lista.append("niega el uso de otras sustancias")
            else:
                lista.append(f"refiere uso de otras sustancias ({sustancias})")
            texto = "En cuanto a hábitos: " + ", ".join(lista) + "."

        partes.append(texto)
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
            "funcional": self.generar_funcional() or "",  # puede ser None
            "estilo_vida": self.generar_estilo_vida().capitalize()
        }


# -----------------------------------------------------------------------------
# Ejemplo de uso con los datos de Ana
# -----------------------------------------------------------------------------
if __name__ == "__main__":
    # Datos de la paciente (tal como vienen de la BD)
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

    generador = ResumenClinico(ana_data)
    resumenes = generador.generar_todo(nombre_paciente=ana_data.get("full_name", "Paciente"))

    print("=" * 60)
    print("RESUMEN CLÍNICO GENERADO")
    print("=" * 60)
    for seccion, texto in resumenes.items():
        if texto:
            print(f"\n[{seccion.upper()}]")
            print(texto)