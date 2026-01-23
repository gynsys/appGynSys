
// Mock Questions based on populate_preconsultation.py
const questions = [
    // General
    { "id": "ASK_FULL_NAME", "text": "Por favor, ingresa tu nombre completo:", "type": "text", "category": "general", "required": true, "order": 1 },
    { "id": "ASK_AGE", "text": "¿Cuál es tu edad?", "type": "number", "category": "general", "required": true, "order": 2 },
    { "id": "ASK_CI", "text": "Ingresa tu número de Cédula de Identidad:", "type": "number", "category": "general", "required": true, "order": 3 },
    { "id": "ASK_PHONE", "text": "Ingresa tu número de teléfono:", "type": "number", "category": "general", "required": true, "order": 4 },
    { "id": "ASK_ADDRESS", "text": "¿Cuál es tu dirección de residencia?", "type": "text", "category": "general", "required": true, "order": 5 },
    { "id": "ASK_OCCUPATION", "text": "¿Cuál es tu ocupación?", "type": "text", "category": "general", "required": true, "order": 6 },

    // Medical History
    { "id": "ASK_MOTHER_HISTORY_BOOL", "text": "¿Tu madre tiene antecedentes médicos importantes?", "type": "boolean", "category": "medical_history", "required": true, "order": 7 },
    { "id": "ASK_MOTHER_CHECKLIST", "text": "Selecciona los antecedentes de tu madre:", "type": "multiselect", "category": "medical_history", "required": false, "options": ['Diabetes', 'Hipertensión', 'Asma', 'Alergias', 'Cáncer', 'Tiroides'], "order": 8 },
    { "id": "ASK_FATHER_HISTORY_BOOL", "text": "¿Tu padre tiene antecedentes médicos importantes?", "type": "boolean", "category": "medical_history", "required": true, "order": 9 },
    { "id": "ASK_FATHER_CHECKLIST", "text": "Selecciona los antecedentes de tu padre:", "type": "multiselect", "category": "medical_history", "required": false, "options": ['Diabetes', 'Hipertensión', 'Asma', 'Alergias', 'Cáncer', 'Tiroides'], "order": 10 },
    { "id": "ASK_PERSONAL_HISTORY_BOOL", "text": "¿Tienes antecedentes médicos personales?", "type": "boolean", "category": "medical_history", "required": true, "order": 11 },
    { "id": "ASK_PERSONAL_CHECKLIST", "text": "Selecciona tus antecedentes personales:", "type": "multiselect", "category": "medical_history", "required": false, "options": ['Diabetes', 'Hipertensión', 'Asma', 'Alergias', 'Cáncer', 'Tiroides'], "order": 12 },
    { "id": "ASK_SUPPLEMENTS", "text": "¿Tomas algún suplemento o vitamina?", "type": "boolean", "category": "medical_history", "required": true, "order": 13 },
    { "id": "ASK_SUPPLEMENTS_TEXT", "text": "Indica qué suplementos tomas:", "type": "text", "category": "medical_history", "required": false, "order": 14 },
    { "id": "ASK_SURGICAL_HISTORY", "text": "¿Te has realizado alguna cirugía?", "type": "boolean", "category": "medical_history", "required": true, "order": 15 },
    { "id": "ASK_SURGICAL_HISTORY_TEXT", "text": "Describe tus cirugías previas:", "type": "text", "category": "medical_history", "required": false, "order": 16 },

    // Gyn History
    { "id": "ASK_MENARCHE", "text": "¿A qué edad tuviste tu primera menstruación?", "type": "number", "category": "gyn_history", "required": true, "order": 17 },
    { "id": "ASK_FERTILITY_INTENT", "text": "¿Has intentado quedar embarazada en el último año?", "type": "select", "category": "gyn_history", "required": false, "order": 20 },
    { "id": "ASK_CYCLES_REGULAR", "text": "¿Tus ciclos menstruales son regulares?", "type": "boolean", "category": "gyn_history", "required": true, "order": 21 },
    { "id": "ASK_DYSMENORRHEA_BOOL", "text": "¿Sufres de dolor menstrual (dismenorrea)?", "type": "boolean", "category": "gyn_history", "required": true, "order": 24 },
    { "id": "SHOW_DYSMENORRHEA_SCALE", "text": "Del 1 al 10, ¿qué tan fuerte es el dolor?", "type": "scale", "category": "gyn_history", "required": false, "order": 25 },
    { "id": "ASK_MAC", "text": "¿Usas algún método anticonceptivo?", "type": "boolean", "category": "gyn_history", "required": true, "order": 27 },
    { "id": "ASK_MAC_CHECKLIST", "text": "Selecciona tus métodos anticonceptivos:", "type": "multiselect", "category": "gyn_history", "required": false, "options": ['Pastillas', 'Inyección', 'Implante', 'DIU', 'Preservativo', 'Ligadura'], "order": 28 },

    // Functional
    { "id": "ASK_DISPAREUNIA_BOOL", "text": "¿Sientes dolor durante las relaciones sexuales?", "type": "boolean", "category": "functional_exam", "required": true, "order": 35 },
    { "id": "ASK_PAIN_TYPE", "text": "¿El dolor es superficial o profundo?", "type": "select", "category": "functional_exam", "required": false, "order": 36 },
];

function runSimulation() {
    const newNodes = {};
    const sortedQuestions = questions.sort((a, b) => a.order - b.order);

    console.log("--- STARTING SIMULATION ---");

    // Exact Logic from PreconsultaWidget.jsx
    for (let i = 0; i < sortedQuestions.length; i++) {
        const q = sortedQuestions[i];
        const nextQ = i < sortedQuestions.length - 1 ? sortedQuestions[i + 1] : null;
        const nextNextQ = i < sortedQuestions.length - 2 ? sortedQuestions[i + 2] : null;

        const nodeId = `Q_${q.id}`;
        // Default Sequential Link
        let nextNodeId = nextQ ? `Q_${nextQ.id}` : 'SHOW_SUMMARY';

        let nodeType = 'text_input';
        if (q.type === 'boolean') nodeType = 'yes_no';
        if (q.type === 'select') nodeType = 'buttons';
        if (q.type === 'multiselect') nodeType = 'checklist';
        if (q.type === 'numeric_input') nodeType = 'numeric_input';
        if (q.type === 'number') nodeType = 'numeric_input'; // fix for mock data type 'number'
        if (q.type === 'date') nodeType = 'date';
        if (q.type === 'month') nodeType = 'month_picker';
        if (q.type === 'scale') nodeType = 'scale';

        // Conditional Logic Heuristic
        let nextOnYes = undefined;
        let nextOnNo = undefined;

        if (nodeType === 'yes_no' && nextQ) {
            const textLower = (nextQ.text || '').toLowerCase();
            const idLower = (nextQ.id || '').toLowerCase();

            // 1. Explicit Overrides
            const forcedFollowUps = [
                'ASK_MOTHER_HISTORY_BOOL',
                'ASK_FATHER_HISTORY_BOOL',
                'ASK_PERSONAL_HISTORY_BOOL',
                'ASK_SUPPLEMENTS',
                'ASK_SURGICAL_HISTORY',
                'ASK_GASTRO_BEFORE_BOOL',
                'ASK_GASTRO_DURING_BOOL',
                'ASK_URINARY_PROBLEM_BOOL',
                'ASK_URINARY_PAIN_BOOL'
            ];
            const isForced = forcedFollowUps.includes(q.id);

            // 2. Heuristics
            const textMatches = ['describe', 'cual', 'cuál', 'detalle', 'indique', 'indica', 'especifique', 'fuma', 'bebe', 'frecuencia', 'selecciona', 'marcar', 'elegir', 'lista', 'enumer', 'sintomas', 'síntomas'].some(k => textLower.includes(k));
            const idMatches = ['_text', '_desc', '_details', '_prompt', '_input', '_checklist', '_select', '_options'].some(suffix => idLower.endsWith(suffix));

            const isFollowUp = isForced || textMatches || idMatches;

            if (isFollowUp) {
                nextOnYes = `Q_${nextQ.id}`;
                nextOnNo = nextNextQ ? `Q_${nextNextQ.id}` : 'SHOW_SUMMARY';
            } else {
                nextOnYes = nextNodeId;
                nextOnNo = nextNodeId;
            }
        }

        newNodes[nodeId] = {
            id: nodeId,
            type: nodeType,
            text_raw: q.text,
            next_node: nextNodeId,
            next_on_yes: nextOnYes,
            next_on_no: nextOnNo
        };

        if (nodeType === 'yes_no') {
            console.log(`\nQUESTION: ${q.text} (${q.id})`);
            console.log(`   -> Next (Seq): ${nextNodeId}`);
            console.log(`   -> Next IF YES: ${nextOnYes}`);
            console.log(`   -> Next IF NO:  ${nextOnNo}`);
            console.log(`   -> Is Follow Up detected? ${nextOnYes !== nextNodeId || (nextOnYes === nextNodeId && nextOnNo !== nextNodeId)}`); // Logic check

            if (nextOnNo === nextNodeId) {
                console.warn("   [WARNING] LOGIC FAILURE? 'No' does NOT skip next question.");
            } else {
                console.log("   [OK] Logic Skips correctly.");
            }
        }
    }
}

runSimulation();
