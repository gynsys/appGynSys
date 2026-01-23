
export const toRoman = (num) => {
    if (typeof num !== 'number' || num < 1) return '';
    const val = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
    const syb = ["M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"];
    let roman_num = '';
    let i = 0;
    while (num > 0) {
        while (num >= val[i]) {
            roman_num += syb[i];
            num -= val[i];
        }
        i++;
    }
    return roman_num;
};

export const formatObstetricHistory = (data) => {
    let g = 0, p = 0, a = 0, c = 0;
    let hoFormula = data.gyn_ho || '';
    let usedTable = false;

    // 1. Prefer existing summary string if available (Fix for Recurrent Patients)
    if (data.obstetric_history_summary) return data.obstetric_history_summary;
    if (data.summary_gyn_obstetric) return data.summary_gyn_obstetric;

    if (data.ho_table_results) {
        let ho = data.ho_table_results;
        // Safety check: if it's a string, parse it
        if (typeof ho === 'string') {
            try { ho = JSON.parse(ho); } catch (e) { ho = {}; }
        }

        // Check for lowercase OR capitalized keys to be safe
        g = parseInt(ho.gestas || ho.Gestas) || 0;
        p = parseInt(ho.partos || ho.Partos) || 0;
        c = parseInt(ho.cesareas || ho.Cesareas) || 0;
        a = parseInt(ho.abortos || ho.Abortos) || 0;
        usedTable = true;
    } else {
        if (hoFormula.toLowerCase().includes('nuligesta')) return "Paciente Nuligesta";
        if (hoFormula.toLowerCase().includes('primigesta')) return "Paciente Primigesta";

        // Extract G P A C
        const getVal = (regex) => {
            const match = hoFormula.match(regex);
            return match ? parseInt(match[1]) : 0;
        };

        g = getVal(/G(\d+)/);
        p = getVal(/P(\d+)/);
        a = getVal(/A(\d+)/);
        c = getVal(/C(\d+)/);
    }

    if (g === 0 && p === 0 && a === 0 && c === 0) {
        if (!usedTable && hoFormula && hoFormula !== "No registrado") return hoFormula;
        return "Paciente Nuligesta";
    }

    let parts = [];
    if (g > 0) parts.push(`${toRoman(g)}G`);
    if (p > 0) parts.push(`${toRoman(p)}P`);
    if (c > 0) parts.push(`${toRoman(c)}C`);
    if (a > 0) parts.push(`${toRoman(a)}A`);

    let gpaStr = parts.join(' ');

    // Add Prefix (Multigesta/Primigesta)
    let prefix = "";
    if (g === 1) prefix = "Paciente Primigesta. ";
    else if (g > 1) prefix = "Paciente Multigesta. ";

    let result = prefix + gpaStr;

    // Birth details
    let birthList = [];
    try {
        if (data.birth_details) {
            if (typeof data.birth_details === 'string') {
                birthList = JSON.parse(data.birth_details);
            } else if (Array.isArray(data.birth_details)) {
                birthList = data.birth_details;
            }
        } else if (data.ho_table_results && Array.isArray(data.ho_table_results.children)) {
            // Fallback to checking children inside ho_table_results
            birthList = data.ho_table_results.children;
        }
    } catch (e) { }

    if (birthList.length > 0) {
        const details = birthList.map(birth => {
            const year = birth.year || birth.birth_year || 'N/A';
            const weight = birth.weight || 'N/A';
            const height = birth.height || 'N/A';
            const complications = birth.complications || 'Sin complicaciones';
            const compText = complications === 'Sin complicaciones' ? ', sin complicaciones' : `, que cursó con ${complications}`;
            return `${year} ${weight}kg / ${height}cm${compText}`;
        }).join('; ');
        result += ` -> ${details}`;
    }

    return result;
};

export const formatFullGynObstetricSummary = (data) => {
    // 0. If Backend already generated the full summary, return it directly.
    // This prevents double-generation or appending redundant info.
    if (data.obstetric_history_summary && data.obstetric_history_summary.length > 20) {
        return data.obstetric_history_summary;
    }
    if (data.summary_gyn_obstetric && data.summary_gyn_obstetric.length > 20) {
        return data.summary_gyn_obstetric;
    }

    let parts = [];

    // 1. Obstetric History
    const hoText = formatObstetricHistory(data);
    if (hoText) {
        parts.push(hoText.endsWith('.') ? hoText : `${hoText}.`);
    }

    // 2. Menarche & Sexarche
    const menarche = data.gyn_menarche;
    const sexarche = data.gyn_sexarche;
    let menarcheText = menarche ? `Menarquía a los ${menarche} años` : "";
    let sexarcheText = "";

    if (sexarche) {
        if (String(sexarche).toLowerCase().includes('nunca')) {
            sexarcheText = "Sexarquía: niega";
        } else {
            sexarcheText = `sexarquía a los ${sexarche}`;
        }
    }

    if (menarcheText && sexarcheText) {
        parts.push(`${menarcheText} y ${sexarcheText}.`);
    } else if (menarcheText) {
        parts.push(`${menarcheText}.`);
    } else if (sexarcheText) {
        parts.push(`${sexarcheText.charAt(0).toUpperCase() + sexarcheText.slice(1)}.`);
    }

    // 3. Cycles & Dysmenorrhea
    const cycles = data.gyn_cycles || 'Regulares';
    const dysmenorrhea = data.gyn_dysmenorrhea || 'No';
    let cycleText = "ciclos menstruales regulares";

    if (String(cycles).toLowerCase().includes('irregulares')) {
        const match = String(cycles).match(/Duración: ([\w\s]+)\. Frecuencia: ([\w\s]+)\./);
        if (match) {
            cycleText = `ciclos menstruales irregulares con duración de ${match[1].trim()} y frecuencia de ${match[2].trim()}`;
        } else {
            cycleText = "ciclos menstruales irregulares";
        }
    }

    if (String(dysmenorrhea).toLowerCase() !== 'no' && String(dysmenorrhea).toLowerCase() !== 'niega') {
        const intensity = data.gyn_dysmenorrhea_scale_value;
        if (intensity) {
            cycleText += `, asociados a dismenorrea de intensidad ${intensity}/10`;
        } else {
            // Fallback: check if it was embedded in string (old format)
            const match = String(dysmenorrhea).match(/intensidad: (\d+)\/10/i);
            const embeddedIntensity = match ? match[1] : null;
            if (embeddedIntensity) {
                cycleText += `, asociados a dismenorrea de intensidad ${embeddedIntensity}/10`;
            } else {
                cycleText += `, asociados a dismenorrea`;
            }
        }
    } else {
        cycleText += ", sin dismenorrea";
    }
    parts.push(`Refiere ${cycleText}.`);

    // 4. FUM
    if (data.gyn_fum) {
        parts.push(`Su FUM fue el ${data.gyn_fum}.`);
    }

    // 5. MAC
    const mac = data.gyn_mac;
    if (mac && String(mac).toLowerCase() !== 'no') {
        parts.push(`Utiliza como método anticonceptivo: ${String(mac).toLowerCase()}.`);
    }

    // 6. Sexual Activity & Fertility
    const sexuallyActive = data.sexually_active;
    const fertilityIntent = data.gyn_fertility_intent;

    if (sexuallyActive && (sexuallyActive === true || String(sexuallyActive).toLowerCase() === 'sí' || String(sexuallyActive).toLowerCase() === 'si')) {
        let fertilityText = "sin deseo de fertilidad";
        if (fertilityIntent) {
            const intent = String(fertilityIntent).toLowerCase();
            if (intent.includes('más de un año')) {
                fertilityText = "con deseo de fertilidad (>1 año)";
            } else if (intent.includes('no tiene')) {
                fertilityText = "sin deseo de fertilidad";
            } else if (intent.includes('prefiere no')) {
                // If prefers not to say, maybe omit or say explicitly? 
                // "Mantiene actividad sexual activa (no especifica deseo de fertilidad)."
                fertilityText = "(no especifica deseo de fertilidad)";
            } else {
                // Catch-all
                fertilityText = `con ${intent}`;
            }
        }
        parts.push(`Mantiene actividad sexual activa ${fertilityText}.`);
    } else if (sexuallyActive === false || (sexuallyActive && String(sexuallyActive).toLowerCase() === 'no')) {
        parts.push("No mantiene actividad sexual actualmente.");
    }

    // 7. Checkups
    const prevCheckup = data.gyn_previous_checkups;
    const lastPap = data.gyn_last_pap_smear;

    const formatDate = (val) => {
        if (!val) return null;
        const dateStr = String(val);
        if (['nunca', 'no', 'n/a'].includes(dateStr.toLowerCase())) return null;

        // Simple check if it looks like YYYY-MM-DD
        if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [y, m, d] = dateStr.split('-');
            const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
            return `${months[parseInt(m) - 1]} del ${y}`;
        }
        if (dateStr.toLowerCase().includes('recuerdo')) return 'fecha no recordada';
        return dateStr;
    };

    const prevCheckupFmt = formatDate(prevCheckup);
    const lastPapFmt = formatDate(lastPap);

    if (prevCheckup && lastPap && prevCheckup === lastPap && String(prevCheckup).toLowerCase() !== 'nunca') {
        parts.push(`Su último control ginecológico y citología fueron en ${prevCheckupFmt}.`);
    } else {
        if (prevCheckup && String(prevCheckup).toLowerCase() !== 'nunca') {
            parts.push(`Su último control ginecológico fue en ${prevCheckupFmt}.`);
        }
        if (lastPap && String(lastPap).toLowerCase() !== 'nunca') {
            parts.push(`Su última citología fue realizada en ${lastPapFmt}.`);
        }
    }

    return parts.join(' ');
};

export const formatPhysicalExamSummary = (data) => {
    // Helper to filter "Normal/Sano" if pathologies exist, and lowercase items
    const processList = (items, normalTerms = ['normal', 'normales', 'sano', 'sin hallazgos', 'sin particularidades']) => {
        if (!Array.isArray(items) || items.length === 0) return [];
        const lowerItems = items.map(i => i.toLowerCase());
        const pathologies = lowerItems.filter(i => !normalTerms.includes(i));
        return pathologies.length > 0 ? pathologies : lowerItems; // usage: list.join(', ')
    };

    const formatRadials = (locs) => {
        if (!Array.isArray(locs) || locs.length === 0) return '';

        const radios = [];
        const others = [];

        locs.forEach(loc => {
            const val = parseInt(loc.replace('Radio ', ''), 10);
            if (!isNaN(val) && val >= 1 && val <= 12) {
                radios.push(val);
            } else {
                others.push(loc);
            }
        });

        radios.sort((a, b) => a - b);

        let radioText = '';
        if (radios.length === 1) {
            radioText = `radial ${radios[0]}`;
        } else if (radios.length > 1) {
            const last = radios.pop();
            radioText = `radiales ${radios.join(', ')} y ${last}`;
        }

        const parts = [];
        if (radioText) parts.push(radioText);
        if (others.length > 0) parts.push(others.join(', '));

        return parts.join(' y ');
    };

    let parts = [];

    // General
    if (data.condiciones_generales) parts.push(`Paciente en condiciones generales ${data.condiciones_generales.toLowerCase()}.`);

    // Antropometría
    let antro = [];
    if (data.peso_kg) antro.push(`peso ${data.peso_kg}kg`);
    if (data.altura_m) antro.push(`talla ${data.altura_m}m`);
    if (data.imc_calculado) antro.push(`IMC ${data.imc_calculado}`);
    if (antro.length > 0) parts.push(`Antropometría: ${antro.join(', ')}.`);

    // Mamas
    const mamas = [];
    // Derecha
    let md = [];
    if (data.mama_derecha_simetria) md.push(data.mama_derecha_simetria.toLowerCase());
    if (data.mama_derecha_areola) md.push(`areola ${data.mama_derecha_areola.toLowerCase()}`);
    if (data.mama_derecha_nodulos === 'Con Presencia') {
        let locs = data.mama_derecha_nodulos_radiales || [];
        const formatted = formatRadials(locs);
        if (formatted) md.push(`nódulos palpables en ${formatted}`);
        else md.push(`nódulos palpables`);
    } else if (data.mama_derecha_nodulos) {
        md.push(data.mama_derecha_nodulos.toLowerCase());
    }
    if (data.mama_derecha_secrecion) md.push("con secreción");
    if (md.length > 0) mamas.push(`Mama derecha: ${processList(md).join(', ')}`);

    // Izquierda
    let mi = [];
    if (data.mama_izquierda_simetria) mi.push(data.mama_izquierda_simetria.toLowerCase());
    if (data.mama_izquierda_areola) mi.push(`areola ${data.mama_izquierda_areola.toLowerCase()}`);
    if (data.mama_izquierda_nodulos === 'Con Presencia') {
        let locs = data.mama_izquierda_nodulos_radiales || [];
        const formatted = formatRadials(locs);
        if (formatted) mi.push(`nódulos palpables en ${formatted}`);
        else mi.push(`nódulos palpables`);
    } else if (data.mama_izquierda_nodulos) {
        mi.push(data.mama_izquierda_nodulos.toLowerCase());
    }
    if (data.mama_izquierda_secrecion) mi.push("con secreción");
    if (mi.length > 0) mamas.push(`Mama izquierda: ${processList(mi).join(', ')}`);

    if (mamas.length > 0) parts.push(mamas.join('. ') + '.');

    // Genitales y Vagina
    if (data.genitales_externos) parts.push(`Genitales externos ${data.genitales_externos.toLowerCase()}.`);

    let vagina = [];
    if (data.vagina_trayecto) vagina.push(`trayecto ${data.vagina_trayecto.toLowerCase()}`);

    if (data.paredes_vaginales && data.paredes_vaginales.length > 0) {
        const paredes = processList(data.paredes_vaginales);
        if (paredes.length > 0) vagina.push(`paredes con ${paredes.join(', ')}`);
    }

    if (vagina.length > 0) parts.push(`Vagina: ${vagina.join(', ')}.`);

    // Cuello
    let cuello = [];
    if (data.cuello_uterino && data.cuello_uterino.length > 0) {
        const cuellos = processList(data.cuello_uterino);
        if (cuellos.length > 0) cuello.push(`con ${cuellos.join(', ')}`);
    }
    if (data.oce_description) cuello.push(`OCE ${data.oce_description.toLowerCase()}`);
    if (data.movilizacion_cervix) cuello.push(`movilización ${data.movilizacion_cervix.toLowerCase()}`);
    if (cuello.length > 0) parts.push(`Cuello uterino: ${cuello.join(', ')}.`);

    // Secreción
    if (data.secrecion_vaginal_tipo && data.secrecion_vaginal_tipo.length > 0) {
        let secList = processList(data.secrecion_vaginal_tipo, ['no', 'ninguna', 'sin secreción']);
        // Note: Secrecion sometimes has "No" or "Normal"? Checking options might speed this up but generic safe list is okay.

        let sec = `Secreción vaginal ${secList.join(', ')}`;
        let details = [];
        if (data.secrecion_blanca_detalle) details.push(data.secrecion_blanca_detalle.toLowerCase());
        if (data.secrecion_sangre_detalle) details.push(data.secrecion_sangre_detalle.toLowerCase());

        if (details.length > 0) sec += ` (${details.join(', ')})`;
        parts.push(sec + '.');
    }

    // Tacto / Útero / Anexos
    if (data.realizo_tacto) {
        let tacto = [];
        if (data.utero_posicion) tacto.push(`útero en ${data.utero_posicion}`); // AVF/RVF is usually Upper
        if (data.utero_tamano) tacto.push(`tamaño ${data.utero_tamano.toLowerCase()}`);
        if (data.anexos_hallazgos && data.anexos_hallazgos.length > 0) {
            const anexos = processList(data.anexos_hallazgos);
            if (anexos.length > 0) tacto.push(`anexos: ${anexos.join(', ')}`);
        }
        if (data.fondo_saco) tacto.push(`fondo de saco ${data.fondo_saco.toLowerCase()}`);
        if (tacto.length > 0) parts.push(`Tacto vaginal: ${tacto.join(', ')}.`);
    }

    // Adicional
    if (data.examen_fisico_adicional) parts.push(data.examen_fisico_adicional);

    return parts.join(' ');
};
