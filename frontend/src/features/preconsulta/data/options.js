export const PRECONSULTA_OPTIONS = {
    // Medical History
    pathologies: ['Diabetes', 'Hipertensión', 'Asma', 'Alergias', 'Cáncer', 'Tiroides', 'Otro'],

    // Contraceptives
    mac: ['Pastillas', 'Inyección', 'Implante', 'DIU', 'Preservativo', 'Ligadura', 'Otro'],

    // Birth History
    birth_complications: ['Sin complicaciones', 'Preeclampsia', 'Hemorragia', 'Distocia', 'Infección', 'Placenta previa', 'Otro'],

    // Functional - Gastro
    gastro_symptoms: ['Diarrea', 'Estreñimiento', 'Gases', 'Distensión', 'Dolor', 'Otro'],

    // Functional - Legs
    leg_pain_type: ['Punzante', 'Hormigueo', 'Quemante', 'Otro'],
    leg_pain_zone: ['Interna', 'Muslos', 'Glúteos', 'Lateral', 'Otro'],

    // Functional - Urinary (Wait, checking flow used checklist for this?)
    // ASK_URINARY_PROBLEM is yes_no.

    // Doctor Exam Options (Kept for reference if needed by other components)
    radiales_mama: [
        'Radio 12', 'Radio 1', 'Radio 2', 'Radio 3',
        'Radio 4', 'Radio 5', 'Radio 6', 'Radio 7',
        'Radio 8', 'Radio 9', 'Radio 10', 'Radio 11',
        'Retroareolar'
    ],
    paredes_vaginales: ['Normales', 'Cistocele', 'Rectocele', 'Atrofia', 'Rugosas', 'Otro'],
    cuello_uterino: ['Sano', 'Ectropion', 'Pólipo', 'Lesión visible', 'Friable', 'Otro'],
    secrecion_vaginal: ['Blanca', 'Amarilla', 'Verdosa', 'Grisácea', 'Sanguinolenta', 'Fétida', 'Otro'],
    anexos_options: ['No palpables', 'Dolorosos', 'Masa palpable derecha', 'Masa palpable izquierda', 'Otro'],
};
