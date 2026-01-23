/**
 * Helper functions to generate text summaries from raw Preconsultation answers.
 * Used to backfill missing summary strings in DoctorConsultationPage.
 */

export const generateHabitsSummary = (answers) => {
    const parts = [];

    // Alcohol
    if (answers.habits_alcohol === 'Sí' || answers.habits_alcohol === 'Ocasion') {
        parts.push(`Alcohol: ${answers.habits_alcohol_freq || 'Ocasional'}`);
    } else if (answers.habits_alcohol === 'No') {
        parts.push('Negativo alcohol');
    }

    // Smoking
    if (answers.habits_smoking === 'Sí') {
        parts.push(`Tabáquismo: ${answers.habits_smoking_freq || 'Sí'}`);
    } else if (answers.habits_smoking === 'No') {
        parts.push('Negativo tabáquismo');
    }

    // Drugs
    if (answers.habits_substance_use === 'Sí') {
        parts.push(`Drogas: ${answers.habits_substance_type || 'Sí'}`);
    } else if (answers.habits_substance_use === 'No') {
        parts.push('Negativo drogas ilícitas');
    }

    // Exercise
    if (answers.habits_physical_activity === 'Sí') {
        parts.push(`Actividad física: Sí`);
    } else {
        parts.push(`Sedentaria`);
    }

    return parts.join('. ') + '.';
};

export const generateFunctionalExamSummary = (answers) => {
    const parts = [];

    // Urinary
    if (answers.functional_urinary_problem === true || answers.functional_urinary_problem === 'true' || answers.functional_urinary_problem === 'Sí') {
        const uParts = [];
        if (answers.functional_urinary_pain === true || answers.functional_urinary_pain === 'true' || answers.functional_urinary_pain === 'Sí') uParts.push(`Disuria`);
        if (answers.functional_urinary_incontinence === true || answers.functional_urinary_incontinence === 'true' || answers.functional_urinary_incontinence === 'Sí') uParts.push(`Incontinencia`);
        if (answers.functional_urinary_nocturia === true || answers.functional_urinary_nocturia === 'true' || answers.functional_urinary_nocturia === 'Sí') uParts.push(`Nocturia`);
        if (answers.functional_urinary_irritation === true || answers.functional_urinary_irritation === 'true' || answers.functional_urinary_irritation === 'Sí') uParts.push(`Irritación vesical`);

        if (uParts.length > 0) {
            parts.push(`Urinario: ${uParts.join(', ')}`);
        } else {
            parts.push(`Urinario: Refiere problemas inespecíficos`);
        }
    } else {
        parts.push(`Urinario: Niega`); // Default negative
    }

    // Gastro
    const gastro = [];
    if (answers.functional_gastro_before && answers.functional_gastro_before.length > 0 && answers.functional_gastro_before !== 'Niega') {
        gastro.push(`Pre-menstrual: ${Array.isArray(answers.functional_gastro_before) ? answers.functional_gastro_before.join(', ') : answers.functional_gastro_before}`);
    }
    if (answers.functional_gastro_during && answers.functional_gastro_during.length > 0 && answers.functional_gastro_during !== 'Niega') {
        gastro.push(`Menstrual: ${Array.isArray(answers.functional_gastro_during) ? answers.functional_gastro_during.join(', ') : answers.functional_gastro_during}`);
    }

    // Bowel Habit
    if (answers.functional_bowel_freq) {
        gastro.push(`Hábito Evacuatorio: ${answers.functional_bowel_freq}`);
    }

    if (gastro.length > 0) {
        parts.push(`Gastrointestinal: ${gastro.join('. ')}`);
    } else {
        parts.push(`Gastrointestinal: Niega sintomatología asociada`);
    }

    // Pelvic Pain
    const pelv = [];
    if (answers.functional_dispareunia === true || answers.functional_dispareunia === 'true' || answers.functional_dispareunia === 'Sí') {
        pelv.push(`Dispareunia (${answers.functional_dispareunia_type || ''})`);
    }
    if (answers.functional_dischezia === true || answers.functional_dischezia === 'true' || answers.functional_dischezia === 'Sí') {
        pelv.push(`Disquecia`);
    }
    if (answers.functional_leg_pain === true || answers.functional_leg_pain === 'true' || answers.functional_leg_pain === 'Sí') {
        pelv.push(`Dolor pélvico irradiado`);
    }

    if (pelv.length > 0) {
        parts.push(`Algias Pélvicas: ${pelv.join(', ')}`);
    } else {
        parts.push(`Algias Pélvicas: Niega`);
    }

    return parts.join('\n');
};
