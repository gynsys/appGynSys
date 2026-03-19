/**
 * Helper functions to generate text summaries from raw Preconsultation answers.
 * Used to backfill missing summary strings in DoctorConsultationPage.
 */

export const generateHabitsSummary = (answers) => {
    const parts = [];

    // 1. Actividad Física
    const exercises = answers.habits_physical_activity || answers['17'];
    if (exercises && (exercises === 'Sí' || (typeof exercises === 'string' && exercises.toLowerCase().includes('sí')))) {
        // Assume answers has detail fields or the string itself contains the format
        let activitySummary = "La paciente refiere realizar actividad física regular";
        
        // Try to parse details if it's a formatted string (like what backend expects)
        if (typeof exercises === 'string') {
            const freqMatch = exercises.match(/Frecuencia: ([\w\s/]+)[,.]/);
            const duraMatch = exercises.match(/Duración: ([\w\s>]+ min)[,.]/);
            const goalMatch = exercises.match(/Objetivo: (.+)/);
            
            if (freqMatch) activitySummary += ` con una frecuencia de ${freqMatch[1].trim()}`;
            if (duraMatch) activitySummary += `, sesiones de ${duraMatch[1].trim().replace(" min", "")} minutos`;
            if (goalMatch) activitySummary += ` con el objetivo de ${goalMatch[1].trim().toLowerCase()}`;
        }
        parts.push(activitySummary + ".");
    } else {
        parts.push("Niega realizar actividad física de forma regular.");
    }

    // 2. Otros Hábitos (Tabaco, Alcohol, Sustancias)
    const smoking = answers.habits_smoking || answers['15'] || 'No';
    const alcohol = answers.habits_alcohol || answers['16'] || 'No';
    const substances = answers.habits_substance_use || answers['18'] || 'No';

    if (String(smoking).toLowerCase() === 'no' && String(alcohol).toLowerCase() === 'no') {
        let habitsText = "Manifiesta no fumar y tampoco consume alcohol";
        if (String(substances).toLowerCase() === 'no') {
            habitsText += ", y niega el uso de otras sustancias.";
        } else {
            habitsText += `, y refiere uso de otras sustancias (${substances}).`;
        }
        parts.push(habitsText);
    } else {
        const subParts = [];
        if (String(smoking).toLowerCase() !== 'no') subParts.push(`fuma (${smoking})`);
        else subParts.push("no fuma");

        if (String(alcohol).toLowerCase().includes('ocasional')) subParts.push("consume alcohol ocasionalmente");
        else if (String(alcohol).toLowerCase() !== 'no') subParts.push(`consume alcohol (${alcohol})`);
        else subParts.push("no consume alcohol");

        if (String(substances).toLowerCase() === 'no') subParts.push("niega el uso de otras sustancias");
        else subParts.push(`refiere uso de otras sustancias (${substances})`);

        parts.push(`En cuanto a hábitos: ${subParts.join(', ')}.`);
    }

    return parts.join(' ');
};

export const generateFunctionalExamSummary = (answers) => {
    // Check if there is ANY functional data to avoid the old empty summary bug
    const functionalKeys = [
        'functional_dispareunia', 'functional_leg_pain', 'functional_gastro_before',
        'functional_gastro_during', 'functional_dischezia', 'functional_bowel_freq',
        'functional_urinary_problem'
    ];
    
    const hasData = functionalKeys.some(k => answers[k] && String(answers[k]).toLowerCase() !== 'no' && String(answers[k]).toLowerCase() !== 'niega');
    
    // If absolutely no data in keys, return default but better than "Sin síntomas relevantes" if we want to be explicit
    // However, the user wants the concatenation.
    
    const parts = [];

    // 1. Dispareunia
    const dispareunia = answers.functional_dispareunia;
    if (dispareunia && String(dispareunia).toLowerCase().includes('sí')) {
        const match = String(dispareunia).match(/tipo (\w+) \(Intensidad: (\d+)\/10\)/);
        if (match) {
            const [_, tipo, intensidadStr] = match;
            const intensidad = parseInt(intensidadStr);
            const desc = intensidad >= 7 ? "de alta intensidad" : intensidad >= 4 ? "de moderada intensidad" : "de leve intensidad";
            parts.push(`La paciente refiere dispareunia de tipo ${tipo.toLowerCase()} ${desc} (${intensidad}/10).`);
        } else {
            parts.push("Refiere dispareunia.");
        }
    } else {
        parts.push("Niega dispareunia.");
    }

    // 2. Dolor miembros inferiores
    const legPain = answers.functional_leg_pain;
    if (legPain && String(legPain).toLowerCase().includes('sí')) {
        const match = String(legPain).match(/Tipo: ([\w\s,]+), Zona: ([\w\s,]+)/);
        if (match) {
            const [_, tipo, zona] = match;
            parts.push(`Presenta dolor en miembros inferiores, descrito como '${tipo.toLowerCase()}' en la ${zona.toLowerCase()}.`);
        } else {
            parts.push("Refiere dolor en miembros inferiores durante la menstruación.");
        }
    } else {
        parts.push("Niega dolor en miembros inferiores durante la menstruación.");
    }

    // 3. Gastrointestinal
    const gastroPre = answers.functional_gastro_before || 'No';
    const gastroDur = answers.functional_gastro_during || 'No';
    const dischezia = answers.functional_dischezia || 'No';
    const bowelFreq = answers.functional_bowel_freq || 'N/A';

    const symptomsSet = new Set();
    if (String(gastroPre).toLowerCase() !== 'no') String(gastroPre).toLowerCase().split(',').forEach(s => symptomsSet.add(s.trim()));
    if (String(gastroDur).toLowerCase() !== 'no') String(gastroDur).toLowerCase().split(',').forEach(s => symptomsSet.add(s.trim()));

    if (symptomsSet.size > 0 || String(dischezia).toLowerCase() !== 'no') {
        let gastroSuffix = "";
        if (symptomsSet.has("dolor al evacuar")) symptomsSet.delete("dolor al evacuar");
        const list = Array.from(symptomsSet);
        const symptomsText = list.join(', ');
        const finalSymptoms = (symptomsText ? symptomsText + ", " : "") + 
                             (String(dischezia).toLowerCase() !== 'no' ? `dolor al evacuar (disquecia ${String(dischezia).toLowerCase()})` : "");
        
        const freqText = (list.length === 0 && String(dischezia).toLowerCase().includes('eventual')) 
                         ? `Su frecuencia evacuatoria ${bowelFreq.toLowerCase()}` 
                         : `Su frecuencia evacuatoria es de ${bowelFreq.toLowerCase()}`;
        
        parts.push(`A nivel gastrointestinal, manifiesta síntomas como ${finalSymptoms}. ${freqText}.`);
    } else {
        parts.push(`A nivel gastrointestinal, no refiere síntomas significativos, con una frecuencia evacuatoria ${bowelFreq.toLowerCase()}.`);
    }

    // 4. Urinario
    const urinary = answers.functional_urinary_problem;
    if (urinary && String(urinary).toLowerCase() !== 'no') {
        const uParts = [];
        const uPain = answers.functional_urinary_pain;
        if (uPain && String(uPain).toLowerCase().includes('sí')) {
            const match = String(uPain).match(/\(Intensidad: (\d+)\/10\)/);
            if (match) {
                const intensidad = parseInt(match[1]);
                const desc = intensidad >= 7 ? "muy alta" : intensidad >= 4 ? "moderada" : "leve";
                uParts.push(`dolor al orinar de intensidad ${desc} (${intensidad}/10)`);
            }
        }
        
        const others = [];
        if (String(answers.functional_urinary_irritation).toLowerCase() === 'sí') others.push("irritación");
        if (String(answers.functional_urinary_incontinence).toLowerCase() === 'sí') others.push("incontinencia");
        if (String(answers.functional_urinary_nocturia).toLowerCase() === 'sí') others.push("nocturia");
        
        let urSummary = "En el sistema urinario, confirma problemas";
        if (uParts.length > 0) {
            urSummary += `, con ${uParts[0]}`;
            if (others.length > 0) urSummary += `, acompañado de ${others.join(' y ')}`;
            urSummary += ".";
        } else if (others.length > 0) {
            urSummary += `, manifestando ${others.join(' y ')}.`;
        } else {
            urSummary += " no especificados.";
        }
        parts.push(urSummary);
    } else {
        parts.push("Hábito miccional conservado.");
    }

    return parts.join(' ');
};
