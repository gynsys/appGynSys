/**
 * Helper functions to generate text summaries from raw Preconsultation answers.
 * Used to backfill missing summary strings in DoctorConsultationPage.
 */

export const generateHabitsSummary = (answers) => {
    const summaryParts = [];
    
    // 1. Actividad Física
    const activity = answers.habits_physical_activity || answers['17'];
    if (activity && String(activity).toLowerCase() === 'sí') {
         summaryParts.push("La paciente refiere realizar actividad física de forma regular.");
    } else if (activity && String(activity).toLowerCase() === 'no') {
         summaryParts.push("Niega realizar actividad física de forma regular.");
    }

    // 2. Hábitos (Tabaco, Alcohol, Sustancias)
    const smoking = String(answers.habits_smoking || answers['15'] || 'No').toLowerCase();
    const alcohol = String(answers.habits_alcohol || answers['16'] || 'No').toLowerCase();
    const substances = String(answers.habits_substance_use || answers['18'] || 'No').toLowerCase();

    let habitsText = "";
    if (smoking === 'no' && alcohol === 'no') {
        habitsText = "Manifiesta no fumar y tampoco consume alcohol";
        if (substances === 'no' || substances.includes('niega')) {
            habitsText += ", y niega el uso de otras sustancias.";
        } else {
            habitsText += `, y refiere uso de otras sustancias (${substances}).`;
        }
    } else {
        const parts = [];
        if (smoking !== 'no') parts.push(`fuma (${smoking})`);
        else parts.push("no fuma");
            
        if (alcohol !== 'no') parts.push(`consume alcohol (${alcohol})`);
        else parts.push("no consume alcohol");
            
        habitsText = "Refiere que " + parts.join(' y ');
        if (substances !== 'no' && !substances.toLowerCase().includes('niega')) {
            habitsText += `, y confirma uso de otras sustancias (${substances}).`;
        } else {
            habitsText += ", y niega el uso de otras sustancias.";
        }
    }

    summaryParts.push(habitsText);
    return summaryParts.join(' ');
};

export const generateFunctionalExamSummary = (answers) => {
    const functionalKeys = [
        'functional_dispareunia', 'functional_leg_pain', 'functional_gastro_before',
        'functional_gastro_during', 'functional_dischezia', 'functional_bowel_freq',
        'functional_urinary_problem', 'functional_urinary_pain', 'functional_urinary_irritation',
        'functional_urinary_incontinence', 'functional_urinary_nocturia'
    ];
    
    const hasData = functionalKeys.some(k => answers[k] && String(answers[k]).toLowerCase() !== 'no' && String(answers[k]).toLowerCase() !== 'niega');
    
    if (!hasData) {
        return "Sin síntomas relevantes.";
    }

    const summaryParts = [];

    // 1. Dispareunia
    const dispareunia = answers.functional_dispareunia;
    if (dispareunia && String(dispareunia).toLowerCase() === 'sí') {
        const dType = answers.functional_dispareunia_type;
        const dScale = answers.functional_dispareunia_deep_scale;
        
        if (dType) {
            const intensityText = dScale ? ` (Intensidad: ${dScale}/10)` : "";
            summaryParts.push(`La paciente refiere dispareunia de tipo ${String(dType).toLowerCase()}${intensityText}.`);
        } else {
            summaryParts.push("Refiere dispareunia.");
        }
    } else if (dispareunia && String(dispareunia).toLowerCase() === 'no') {
        summaryParts.push("Niega dispareunia.");
    }

    // 2. Dolor en miembros inferiores
    const legPain = answers.functional_leg_pain;
    if (legPain && String(legPain).toLowerCase() === 'sí') {
        const pType = answers.functional_leg_pain_type;
        const pZone = answers.functional_leg_pain_zone;
        
        const typeText = pType ? `, descrito como '${pType}'` : "";
        const zoneText = pZone ? ` en la ${pZone}` : "";
        summaryParts.push(`Presenta dolor en miembros inferiores durante la menstruación${typeText}${zoneText}.`);
    } else if (legPain && String(legPain).toLowerCase() === 'no') {
        summaryParts.push("Niega dolor en miembros inferiores durante la menstruación.");
    }

    // 3. Gastrointestinal
    const gBefore = answers.functional_gastro_before;
    const gDuring = answers.functional_gastro_during;
    const dischezia = answers.functional_dischezia;
    const bowelFreq = answers.functional_bowel_freq;
    
    const sBefore = (gBefore && gBefore !== 'No') ? String(gBefore) : '';
    const sDuring = (gDuring && gDuring !== 'No') ? String(gDuring) : '';
    const sDischezia = dischezia || 'No';
    const sBowelFreq = bowelFreq || 'N/A';

    const symptomsSet = new Set();
    if (sBefore) {
        if (Array.isArray(gBefore)) gBefore.forEach(s => symptomsSet.add(String(s).toLowerCase()));
        else sBefore.split(',').forEach(s => symptomsSet.add(s.trim().toLowerCase()));
    }
    if (sDuring) {
        if (Array.isArray(gDuring)) gDuring.forEach(s => symptomsSet.add(String(s).toLowerCase()));
        else sDuring.split(',').forEach(s => symptomsSet.add(s.trim().toLowerCase()));
    }
    
    if (symptomsSet.size > 0 || sDischezia.toLowerCase() !== 'no') {
        let gastroSummary = "A nivel gastrointestinal, manifiesta";
        if (symptomsSet.has("dolor al evacuar")) symptomsSet.delete("dolor al evacuar");
        
        const symptomsText = Array.from(symptomsSet).sort().join(', ');
        let finalSymptoms = "";
        if (symptomsText) {
            finalSymptoms = ` síntomas como ${symptomsText}`;
            if (sDischezia.toLowerCase() !== 'no') {
                finalSymptoms += ` y dolor al evacuar (disquecia ${sDischezia.toLowerCase()})`;
            }
        } else if (sDischezia.toLowerCase() !== 'no') {
            finalSymptoms = ` dolor al evacuar (disquecia ${sDischezia.toLowerCase()})`;
        }
        
        gastroSummary += finalSymptoms + ".";
        
        if (sBowelFreq !== 'N/A') {
            gastroSummary += ` Su frecuencia evacuatoria es de ${sBowelFreq.toLowerCase()}.`;
        }
        summaryParts.push(gastroSummary);
        if (sBowelFreq !== 'N/A') {
             summaryParts.push(`A nivel gastrointestinal, no refiere síntomas significativos, con una frecuencia evacuatoria ${sBowelFreq.toLowerCase()}.`);
        }
    }

    // 4. Urinario
    const uProb = answers.functional_urinary_problem;
    if (uProb && String(uProb).toLowerCase() === 'sí') {
        const urinaryInfo = [];
        const uPain = answers.functional_urinary_pain;
        if (uPain && String(uPain).toLowerCase() === 'sí') {
            const uScale = answers.functional_urinary_pain_scale;
            const scaleText = uScale ? ` (${uScale}/10)` : "";
            urinaryInfo.push(`dolor al orinar${scaleText}`);
        }
        
        const others = [];
        if (String(answers.functional_urinary_irritation).toLowerCase() === 'sí') others.push("irritación");
        if (String(answers.functional_urinary_incontinence).toLowerCase() === 'sí') others.push("incontinencia");
        if (String(answers.functional_urinary_nocturia).toLowerCase() === 'sí') others.push("nocturia");
        
        if (others.length > 0) {
            urinaryInfo.push(others.join(' y '));
        }
        
        if (urinaryInfo.length > 0) {
            summaryParts.push(`En el sistema urinario, confirma problemas, específicamente con ${urinaryInfo.join(', ')}.`);
        } else {
            summaryParts.push("En el sistema urinario, confirma problemas no especificados.");
        }
    } else if (uProb && String(uProb).toLowerCase() === 'no') {
        summaryParts.push("Hábito miccional conservado.");
    }

    return summaryParts.join(' ');
};
