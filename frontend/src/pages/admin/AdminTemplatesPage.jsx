
import React, { useState, useEffect } from 'react';
import { FiCpu, FiFileText, FiTrash2, FiPlus, FiSave, FiCheck, FiX, FiMoreVertical, FiPlay, FiEdit2 } from 'react-icons/fi';
import AdminLayout from '../../components/layout/AdminLayout';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { parseTemplate } from '../../utils/templateParser';
import { useToastStore } from '../../store/toastStore';
import ModernLoader from '../../components/common/ModernLoader';
import { templateService } from '../../services/templateService';
import PreconsultaPreview from '../../features/preconsulta/components/PreconsultaPreview';

// Helper to convert linear list to graph flow
const convertQuestionsToFlow = (questions) => {
    const nodes = {};
    if (!questions || questions.length === 0) return { start_node: 'END', nodes: {} };

    // Pre-scan to find loop boundaries to help linking
    // We assume non-nested loops for MVP simplicity, or stack for nested.
    // Let's us a simple stack for "Current Loop Context"
    // But to resolve "next_node_after_loop" accurately, we might need lookahead.

    // Actually, we can just link i to i+1 usually.
    // Specially:
    // LOOP_START: next -> i+1 (First inside). Also needs next_node_after_loop -> matching END's next.
    // LOOP_END: next -> loop_step logic.

    // Let's map indices to IDs first
    const getId = (i) => (i < questions.length ? questions[i].id : 'END_OF_PRECONSULTA');

    // Helper to find matching end for a start
    const findLoopEnd = (startIndex) => {
        let depth = 1;
        for (let i = startIndex + 1; i < questions.length; i++) {
            if (questions[i].type === 'loop_start') depth++;
            if (questions[i].type === 'loop_end') depth--;
            if (depth === 0) return i;
        }
        return questions.length; // Not found?
    };

    questions.forEach((q, index) => {
        let node = null;
        const nextId = getId(index + 1);

        if (q.type === 'loop_start') {
            const endIndex = findLoopEnd(index);
            const afterLoopId = getId(endIndex + 1);

            node = {
                id: q.id,
                type: 'action',
                handler: 'prepare_generic_loop',
                loop_count_variable: q.variable, // Variable determining iterations (e.g. 'children_count')
                loop_variable: `loop_data_${q.variable}`, // Where to save result array
                next_node_in_loop: nextId,
                next_node_after_loop: afterLoopId
            };
        } else if (q.type === 'loop_end') {
            // The node before this (last Q or nested loop end) points here.
            // This node executes the 'Step' action.
            node = {
                id: q.id,
                type: 'action',
                handler: 'loop_step',
                // The 'step' handler decides where to go (start or after). 
                // It reads from state, doesn't need hardcoded next usually,
                // BUT current engine logic for loop_step returns startNodeId or endNodeId from state.
                // So we don't need explicit next_node here.
            };
        } else {
            // Normal Question
            let nodeType = 'text_input';
            if (q.type === 'boolean') nodeType = 'yes_no';
            else if (q.type === 'select') nodeType = 'dropdown';
            else if (q.type === 'multiselect') nodeType = 'checklist';
            else if (q.type === 'numeric_input') nodeType = 'numeric_input';
            else if (q.type === 'date') nodeType = 'date';
            else if (q.type === 'scale') nodeType = 'scale';

            // Options
            let options = [];
            if (q.options && Array.isArray(q.options)) {
                options = q.options.map(opt => ({ label: opt, value: opt }));
            }

            node = {
                id: q.id,
                type: nodeType,
                text: q.text,
                save_to: q.variable || `var_${q.id}`, // Use user-defined variable if available
                next_node: nextId,
                options: options
            };
        }
        nodes[q.id] = node;
    });

    return {
        start_node: getId(0),
        nodes: nodes
    };
};

export default function AdminTemplatesPage() {
    const { showToast } = useToastStore();
    const [loading, setLoading] = useState(false);
    const [loadingText, setLoadingText] = useState('Procesando...');
    const [templates, setTemplates] = useState([]);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            setLoadingText('Cargando plantillas...');
            const data = await templateService.getTemplates();
            setTemplates(data);
        } catch (error) {
            showToast('Error al cargar plantillas', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Import Modal State
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importText, setImportText] = useState('');
    const [importPreview, setImportPreview] = useState([]);
    const [step, setStep] = useState(1); // 1: Input, 2: Preview
    const [newTemplateName, setNewTemplateName] = useState('');

    // Preview Modal State
    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const [previewFlow, setPreviewFlow] = useState(null);

    const handleOpenImport = () => {
        setImportText('');
        setImportPreview([]);
        setNewTemplateName('');
        setStep(1);
        setIsImportModalOpen(true);
    };

    const handleParseText = () => {
        const parsed = parseTemplate(importText);
        if (parsed.length === 0) {
            showToast('No se detectaron preguntas en el texto', 'error');
            return;
        }
        setImportPreview(parsed);
        setStep(2);
    };

    const handleConfirmImport = async () => {
        if (!newTemplateName.trim()) {
            showToast('Debes ponerle un nombre a la plantilla', 'error');
            return;
        }

        setLoading(true);
        setLoadingText('Creando nueva plantilla desde IA...');
        try {
            const payload = {
                name: newTemplateName,
                questions: importPreview,
                is_active: true
            };
            await templateService.createTemplate(payload);
            showToast('Plantilla creada exitosamente', 'success');
            setIsImportModalOpen(false);
            fetchTemplates();
        } catch (error) {
            console.error(error);
            showToast('Error al crear plantilla', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTemplate = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar esta plantilla?')) {
            try {
                await templateService.deleteTemplate(id);
                showToast('Plantilla eliminada', 'success');
                fetchTemplates();
            } catch (error) {
                showToast('Error al eliminar', 'error');
            }
        }
    }

    const handleTestTemplate = (template) => {
        const flow = convertQuestionsToFlow(template.questions);
        setPreviewFlow(flow);
        setPreviewModalOpen(true);
    };

    // Also allow testing from Import Preview
    const handleTestImport = () => {
        const flow = convertQuestionsToFlow(importPreview);
        setPreviewFlow(flow);
        setPreviewModalOpen(true);
    };

    // Edit Modal State
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [questionsBuffer, setQuestionsBuffer] = useState([]);

    const handleEditTemplate = (template) => {
        setEditingTemplate(template);
        // Deep copy to avoid mutating original state directly
        setQuestionsBuffer(JSON.parse(JSON.stringify(template.questions || [])));
        setEditModalOpen(true);
    };

    const handleQuestionChange = (index, field, value) => {
        const updated = [...questionsBuffer];
        updated[index] = { ...updated[index], [field]: value };
        setQuestionsBuffer(updated);
    };

    const handleDeleteQuestion = (index) => {
        if (window.confirm('¿Eliminar esta pregunta?')) {
            const updated = questionsBuffer.filter((_, i) => i !== index);
            setQuestionsBuffer(updated);
        }
    };

    const handleAddQuestion = () => {
        const newQ = {
            id: `NEW_${Date.now()}`,
            text: 'Nueva Pregunta',
            type: 'text',
            category: 'general',
            required: true,
            options: [] // Initialize empty array for safety
        };
        setQuestionsBuffer([...questionsBuffer, newQ]);
    };

    const handleSaveEdit = async () => {
        if (!editingTemplate) return;
        setLoading(true);
        try {
            const payload = {
                ...editingTemplate,
                questions: questionsBuffer
            };
            // Clean up payload (remove local id if needed, but backend ignores unknown fields usually)
            await templateService.updateTemplate(editingTemplate.id, payload);
            showToast('Plantilla actualizada', 'success');
            setEditModalOpen(false);
            fetchTemplates();
        } catch (error) {
            console.error(error);
            showToast('Error al actualizar', 'error');
        } finally {
            setLoading(false);
        }
    };


    return (
        <AdminLayout>
            <div className="px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Gestión de Plantillas</h1>
                        <p className="mt-2 text-gray-600">Constructor y administrador de plantillas de preconsulta.</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleOpenImport}
                            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-sm font-medium"
                        >
                            <FiCpu className="w-5 h-5" />
                            <span>Nueva Plantilla con IA</span>
                        </button>
                    </div>
                </div>

                {templates.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                            <FiFileText className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes plantillas creadas</h3>
                        <p className="text-gray-500 max-w-sm mx-auto mb-6">
                            Utiliza el botón de "Nueva Plantilla con IA" para pegar un cuestionario y convertirlo automáticamente.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {templates.map(template => (
                            <div key={template.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col hover:border-indigo-300 transition-colors group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="bg-indigo-50 p-3 rounded-lg text-indigo-600">
                                        <FiFileText className="w-6 h-6" />
                                    </div>
                                    <button onClick={() => handleDeleteTemplate(template.id)} className="text-gray-400 hover:text-red-500">
                                        <FiTrash2 />
                                    </button>
                                </div>
                                <h3 className="font-bold text-gray-900 text-lg mb-1">{template.name}</h3>
                                <p className="text-sm text-gray-500 mb-4 flex-1">
                                    {template.questions?.length || 0} preguntas configuradas
                                </p>

                                <div className="flex flex-col gap-2 pt-4 border-t border-gray-100">
                                    <button
                                        onClick={() => handleEditTemplate(template)}
                                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium rounded-lg border border-gray-200 transition-all"
                                    >
                                        <FiEdit2 className="w-4 h-4" /> Modificar Preguntas
                                    </button>

                                    <div className="flex justify-between items-center mt-1">
                                        <button
                                            onClick={() => handleTestTemplate(template)}
                                            className="flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-800 transition-colors text-sm"
                                        >
                                            <FiPlay className="w-4 h-4" /> Probar Chatbot
                                        </button>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${template.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {template.is_active ? 'Activa' : 'Inactiva'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Import Modal */}
                <Modal
                    isOpen={isImportModalOpen}
                    onClose={() => setIsImportModalOpen(false)}
                    title="Importar Cuestionario Inteligente (IA)"
                    size="lg"
                >
                    <div className="space-y-4 mt-4">
                        {step === 1 ? (
                            <>
                                <p className="text-sm text-gray-600">
                                    Pegue aquí el contenido de la plantilla.
                                </p>
                                <textarea
                                    value={importText}
                                    onChange={(e) => setImportText(e.target.value)}
                                    className="w-full h-64 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-gray-50 font-mono text-sm"
                                    placeholder={`1. ¿Pregunta? (Si/No)`}
                                />
                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        onClick={() => setIsImportModalOpen(false)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                    >
                                        Cancelar
                                    </button>
                                    <Button onClick={handleParseText} disabled={!importText.trim()}>
                                        Analizar Texto
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Plantilla</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Ej: Historia Clínica Ginecología"
                                        value={newTemplateName}
                                        onChange={(e) => setNewTemplateName(e.target.value)}
                                    />
                                </div>

                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-semibold text-gray-800">Vista Previa ({importPreview.length} preguntas)</h3>
                                    <div className="flex gap-2">
                                        <button onClick={handleTestImport} className="text-sm flex items-center gap-1 text-indigo-600 hover:underline">
                                            <FiPlay className="w-3 h-3" /> Probar ahora
                                        </button>
                                        <span className="text-gray-300">|</span>
                                        <button onClick={() => setStep(1)} className="text-sm text-gray-500 hover:text-gray-800">
                                            Editar texto
                                        </button>
                                    </div>
                                </div>
                                <div className="max-h-[50vh] overflow-y-auto space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                                    {importPreview.map((q, idx) => (
                                        <div key={idx} className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                                            <div className="flex justify-between items-start gap-2">
                                                <span className="text-xs font-bold text-gray-400 mt-1">#{idx + 1}</span>
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-800">{q.text}</p>
                                                    <div className="flex gap-2 mt-1">
                                                        <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded uppercase font-bold">{q.type}</span>
                                                    </div>
                                                </div>
                                                <div className="bg-green-50 text-green-600 p-1 rounded-full">
                                                    <FiCheck className="w-3 h-3" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-4">
                                    <button
                                        onClick={() => setIsImportModalOpen(false)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                    >
                                        Cancelar
                                    </button>
                                    <Button onClick={handleConfirmImport} variant="primary">
                                        <FiSave className="w-4 h-4 mr-2" />
                                        Guardar Plantilla
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </Modal>

                {/* Edit Template Modal */}
                <Modal
                    isOpen={editModalOpen}
                    onClose={() => setEditModalOpen(false)}
                    title={`Editar: ${editingTemplate?.name || 'Plantilla'}`}
                    size="2xl"
                >
                    <div className="flex flex-col h-[70vh]">
                        <div className="flex-1 overflow-y-auto p-1 space-y-4">
                            {questionsBuffer.map((q, idx) => (
                                <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex gap-4 items-start">
                                    <div className="mt-2 text-xs font-bold text-gray-300">#{idx + 1}</div>
                                    <div className="flex-1 space-y-3">
                                        <input
                                            type="text"
                                            value={q.text}
                                            onChange={(e) => handleQuestionChange(idx, 'text', e.target.value)}
                                            className="w-full font-medium text-gray-800 border-b border-gray-200 focus:border-indigo-500 focus:outline-none bg-transparent py-1"
                                            placeholder="Escribe la pregunta..."
                                        />
                                        <div className="flex gap-4">
                                            <select
                                                value={q.type}
                                                onChange={(e) => handleQuestionChange(idx, 'type', e.target.value)}
                                                className="text-sm border border-gray-200 rounded-lg px-2 py-1 bg-gray-50"
                                            >
                                                <option value="text">Texto</option>
                                                <option value="boolean">Si/No</option>
                                                <option value="select">Selección Única</option>
                                                <option value="multiselect">Selección Múltiple</option>
                                                <option value="numeric_input">Numérico</option>
                                                <option value="date">Fecha</option>
                                                <option value="scale">Escala 1-10</option>
                                            </select>

                                            <select
                                                value={q.category}
                                                onChange={(e) => handleQuestionChange(idx, 'category', e.target.value)}
                                                className="text-sm border border-gray-200 rounded-lg px-2 py-1 bg-gray-50"
                                            >
                                                <option value="general">General</option>
                                                <option value="gyn_history">Ginecología</option>
                                                <option value="medical_history">Hist. Médica</option>
                                                <option value="lifestyle">Estilo de Vida</option>
                                            </select>

                                            <label className="flex items-center gap-2 text-sm text-gray-600">
                                                <input
                                                    type="checkbox"
                                                    checked={q.required}
                                                    onChange={(e) => handleQuestionChange(idx, 'required', e.target.checked)}
                                                    className="rounded text-indigo-600 focus:ring-indigo-500"
                                                />
                                                Obligatorio
                                            </label>
                                        </div>

                                        {/* Advanced: Variable Name (Auto-generated usually, but editable for loops) */}
                                        <div className="flex gap-2 items-center">
                                            <span className="text-xs text-gray-400">ID Var:</span>
                                            <input
                                                type="text"
                                                value={q.variable || ''}
                                                placeholder={q.type === 'loop_start' ? 'Variable Contador' : 'Auto (var_ID)'}
                                                onChange={(e) => handleQuestionChange(idx, 'variable', e.target.value)}
                                                className="text-xs border border-gray-100 rounded px-1 py-0.5 text-gray-500 w-32"
                                            />
                                        </div>

                                        {/* Options Editor (Only if needed) */}
                                        {(q.type === 'select' || q.type === 'multiselect') && (
                                            <div className="bg-gray-50 p-3 rounded-lg">
                                                <p className="text-xs font-semibold text-gray-500 mb-2">Opciones (separadas por coma):</p>
                                                <input
                                                    type="text"
                                                    value={Array.isArray(q.options) ? q.options.join(', ') : ''}
                                                    onChange={(e) => handleQuestionChange(idx, 'options', e.target.value.split(',').map(s => s.trim()))}
                                                    className="w-full text-sm border border-gray-300 rounded p-2"
                                                    placeholder="Opción 1, Opción 2, Opción 3"
                                                />
                                            </div>
                                        )}

                                        {/* Loop Start Editor */}
                                        {q.type === 'loop_start' && (
                                            <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                                                <p className="text-xs font-bold text-orange-600 mb-1">INICIO DE BUCLE (Repetir Bloque)</p>
                                                <p className="text-xs text-gray-600">Este bloque se repetirá según el valor de la variable indicada arriba. Asegúrate que una pregunta anterior guarde su respuesta en esa variable.</p>
                                            </div>
                                        )}

                                        {/* Loop End Editor */}
                                        {q.type === 'loop_end' && (
                                            <div className="bg-orange-50 p-2 rounded-lg border border-orange-100 text-center">
                                                <p className="text-xs font-bold text-orange-600">FIN DE BUCLE</p>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleDeleteQuestion(idx)}
                                        className="text-gray-400 hover:text-red-500 p-2"
                                        title="Eliminar pregunta"
                                    >
                                        <FiTrash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="pt-4 mt-2 border-t border-gray-200 bg-white flex justify-between items-center">
                            <button
                                onClick={handleAddQuestion}
                                className="flex items-center gap-2 px-4 py-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg font-medium transition-colors"
                            >
                                <FiPlus /> Agregar Pregunta
                            </button>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setEditModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancelar
                                </button>
                                <Button onClick={handleSaveEdit} variant="primary">
                                    <FiSave className="w-4 h-4 mr-2" />
                                    Guardar Cambios
                                </Button>
                            </div>
                        </div>
                    </div>
                </Modal>

                <ModernLoader isOpen={loading} text={loadingText} />

                {/* Chatbot Preview Widget */}
                {previewModalOpen && (
                    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
                        <div className="bg-transparent w-full max-w-md h-[600px] relative pointer-events-auto">
                            <PreconsultaPreview
                                isOpen={previewModalOpen}
                                onClose={() => setPreviewModalOpen(false)}
                                directFlow={previewFlow}
                            />
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
