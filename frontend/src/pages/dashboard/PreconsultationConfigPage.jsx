import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToastStore } from '../../store/toastStore';
import { FiSave, FiArrowLeft, FiPlus, FiTrash2, FiEdit2, FiX, FiFileText, FiCheck, FiToggleLeft, FiToggleRight, FiCpu, FiActivity, FiUser, FiGrid } from 'react-icons/fi';
import { GiFemale, GiHeartOrgan, GiEyeTarget, GiKidneys, GiMale } from 'react-icons/gi';
import { parseTemplate } from '../../utils/templateParser';
import { doctorService } from '../../services/doctorService';
import { preconsultationService } from '../../services/preconsultationService';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import ModernLoader from '../../components/common/ModernLoader';

export default function PreconsultationConfigPage() {
  const navigate = useNavigate();
  const { showToast } = useToastStore();
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Procesando...'); // New state for dynamic loader text

  // ... existing Modal State ...
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newQuestion, setNewQuestion] = useState({
    text: '',
    type: 'text',
    category: 'general',
    required: false,
    options: []
  });
  // Import Modal State
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  const [newOption, setNewOption] = useState('');


  const handleOpenModal = (questionToEdit = null) => {
    if (questionToEdit) {
      setEditingId(questionToEdit.id);
      setNewQuestion({
        text: questionToEdit.text,
        type: questionToEdit.type,
        category: questionToEdit.category,
        required: questionToEdit.required,
        options: questionToEdit.options || []
      });
    } else {
      setEditingId(null);
      setNewQuestion({
        text: '',
        type: 'text',
        category: 'general',
        required: false,
        options: []
      });
    }
    setNewOption('');
    setIsModalOpen(true);
  };

  const handleAddOption = () => {
    if (newOption.trim()) {
      setNewQuestion(prev => ({
        ...prev,
        options: [...prev.options, newOption.trim()]
      }));
      setNewOption('');
    }
  };

  const handleRemoveOption = (index) => {
    setNewQuestion(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const handleSaveQuestion = async () => {
    if (!newQuestion.text.trim()) {
      showToast('La pregunta debe tener un texto', 'error');
      return;
    }
    if ((newQuestion.type === 'select' || newQuestion.type === 'multiselect') && newQuestion.options.length === 0) {
      showToast('Debes agregar al menos una opción para este tipo de pregunta', 'error');
      return;
    }

    try {
      if (editingId) {
        await preconsultationService.updateQuestion(editingId, newQuestion);
        showToast('Pregunta actualizada correctamente', 'success');
      } else {
        const questionToAdd = {
          ...newQuestion,
          id: `CUSTOM_${Date.now()}` // Backend will assign real ID, but we send this for now or let backend handle it
        };
        await preconsultationService.createQuestion(questionToAdd);
        showToast('Pregunta agregada correctamente', 'success');
      }

      await fetchQuestions(); // Refresh list
      setIsModalOpen(false);
      setEditingId(null);
    } catch (error) {
      showToast('Error al guardar la pregunta', 'error');
    }
  };

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'danger', // danger or warning
    onConfirm: () => { }
  });

  const handleDeleteQuestion = (id) => {
    setConfirmModal({
      isOpen: true,
      title: 'Eliminar Pregunta',
      message: '¿Estás seguro de eliminar esta pregunta? Esta acción no se puede deshacer.',
      type: 'danger',
      onConfirm: async () => {
        try {
          await preconsultationService.deleteQuestion(id);
          await fetchQuestions();
          showToast('Pregunta eliminada', 'success');
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          showToast('Error al eliminar la pregunta', 'error');
        }
      }
    });
  };

  const handleDeleteAll = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Eliminar Todas',
      message: '¿Estás seguro de eliminar TODAS las preguntas? Esta acción no se puede deshacer.',
      type: 'danger',
      onConfirm: async () => {
        try {
          await preconsultationService.deleteAllQuestions();
          await fetchQuestions();
          showToast('Todas las preguntas han sido eliminadas', 'success');
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          showToast('Error al eliminar las preguntas', 'error');
        }
      }
    });
  };

  const fetchQuestions = async () => {
    try {
      const data = await preconsultationService.getQuestions();
      setQuestions(data);
    } catch (error) {
      showToast('Error al cargar las preguntas', 'error');
    }
  };

  const loadGynecologyTemplate = async () => {
    setIsTemplateModalOpen(false);
    setLoading(true);
    setLoadingText('Cargando Plantilla de Ginecología...');
    try {
      // 1. Delete all existing
      await preconsultationService.deleteAllQuestions();

      // 2. Parse and Add Optimized Template
      // We use the same text structure as the optimized backup file
      const infoText = `
1. ¿Tu madre tiene antecedentes médicos importantes? (Si/No)

2. Selecciona los antecedentes de tu madre:
- Diabetes
- Hipertensión
- Asma
- Alergias
- Cáncer
- Tiroides
- Otro

3. ¿Tu padre tiene antecedentes médicos importantes? (Si/No)

4. Selecciona los antecedentes de tu padre:
- Diabetes
- Hipertensión
- Asma
- Alergias
- Cáncer
- Tiroides
- Otro

5. ¿Tienes antecedentes médicos personales? (Si/No)

6. Selecciona tus antecedentes personales:
- Diabetes
- Hipertensión
- Asma
- Alergias
- Cáncer
- Tiroides
- Otro

7. ¿Tomas algún suplemento o vitamina? (Si/No)

8. Indica qué suplementos tomas:

9. ¿Te has realizado alguna cirugía? (Si/No)

10. Describe tus cirugías previas:

11. ¿A qué edad tuviste tu primera menstruación? (numérico)

12. ¿A qué edad iniciaste tu vida sexual? (numérico)

13. ¿Eres sexualmente activa actualmente? (Si/No)

14. ¿Has intentado quedar embarazada en el último año?
- Sí, activamente
- No, pero no lo evito
- No, me cuido
- No aplica

15. ¿Tus ciclos menstruales son regulares? (Si/No)

16. ¿Cuántos dias te dura la regla?

17. ¿Cada cuántos días te viene la regla?

18. ¿Sufres de dolor menstrual (dismenorrea)? (Si/No)

19. Del 1 al 10, ¿qué tan fuerte es el dolor?

20. ¿Cuál fue la fecha de tu última menstruación? (fecha)

21. ¿Usas algún método anticonceptivo? (Si/No)

22. Selecciona tus métodos anticonceptivos:
- Pastillas
- Inyección
- Implante
- DIU
- Preservativo
- Ligadura
- Natural
- Otro

23. ¿Cuándo fue tu último chequeo ginecológico? (mes/año)

24. ¿Cuándo fue tu última citología ? (mes/año)

25. Indica tu historial Obstétrico:
- Nuligesta 
- Primigesta 
- Multigesta 



26. ¿Has tenido otros embarazos además del actual? (Si/No)

27. ¿Sientes dolor durante las relaciones sexuales? (Si/No)

28. ¿El dolor es superficial o profundo?
- Superficial
- Profundo
- Ambos

29. Del 1 al 10, ¿qué tan fuerte es el dolor profundo?

30. ¿Sientes dolor en las piernas? (Si/No)

31. ¿Cómo es el dolor de piernas?
- Punzante
- Hormigueo
- Quemante
- Otro

32. ¿En qué zona sientes el dolor?
- Interna
- Muslos
- Glúteos
- Lateral
- Otro

33. ¿Tienes síntomas gastrointestinales ANTES de la regla? (Si/No)

34. Selecciona los síntomas (Antes):
- Diarrea
- Estreñimiento
- Gases
- Distensión
- Dolor

35. ¿Tienes síntomas gastrointestinales DURANTE la regla? (Si/No)

36. Selecciona los síntomas (Durante):
- Diarrea
- Estreñimiento
- Gases
- Distensión
- Dolor

37. ¿Sientes dolor al evacuar (disquecia)?
- No
- Sí
- A veces

38. Del 1 al 10, ¿qué tan fuerte es el dolor al evacuar?

39. ¿Con qué frecuencia evacúas?
- Diario
- Cada 2 días
- Cada 3 días
- Semanal
- Irregular

40. ¿Tienes problemas urinarios?
(Si/No)

41. ¿Sientes dolor al orinar?
(Si/No)

42. Del 1 al 10, ¿qué tan fuerte es el dolor al orinar?

43. ¿Sientes irritación urinaria? 
(Si/No)

44. ¿Tienes incontinencia urinaria? 
(Si/No)

45. ¿Te levantas mas de tres veces por la noche para orinar (nocturia)? (Si/No)

46. ¿Realizas actividad física?
(Si/No)

47. ¿Fumas? 
(Si/No)

48. ¿Consumes alcohol?
- Nunca
- Ocasional
- Frecuente

49. ¿Consumes alguna sustancia ilicita?
- No
- Sí
`;
      const templateQuestions = parseTemplate(infoText);

      // Process sequentially to avoid overwhelming the server and ensure order
      for (let i = 0; i < templateQuestions.length; i++) {
        const q = templateQuestions[i];
        const payload = {
          ...q,
          id: `TEMPLATE_${Date.now()}_${i}`, // Unique ID with index
          order: i, // Ensure correct order
          options: q.options || [] // Ensure options is always an array
        };

        try {
          await preconsultationService.createQuestion(payload);
        } catch (err) {
          // Continue with other questions or throw? 
          // If one fails, we probably want to know, but maybe let's try to finish the rest.
          // For now, let's throw to trigger the main catch block if it's critical.
          throw err;
        }
      }

      await fetchQuestions();
      showToast('Plantilla de Ginecología cargada exitosamente', 'success');
    } catch (error) {
      showToast('Error al cargar la plantilla', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmTemplateLoad = () => {
    // Wrapper to show warning before erasing data
    setConfirmModal({
      isOpen: true,
      title: 'Cargar Plantilla',
      message: 'Esta acción borrará todas las preguntas actuales y cargará la plantilla seleccionada. ¿Deseas continuar?',
      type: 'warning',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        await loadGynecologyTemplate();
      }
    });
  };

  const [questions, setQuestions] = useState([]);

  const [settings, setSettings] = useState({
    include_functional_exam: true
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const user = await doctorService.getCurrentUser();
        if (user.pdf_config) {
          setSettings(prev => ({
            ...prev,
            include_functional_exam: user.pdf_config.include_functional_exam ?? true
          }));
        }
      } catch (error) {
      }
    };

    fetchSettings();
    fetchQuestions();
  }, []);

  const handleToggleFunctionalExam = async () => {
    const newValue = !settings.include_functional_exam;
    setSettings(prev => ({ ...prev, include_functional_exam: newValue }));

    // Auto-save setting
    try {
      const user = await doctorService.getCurrentUser();
      const currentConfig = user.pdf_config || {};
      await doctorService.updateCurrentUser({
        pdf_config: { ...currentConfig, include_functional_exam: newValue }
      });
      showToast(newValue ? 'Examen funcional activado' : 'Examen funcional desactivado', 'success');
    } catch (error) {
      showToast('Error al guardar configuración', 'error');
    }
  };

  const visibleQuestions = questions.filter(q =>
    settings.include_functional_exam ? true : q.category !== 'functional_exam'
  );


  const handleSubmit = async (e) => {
    // This function was saving settings like functional_exam which is now removed.
    // We can keep it if there are future settings, or just remove the button. 
    // The user removed the functional exam checkbox, but kept the Save button in the header?
    // Let's keep it as specific "Save Changes" if we had individual question edits, but here the save button logic was specific to settings.
    // For now I will leave it empty or remove the settings part.
    // Actually, simply remove the logic related to settings.
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Page Header with Actions */}
      {/* Page Header Card */}
      {/* Header hidden by user request */}

      {/* <div className="mb-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col xl:flex-row items-center justify-between gap-6">
       ...
      </div> */}

      {/* Section Title and Count */}
      {/* Section Title, Count, and Add Button Card */}
      <div className="mb-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Preguntas Configuradas en Chatbot de Preconsulta Ginecología y Obstetricia
          </h2>
          <div className="mt-1 text-gray-500 dark:text-gray-400 text-sm max-w-lg leading-relaxed mb-2">
            <p>Personaliza el cuestionario que verán tus pacientes antes de la cita.</p>
          </div>
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-1">
            {visibleQuestions.length} Preguntas activas
          </p>
        </div>

        {/* Add Button hidden by user request */}
        {/* <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-all shadow-sm hover:shadow-md font-medium text-sm whitespace-nowrap"
        >
          <FiPlus className="w-5 h-5" />
          <span>Agregar Pregunta</span>
        </button> */}
      </div>

      {/* Functional Exam Card */}
      <div className="mb-6 bg-gradient-to-r from-blue-50 to-white dark:from-gray-800 dark:to-gray-900 p-4 rounded-2xl border border-blue-100 dark:border-gray-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-lg text-blue-600 dark:text-blue-300 shrink-0">
            <FiActivity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Examen Funcional</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Incluir preguntas sobre función urinaria, intestinal y hábitos.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <span className={`text-sm font-medium ${settings.include_functional_exam ? 'text-blue-900 dark:text-blue-300' : 'text-gray-400 dark:text-gray-600'}`}>
            {settings.include_functional_exam ? 'Activado' : 'Desactivado'}
          </span>
          <button
            onClick={handleToggleFunctionalExam}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${settings.include_functional_exam ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}
          >
            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings.include_functional_exam ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Questions List Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="space-y-3">
            {visibleQuestions.map((q) => (
              <div key={q.id} className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-sm transition-all group gap-4 sm:gap-0">
                <div className="flex-1 w-full">
                  <div className="flex items-start gap-3">
                    <span className="mt-1 text-gray-400 text-xs font-mono select-none shrink-0">{q.order + 1 < 10 ? `0${q.order + 1}` : q.order + 1}</span>
                    <div className="w-full">
                      <p className="font-semibold text-gray-900 dark:text-gray-200 text-[15px] break-words">{q.text}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity w-full sm:w-auto justify-end sm:pl-4 border-t sm:border-t-0 border-gray-100 dark:border-gray-700 pt-3 sm:pt-0 mt-2 sm:mt-0">
                  <button
                    onClick={() => handleOpenModal(q)}
                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors flex items-center gap-2 sm:gap-0"
                    title="Editar"
                  >
                    <span className="text-xs sm:hidden">Editar</span>
                    <FiEdit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {visibleQuestions.length === 0 && (
              <div className="text-center py-16 px-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiFileText className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-200">No hay preguntas visibles</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                  Comienza cargando una plantilla predefinida o crea tus propias preguntas.
                </p>
                <button onClick={() => setIsTemplateModalOpen(true)} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline">
                  Cargar Plantilla Recomendada
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Editar Pregunta" : "Nueva Pregunta"}
        size="lg"
      >
        <div className="space-y-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Texto de la Pregunta</label>
            <input
              type="text"
              value={newQuestion.text}
              onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-white"
              placeholder="Ej: ¿Tiene alergias?"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Pregunta</label>
              <select
                value={newQuestion.type}
                onChange={(e) => setNewQuestion({ ...newQuestion, type: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-white"
              >
                <option value="text">Entrada de Texto</option>
                <option value="boolean">Sí / No</option>
                <option value="select">Selección de varios ítems (Única respuesta)</option>
                <option value="multiselect">Checklist (Múltiples respuestas)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoría</label>
              <select
                value={newQuestion.category}
                onChange={(e) => setNewQuestion({ ...newQuestion, category: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-white"
              >
                <option value="general">General</option>
                <option value="medical_history">Historia Médica</option>
                <option value="gyn_history">Historia Ginecológica</option>
                <option value="obstetric_history">Historia Obstétrica</option>
                <option value="functional_exam">Examen Funcional</option>
                <option value="lifestyle">Estilo de Vida</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="required"
              checked={newQuestion.required}
              onChange={(e) => setNewQuestion({ ...newQuestion, required: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="required" className="text-sm text-gray-700 dark:text-gray-300">Pregunta Obligatoria</label>
          </div>

          {(newQuestion.type === 'select' || newQuestion.type === 'multiselect') && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Opciones de Respuesta</label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddOption()}
                  className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-white"
                  placeholder="Escribe una opción y presiona Enter"
                />
                <button
                  onClick={handleAddOption}
                  className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <FiPlus />
                </button>
              </div>

              {newQuestion.options.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {newQuestion.options.map((opt, idx) => (
                    <span key={idx} className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm">
                      {opt}
                      <button onClick={() => handleRemoveOption(idx)} className="hover:text-blue-900">
                        <FiX className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">No hay opciones agregadas aún.</p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveQuestion}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Guardar Pregunta
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        title={confirmModal.title}
        size="sm"
      >
        <div className="space-y-4">
          <div className={`flex items-center justify-center w-12 h-12 rounded-full mx-auto mb-4 ${confirmModal.type === 'warning' ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'}`}>
            <FiTrash2 className="w-6 h-6" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-center">
            {confirmModal.message}
          </p>
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
              className="px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={confirmModal.onConfirm}
              className={`px-4 py-2 text-white rounded-lg transition-colors ${confirmModal.type === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-red-600 hover:bg-red-700'}`}
            >
              Confirmar
            </button>
          </div>
        </div>
      </Modal>


      <Modal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        title="Selecciona una Plantilla"
        size="md"
      >
        <div className="space-y-4 mt-4">
          <p className="text-gray-600">Elige una plantilla base para comenzar. Esta acción reemplazará las preguntas actuales.</p>

          <button
            onClick={handleConfirmTemplateLoad}
            className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
          >
            <div className="flex gap-4">
              <div className="bg-pink-100 p-3 rounded-lg text-pink-600 h-fit">
                <GiFemale size={24} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-700">Ginecología y Obstetricia</h3>
                  <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">Recomendado</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Plantilla completa. Antecedentes, historia obstétrica y examen funcional detallado.
                </p>
              </div>
            </div>
          </button>

          {[
            { name: 'Medicina Interna', desc: 'Antecedentes cardiovasculares y sistémicos.', icon: <GiHeartOrgan size={24} /> },
            { name: 'Oftalmología', desc: 'Agudeza visual y fondo de ojo.', icon: <GiEyeTarget size={24} /> },
            { name: 'Nefrología', desc: 'Función renal y diálisis.', icon: <GiKidneys size={24} /> },
            { name: 'Urología', desc: 'Salud prostática y función vesical.', icon: <GiMale size={24} /> }
          ].map((spec, idx) => (
            <button
              key={idx}
              disabled
              className="w-full text-left p-4 rounded-xl border border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed"
            >
              <div className="flex gap-4">
                <div className="bg-gray-100 p-3 rounded-lg text-gray-400 h-fit">
                  {spec.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-500">{spec.name}</h3>
                  <p className="text-sm text-gray-400 mt-1">{spec.desc}</p>
                  <span className="inline-block mt-2 bg-gray-200 text-gray-500 text-xs px-2 py-1 rounded-full font-medium">Próximamente</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </Modal>

      <ModernLoader isOpen={loading} text={loadingText} />
    </div >
  );
}
