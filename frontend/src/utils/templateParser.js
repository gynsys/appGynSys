/**
 * Parses raw text into structured question objects.
 * Heuristics:
 * 1. Blocks separated by double newlines or lines starting with numbers.
 * 2. Type detection:
 *    - (Si/No) -> boolean
 *    - List of items -> select/multiselect
 *    - Keywords "Edad", "Peso", "Cuántos" -> numeric
 *    - Keywords "Fecha", "Cuándo" -> date
 *    - Keywords "1 al 10" -> scale
 */
export const parseTemplate = (text) => {
    if (!text) return [];

    // Normalize: Remove carriage returns
    const cleanText = text.replace(/\r/g, '');

    // Split by double newline OR lines starting with number dot (e.g. "1. ")
    // We use a lookahead to keep the delimiter if it's a number
    // Implementation: We'll iterate manually to handle lists correctly
    const lines = cleanText.split('\n');
    const questions = [];
    let currentQuestion = null;

    const flushQuestion = () => {
        if (currentQuestion) {
            // Finalize detection
            detectTypeAndRefine(currentQuestion);
            questions.push(currentQuestion);
            currentQuestion = null;
        }
    };

    lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) {
            if (currentQuestion && currentQuestion.options && currentQuestion.options.length === 0) {
                flushQuestion();
            }
            return;
        }

        // Detect Loop Start
        // Syntax: "> R: variable" or "> REPETIR: variable"
        const loopStartMatch = trimmed.match(/^>\s*(?:REPETIR|R|LOOP):\s*(\w+)/i);
        if (loopStartMatch) {
            flushQuestion();
            const loopVar = loopStartMatch[1];

            // "Auto Detection": Back-patch the variable to the PREVIOUS question if it exists
            // This ensures "How many children?" (variable: null) becomes (variable: 'hijos')
            if (questions.length > 0) {
                const prevQ = questions[questions.length - 1];
                // Only if previous question doesn't have a variable yet
                if (!prevQ.variable) {
                    prevQ.variable = loopVar;
                    console.log(`[Parser] Auto-assigned variable '${loopVar}' to question '${prevQ.text}'`);
                }
            }

            questions.push({
                id: `LOOP_START_${Date.now()}_${questions.length}`,
                type: 'loop_start',
                variable: loopVar,
                text: `Incio de Bucle (${loopVar})`,
                category: 'logic',
                required: false
            });
            return;
        }

        // Detect Loop End
        const loopEndMatch = trimmed.match(/^>\s*(?:FIN|END)/i);
        if (loopEndMatch) {
            flushQuestion();
            questions.push({
                id: `LOOP_END_${Date.now()}_${questions.length}`,
                type: 'loop_end',
                text: 'Fin de Bucle',
                category: 'logic',
                required: false
            });
            return;
        }

        // Check if line starts with specific bullet points implying options
        const bulletMatch = trimmed.match(/^[-*•]\s*(.*)/) || trimmed.match(/^[a-z]\)\s*(.*)/);

        // New Question Start Detection (Number followed by dot, at start of block)
        const isNewQuestionNumber = /^\d+\.\s+/.test(trimmed);

        if (isNewQuestionNumber) {
            flushQuestion();
            const text = trimmed.replace(/^\d+\.\s+/, '');
            currentQuestion = {
                text: text,
                type: 'text', // Default, will refine
                category: 'general',
                required: true,
                options: []
            };
        } else if (bulletMatch) {
            // It's an option for the current question
            if (currentQuestion) {
                currentQuestion.options.push(bulletMatch[1]);
                // If it has options, it's at least a select
                if (currentQuestion.type === 'text' || currentQuestion.type === 'numeric') {
                    currentQuestion.type = 'select';
                }
            }
        } else {
            // It's text. 
            if (!currentQuestion) {
                // Create new question from unnumbered line
                currentQuestion = {
                    text: trimmed,
                    type: 'text',
                    category: 'general',
                    required: true,
                    options: []
                };
            } else {
                // Append to current question text if it seems like continuation and NOT a list
                if (currentQuestion.options.length === 0) {
                    currentQuestion.text += " " + trimmed;
                } else {
                    // We were reading options, and now found text without bullet.
                    // Could be a new question
                    flushQuestion();
                    currentQuestion = {
                        text: trimmed,
                        type: 'text',
                        category: 'general',
                        required: true,
                        options: []
                    };
                }
            }
        }
    });

    flushQuestion();

    // Post-processing: infer categories and refine types
    return questions.map((q, index) => {
        if (q.type === 'loop_start' || q.type === 'loop_end') return q;

        // 1. Boolean check
        if (q.text.toLowerCase().includes('(si/no)') || q.text.toLowerCase().includes('(sí/no)')) {
            q.type = 'boolean';
            q.text = q.text.replace(/ \(si\/no\)/i, '').replace(/ \(sí\/no\)/i, '').trim();
        }

        // 2. Multiselect Check
        if (q.type === 'select') {
            const lower = q.text.toLowerCase();
            if (lower.includes('seleccione varios') || lower.includes('seleccione los') || lower.includes('marque los') || lower.includes('cuales') || lower.includes('cuáles')) {
                q.type = 'multiselect';
            }
        }

        // 3. Numeric Check (Only if still text)
        if (q.type === 'text') {
            const lower = q.text.toLowerCase();
            // Logic to infer 'save_to' variable name for reference in loops
            if (lower.includes('cuantos') || lower.includes('cuántos')) {
                // Try to guess variable name like 'hijos', 'gestas'
                // This is weak, but better than nothing
            }

            if (
                lower.includes('edad') ||
                lower.includes('peso') ||
                lower.includes('cuanto mide') ||
                lower.includes('cuánto mide') ||
                lower.includes('años') ||
                (lower.includes('cuántos') && !lower.includes('días')) // Avoid confusion
            ) {
                q.type = 'numeric_input';
            }

            // ... (rest of checks)
            if (lower.includes('fecha') || lower.includes('cuándo') || lower.includes('nacimiento')) {
                q.type = 'date';
            }

            // Month Picker Check
            if (lower.includes('(mes)') || lower.includes('(mes/año)') || lower.includes('mm/aaaa')) {
                q.type = 'month'; // Distinct from 'date'
                q.text = q.text.replace(/\(mes\)/i, '').replace(/\(mes\/año\)/i, '').replace(/mm\/aaaa/i, '').trim();
            }

            // Scale Check
            if (lower.includes('1 al 10') || lower.includes('1-10')) {
                q.type = 'scale';
            }
        }

        // 4. Category Inference
        const lowerText = q.text.toLowerCase();
        if (lowerText.includes('menstru') || lowerText.includes('regla') || lowerText.includes('embarazo') || lowerText.includes('parto')) {
            q.category = 'gyn_history';
        } else if (lowerText.includes('madre') || lowerText.includes('padre') || lowerText.includes('antecedentes') || lowerText.includes('cirugía')) {
            q.category = 'medical_history';
        } else if (lowerText.includes('fuma') || lowerText.includes('alcohol') || lowerText.includes('ejercicio') || lowerText.includes('física')) {
            q.category = 'lifestyle';
        } else if (lowerText.includes('orinar') || lowerText.includes('evacuar') || lowerText.includes('dolor')) {
            q.category = 'functional_exam';
        }

        return {
            ...q,
            id: `IMPORTED_${Date.now()}_${index}`,
            order: index
        };
    });
};

function detectTypeAndRefine(q) {
}
