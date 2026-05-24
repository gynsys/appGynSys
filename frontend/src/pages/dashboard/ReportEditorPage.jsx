import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useToastStore } from '../../store/toastStore';
import api from '../../lib/axios';
import { 
  FiUser, FiFileText, FiDownload, FiSave, FiRefreshCw, 
  FiSend, FiCheckCircle, FiChevronRight, FiEdit3, FiArrowLeft,
  FiPrinter, FiInfo, FiTrash2, FiClock, FiFilePlus
} from 'react-icons/fi';
import { downloadFile, isCapacitor, openExternalFile } from '../../utils/platform';
import GynSysLoader from '../../components/common/GynSysLoader';
import { getImageUrl } from '../../lib/imageUtils';

// Helper: Venezuelan CI formatter
const formatCi = (ciString) => {
  if (!ciString) return '';
  const clean = ciString.replace(/\D/g, '');
  return new Intl.NumberFormat('de-DE').format(clean);
};

// Helper: Auto-formats a comma/newline separated text into an enumerated list
const formatAsList = (text) => {
  if (!text) return '';
  // If it already looks like a formatted list, keep it
  if (/^\s*\d+\./.test(text)) return text;
  
  const items = text.split(/[\n,]+/)
    .map(item => item.trim())
    .filter(item => item.length > 0);
    
  return items.map((item, idx) => `${idx + 1}. ${item}`).join('\n');
};

export default function ReportEditorPage() {
  const { doctor, isDarkTheme, primaryColor = '#4F46E5' } = useOutletContext() || {};
  const { showToast } = useToastStore();
  const navigate = useNavigate();

  // Chatbot State Machine (Simplified: only Name, CI, Age, Weight, Diagnosis)
  const STEPS = {
    WELCOME: 'WELCOME',
    NAME: 'NAME',
    CI: 'CI',
    AGE: 'AGE',
    WEIGHT: 'WEIGHT',
    DIAGNOSIS: 'DIAGNOSIS',
    COMPLETED: 'COMPLETED'
  };

  const [currentStep, setCurrentStep] = useState(STEPS.WELCOME);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Custom Date (for preview and generation)
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [includeColor, setIncludeColor] = useState(true);
  const [includeWatermark, setIncludeWatermark] = useState(true);
  const [savedConsultationId, setSavedConsultationId] = useState(null);

  // History / Retrieval State
  const [recentReports, setRecentReports] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Document Fields State
  const [formData, setFormData] = useState({
    full_name: '',
    ci: '',
    age: '',
    weight: '60kg',
    phone: 'N/A',
    address: 'No especificada',
    occupation: 'No especificada',
    reason_for_visit: 'Consulta Médica Ginecológica',
    admin_physical_exam: 'Evaluación ginecológica y física general de rutina dentro de los límites normales.',
    admin_ultrasound: 'Útero en anteversión de dimensiones y ecoestructura conservada. Endometrio trilaminar, homogéneo, de espesor normal para fase del ciclo. Ovarios de características ecográficas normales.',
    admin_diagnosis: '1. Control Ginecológico de rutina.',
    admin_plan: '1. Mantener control ginecológico anual.\n2. Hábitos de vida saludables y control ginecológico periódico.',
    admin_observations: '60kg', // We reuse this field to persist the patient's weight in the database
    medical_report_content: ''
  });

  const messagesEndRef = useRef(null);
  const chatInputRef = useRef(null);

  // Fetch recent reports on mount
  useEffect(() => {
    fetchRecentReports();
  }, []);

  const fetchRecentReports = async () => {
    setLoadingHistory(true);
    try {
      const response = await api.get('/consultations/');
      const sorted = (response.data || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setRecentReports(sorted.slice(0, 10)); // Keep top 10 reports
    } catch (error) {
      console.error('Error fetching recent reports:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Automatically format unified content in real-time if any section changes
  useEffect(() => {
    if (currentStep === STEPS.COMPLETED) {
      // Build unified text mimicking the KELYN medical report format:
      // 1. Narrative
      // 2. Ecografía
      // 3. Diagnósticos
      // 4. Plan Terapéutico
      const ageVal = formData.age;
      const ageText = ageVal ? `${ageVal} años` : '';
      
      const narrative = `Se trata de paciente de ${ageText} de edad, peso: ${formData.weight}, quien acude a consulta para presentar sintomatología clínica consistente en: ${formData.reason_for_visit.toLowerCase()}.\nSe realiza exploración física y ultrasonido ginecológico constatando los siguientes hallazgos:\n\nExamen Físico: ${formData.admin_physical_exam}`;
      
      const ecoSection = formData.admin_ultrasound 
        ? `\n\nECOGRAFÍA GINECOLÓGICA:\n${formData.admin_ultrasound}`
        : '';
        
      const diagSection = formData.admin_diagnosis
        ? `\n\nDIAGNÓSTICOS:\n${formData.admin_diagnosis}`
        : '';
        
      const planSection = formData.admin_plan
        ? `\n\nPLAN TERAPÉUTICO:\n${formData.admin_plan}`
        : '';
        
      const unified = `${narrative}${ecoSection}${diagSection}${planSection}`;
      setFormData(prev => ({
        ...prev,
        medical_report_content: unified
      }));
    }
  }, [
    formData.reason_for_visit,
    formData.admin_physical_exam,
    formData.admin_ultrasound,
    formData.admin_diagnosis,
    formData.admin_plan,
    formData.age,
    formData.weight,
    currentStep
  ]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize Chat Flow
  useEffect(() => {
    const docName = doctor?.nombre_completo || 'Doctor(a)';
    setMessages([
      {
        id: 1,
        sender: 'bot',
        text: `¡Hola! Soy tu Asistente Inteligente de GynSys. Te guiaré paso a paso para recopilar la información clínica básica y generar un hermoso Informe Médico totalmente editable.<br/><br/><strong>Comencemos: ¿Cuál es el nombre y apellido completo de la paciente?</strong>`
      }
    ]);
    setCurrentStep(STEPS.NAME);
  }, [doctor]);

  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue.trim();
    setInputValue('');

    // Add user response to messages
    setMessages(prev => [...prev, {
      id: Date.now(),
      sender: 'user',
      text: userText
    }]);

    setLoading(true);

    setTimeout(() => {
      processStepResponse(userText);
    }, 600);
  };

  const processStepResponse = (text) => {
    setLoading(false);
    
    if (currentStep === STEPS.NAME) {
      setFormData(prev => ({ ...prev, full_name: text }));
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        text: `Excelente. Ahora por favor ingresa el número de <strong>Cédula de Identidad</strong> de <strong>${text}</strong> (puedes escribir solo números):`
      }]);
      setCurrentStep(STEPS.CI);
    } 
    else if (currentStep === STEPS.CI) {
      setFormData(prev => ({ ...prev, ci: text }));
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        text: `Entendido. ¿Qué <strong>edad</strong> tiene la paciente?`
      }]);
      setCurrentStep(STEPS.AGE);
    } 
    else if (currentStep === STEPS.AGE) {
      setFormData(prev => ({ ...prev, age: text }));
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        text: `Perfecto. ¿Cuál es el <strong>peso</strong> de la paciente? (ej: 60kg):`
      }]);
      setCurrentStep(STEPS.WEIGHT);
    }
    else if (currentStep === STEPS.WEIGHT) {
      setFormData(prev => ({ ...prev, weight: text }));
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        text: `Perfecto. Por último, ingresa el <strong>diagnóstico clínico principal</strong> de la paciente:`
      }]);
      setCurrentStep(STEPS.DIAGNOSIS);
    }
    else if (currentStep === STEPS.DIAGNOSIS) {
      const formattedDiags = formatAsList(text);
      setFormData(prev => ({ 
        ...prev, 
        admin_diagnosis: formattedDiags,
        // Set ultrasound standard draft with the diagnosis content to be extremely helpful
        admin_ultrasound: `Signos ecográficos sugestivos de: ${text}.`
      }));
      
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        text: `🎉 ¡Magnífico! He recopilado todos los datos básicos. Desbloqueando la <strong>vista previa del informe</strong> y las opciones de edición interactiva.`
      }]);

      setTimeout(() => {
        setCurrentStep(STEPS.COMPLETED);
        showToast('Asistente completado. Modo Editor Activo.', 'success');
      }, 1000);
    }
  };

  const handleSkipAssistant = () => {
    // Fill basic defaults
    setFormData(prev => ({
      ...prev,
      full_name: 'Kelyn Rosal',
      ci: '19.397.706',
      age: '35',
      weight: '60kg',
      reason_for_visit: 'alteración del patrón menstrual dado por aumento de volumen, frecuencia y duración desde el día 29/03/2026.',
      admin_physical_exam: 'Evaluación física general y ginecológica dentro de límites normales.',
      admin_ultrasound: 'Signos ecográficos sugestivos de: Endometriosis peritoneal. Endometriosis profunda infiltrativa: torus uterino, tabique rectovaginal. Con probable extensión inguinal. Mioma uterino FIGO 3 y 4.',
      admin_diagnosis: '1. Sangrado uterino anormal tipo L\n2. Leiomiomatosis uterina\n3. Endometriosis profunda infiltrativa',
      admin_plan: '1. Iniciar tratamiento con esquema piramidal de anticonceptivos hasta que cese el sangrado.\n2. Realizar resonancia magnética de pelvis con gadolineo\n3. Ácido tranexámico: Tomar 1 tableta cada 8 horas por 3 días\n4. Mantener control y seguimiento del caso'
    }));
    setCurrentStep(STEPS.COMPLETED);
    showToast('Asistente saltado. Plantilla de ejemplo cargada.', 'info');
  };

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveToGynSys = async () => {
    setSaving(true);
    try {
      const payload = {
        ...formData,
        admin_observations: formData.weight, // We persist the weight inside observations text column!
        doctor_id: doctor?.id || 1,
      };

      let response;
      if (savedConsultationId) {
        response = await api.put(`/consultations/${savedConsultationId}`, payload);
      } else {
        response = await api.post('/consultations/', payload);
      }

      const data = response.data;
      if (data.status === 'success' || data.consultation_id || savedConsultationId) {
        const id = data.consultation_id || savedConsultationId;
        setSavedConsultationId(id);
        showToast('Informe guardado en Historias Clínicas exitosamente', 'success');
        
        // Refresh recent reports history
        fetchRecentReports();
        
        return id;
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (error) {
      console.error('Error saving consultation:', error);
      showToast('Error al guardar el informe en Historias Clínicas', 'error');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPdf = async () => {
    let activeId = savedConsultationId;
    
    // Auto-save first if not saved yet
    if (!activeId) {
      showToast('Guardando informe antes de generar el PDF...', 'info');
      activeId = await handleSaveToGynSys();
      if (!activeId) return; // Abort if save failed
    }

    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';
      const params = new URLSearchParams();
      if (includeColor) params.append('use_color', 'true');
      if (!includeWatermark) params.append('include_watermark', 'false');
      params.append('report_at', reportDate);
      params.append('download', 'true');

      const url = `${API_BASE}/consultations/${activeId}/pdf?${params.toString()}`;
      
      if (isCapacitor()) {
        openExternalFile(url);
      } else {
        downloadFile(url, `Informe_Medico_${formData.full_name.replace(/\s+/g, '_')}.pdf`);
      }
      showToast('PDF generado exitosamente', 'success');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showToast('Error al descargar el PDF del informe', 'error');
    }
  };

  const handleLoadReport = (report) => {
    // Extract the weight from the observations column (fallback to '60kg')
    const extractedWeight = report.observations && report.observations.trim().length > 0 && !report.observations.includes('Generado')
      ? report.observations 
      : '60kg';

    setFormData({
      full_name: report.patient_name || '',
      ci: report.patient_ci || '',
      age: report.patient_age || '',
      weight: extractedWeight,
      phone: report.patient_phone || 'N/A',
      address: report.address || 'No especificada',
      occupation: report.occupation || 'No especificada',
      reason_for_visit: report.reason_for_visit || 'Consulta Médica Ginecológica',
      admin_physical_exam: report.physical_exam || 'Evaluación ginecológica y física general de rutina dentro de los límites normales.',
      admin_ultrasound: report.ultrasound || 'Útero en anteversión de dimensiones y ecoestructura conservada. Endometrio trilaminar, homogéneo, de espesor normal para fase del ciclo. Ovarios de características ecográficas normales.',
      admin_diagnosis: report.diagnosis || '1. Control Ginecológico de rutina.',
      admin_plan: report.plan || '1. Mantener control ginecológico anual.\n2. Hábitos de vida saludables y control ginecológico periódico.',
      admin_observations: report.observations || extractedWeight,
      medical_report_content: report.medical_report_content || ''
    });
    setSavedConsultationId(report.id);
    setReportDate(report.created_at ? report.created_at.split('T')[0] : new Date().toISOString().split('T')[0]);
    setCurrentStep(STEPS.COMPLETED);
    showToast(`Informe de ${report.patient_name} cargado con éxito.`, 'success');
  };

  const handleReset = () => {
    setCurrentStep(STEPS.WELCOME);
    setSavedConsultationId(null);
    setFormData({
      full_name: '',
      ci: '',
      age: '',
      weight: '60kg',
      phone: 'N/A',
      address: 'No especificada',
      occupation: 'No especificada',
      reason_for_visit: 'Consulta Médica Ginecológica',
      admin_physical_exam: 'Evaluación ginecológica y física general de rutina dentro de los límites normales.',
      admin_ultrasound: 'Útero en anteversión de dimensiones y ecoestructura conservada. Endometrio trilaminar, homogéneo, de espesor normal para fase del ciclo. Ovarios de características ecográficas normales.',
      admin_diagnosis: '1. Control Ginecológico de rutina.',
      admin_plan: '1. Mantener control ginecológico anual.\n2. Hábitos de vida saludables y control ginecológico periódico.',
      admin_observations: '60kg',
      medical_report_content: ''
    });
    const docName = doctor?.nombre_completo || 'Doctor(a)';
    setMessages([
      {
        id: Date.now(),
        sender: 'bot',
        text: `¡Hola! Soy tu Asistente Inteligente de GynSys. Te guiaré paso a paso para recopilar la información clínica básica y generar un hermoso Informe Médico totalmente editable.<br/><br/><strong>Comencemos: ¿Cuál es el nombre y apellido completo de la paciente?</strong>`
      }
    ]);
    setCurrentStep(STEPS.NAME);
  };

  // Get PDF config header elements
  const pdfConfig = doctor?.pdf_config || {};
  const docSpecialty = pdfConfig.specialty || doctor?.especialidad || 'Especialista en Ginecología y Obstetricia';
  const docPhones = pdfConfig.phones || '04244281876-04127738918';
  const docLocation = pdfConfig.location || 'Caracas-Guarenas Guatire';
  const mpps = pdfConfig.mpps_number || '140.795';
  const cmdm = pdfConfig.cmdm_number || '38.789';
  const docCi = pdfConfig.doctor_id || '23.812.988';
  const footerCity = pdfConfig.footer_city || 'Guarenas';

  return (
    <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 py-8">
      {/* Title */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-4 sm:px-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <FiFileText className="text-blue-500" /> Editor de Informes Médicos
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 font-medium">
            Conversa con la IA, completa los datos de la paciente y personaliza tu PDF de forma interactiva.
          </p>
        </div>
        
        {currentStep === STEPS.COMPLETED && (
          <button
            onClick={handleReset}
            className="flex items-center gap-2 text-xs font-black uppercase bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 px-4 py-2.5 rounded-xl transition-all"
          >
            <FiFilePlus /> Nuevo Informe
          </button>
        )}
      </div>

      {currentStep !== STEPS.COMPLETED ? (
        /* ================= CHATBOT COLLECTOR FLOW ================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-6xl mx-auto">
          {/* LEFT: Solid flat background chatbot */}
          <div className="lg:col-span-8 bg-white dark:bg-gray-800 rounded-none sm:rounded-[32px] border-y sm:border border-gray-100 dark:border-gray-700 shadow-xl overflow-hidden flex flex-col h-[600px] transition-all">
            {/* Chat Header (Solid flat primaryColor - no gradient!) */}
            <div 
              style={{ backgroundColor: primaryColor || '#4F46E5' }} 
              className="p-6 text-white flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg border border-white/10">
                  🤖
                </div>
                <div>
                  <h3 className="font-black text-sm tracking-widest uppercase">Asistente Virtual GynSys</h3>
                  <p className="text-[10px] text-blue-100 font-medium">Recopilando datos para el informe médico</p>
                </div>
              </div>
              <button
                onClick={handleSkipAssistant}
                className="text-[10px] font-black uppercase bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-1.5 rounded-lg transition-all"
              >
                Saltar Asistente
              </button>
            </div>

            {/* Chat Message Box */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 dark:bg-gray-900/50">
              {messages.map((msg) => (
                <div 
                  key={msg.id}
                  className={`flex items-end gap-2 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                >
                  {msg.sender === 'bot' && (
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      🩺
                    </div>
                  )}
                  <div 
                    className={`p-4 rounded-[20px] text-sm shadow-sm leading-relaxed ${
                      msg.sender === 'user' 
                        ? 'bg-blue-600 text-white rounded-br-none' 
                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-none border border-gray-100 dark:border-gray-700'
                    }`}
                    dangerouslySetInnerHTML={{ __html: msg.text }}
                  />
                </div>
              ))}
              
              {loading && (
                <div className="flex items-end gap-2 max-w-[80%]">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center font-bold text-xs flex-shrink-0 animate-pulse">
                    🩺
                  </div>
                  <div className="p-4 rounded-[20px] rounded-bl-none bg-white dark:bg-gray-800 text-gray-400 border border-gray-100 dark:border-gray-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex gap-2">
              <input
                ref={chatInputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Escribe la respuesta aquí..."
                className="flex-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full px-5 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all shadow-sm"
                autoFocus
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || loading}
                className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-full flex items-center justify-center shadow-md transition-all active:scale-95 flex-shrink-0"
              >
                <FiSend size={18} />
              </button>
            </form>
          </div>

          {/* RIGHT: Retrieval panel (recent reports history list) */}
          <div className="lg:col-span-4 bg-white dark:bg-gray-800 p-6 rounded-[32px] border border-gray-100 dark:border-gray-700 shadow-xl h-[600px] flex flex-col">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
              <FiClock className="text-blue-500" /> Historial de Informes
            </h3>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {loadingHistory ? (
                <div className="py-12 flex justify-center">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : recentReports.length === 0 ? (
                <p className="text-xs text-slate-400 py-12 text-center font-medium">No se encontraron informes guardados.</p>
              ) : (
                recentReports.map(report => (
                  <div 
                    key={report.id}
                    className="p-3 bg-slate-50 hover:bg-slate-100 dark:bg-gray-700/50 dark:hover:bg-gray-700 rounded-xl border border-slate-100 dark:border-gray-600/50 transition-all flex flex-col justify-between gap-2 shadow-sm"
                  >
                    <div>
                      <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">{report.patient_name || 'Sin nombre'}</p>
                      <p className="text-[9px] text-slate-400 font-bold mt-0.5">CI: V-{formatCi(report.patient_ci) || 'N/A'}</p>
                      <p className="text-[9px] text-slate-400 font-semibold">{report.created_at ? new Date(report.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}</p>
                    </div>
                    <button
                      onClick={() => handleLoadReport(report)}
                      className="w-full text-center py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-[9px] uppercase tracking-wider rounded-lg transition-all"
                    >
                      Cargar / Editar
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ================= PREMIUM EDITABLE LAYOUT ================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: Live Form Editor (45% column width on large screens) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Action Bar */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">Acciones del Informe</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleSaveToGynSys}
                  disabled={saving}
                  className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white py-3 px-4 rounded-xl text-xs font-black uppercase transition-all"
                >
                  <FiSave size={16} />
                  {saving ? 'Guardando...' : 'Guardar en GynSys'}
                </button>
                
                <button
                  onClick={handleDownloadPdf}
                  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl text-xs font-black uppercase transition-all shadow-md shadow-blue-100 dark:shadow-none"
                >
                  <FiDownload size={16} /> Descargar PDF
                </button>
              </div>

              {/* Styling parameters (Matching standard history exactly!) */}
              <div className="border-t border-gray-100 dark:border-gray-700 pt-4 space-y-3">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-black text-gray-400 dark:text-gray-300 uppercase tracking-wider">Fecha de Emisión</span>
                  <input
                    type="date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    className="w-full text-xs font-bold bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-gray-700 dark:text-white"
                  />
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-xs font-bold text-gray-600 dark:text-gray-300">PDF a color</span>
                  <label className="relative inline-flex inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={includeColor} 
                      onChange={(e) => setIncludeColor(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Marca de Agua</span>
                  <label className="relative inline-flex inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={includeWatermark} 
                      onChange={(e) => setIncludeWatermark(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Retrieval panel in Edit Mode */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <FiClock className="text-blue-500" /> Cargar Otro Informe Reciente
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1">
                {recentReports.map(report => (
                  <button
                    key={report.id}
                    onClick={() => handleLoadReport(report)}
                    className="p-2 text-left bg-slate-50 hover:bg-slate-100 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg text-[9px] font-bold border border-slate-100 dark:border-gray-600/50 truncate flex justify-between items-center transition-all"
                  >
                    <span className="truncate mr-2">{report.patient_name}</span>
                    <span className="text-blue-500 flex-shrink-0">Cargar</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Editable Fields Form */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-700 pb-2">Datos Clínicos del Reporte</h3>
              
              {/* Patient Details Row */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Nombre de la Paciente</label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleFieldChange}
                    className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Edad</label>
                  <input
                    type="text"
                    name="age"
                    value={formData.age}
                    onChange={handleFieldChange}
                    className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Peso</label>
                  <input
                    type="text"
                    name="weight"
                    value={formData.weight}
                    onChange={handleFieldChange}
                    className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-sm font-medium"
                  />
                </div>
                <div className="sm:col-span-4">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Cédula de Identidad</label>
                  <input
                    type="text"
                    name="ci"
                    value={formData.ci}
                    onChange={handleFieldChange}
                    className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-sm font-medium"
                  />
                </div>
              </div>

              {/* Clinical Description sections */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Motivo / Síntesis Clínica</label>
                  <textarea
                    name="reason_for_visit"
                    rows="2"
                    value={formData.reason_for_visit}
                    onChange={handleFieldChange}
                    className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Examen Físico</label>
                  <textarea
                    name="admin_physical_exam"
                    rows="2"
                    value={formData.admin_physical_exam}
                    onChange={handleFieldChange}
                    className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Hallazgos Ecográficos</label>
                  <textarea
                    name="admin_ultrasound"
                    rows="3"
                    value={formData.admin_ultrasound}
                    onChange={handleFieldChange}
                    className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Diagnósticos</label>
                  <textarea
                    name="admin_diagnosis"
                    rows="3"
                    value={formData.admin_diagnosis}
                    onChange={handleFieldChange}
                    className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Plan Terapéutico / Tratamiento</label>
                  <textarea
                    name="admin_plan"
                    rows="3"
                    value={formData.admin_plan}
                    onChange={handleFieldChange}
                    className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-sm font-mono"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* RIGHT: Letter printable virtual paper (75% column width) */}
          <div className="lg:col-span-7 flex justify-center">
            <div className="w-full max-w-[800px] aspect-[1/1.4] bg-white border border-slate-200 shadow-2xl text-slate-900 p-8 sm:p-12 flex flex-col justify-between font-sans leading-relaxed select-none overflow-hidden relative">
              
              {/* Optional watermarked background */}
              {includeWatermark && (
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none select-none">
                  <img src="/GynSys.png" alt="Watermark" className="w-[50%] h-auto object-contain rotate-12" />
                </div>
              )}

              {/* REPORT STRUCTURE WRAPPER */}
              <div className="space-y-6">
                
                {/* 1. Header (Branding block) */}
                <div className="flex justify-between items-start border-b pb-4 border-slate-100">
                  <div className="flex items-center gap-4">
                    {pdfConfig.logo_header_1 ? (
                      <img src={getImageUrl(pdfConfig.logo_header_1)} alt="Logo" className="w-16 h-16 object-contain" />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-blue-50 flex items-center justify-center font-bold text-blue-600 text-xl border border-blue-100">
                        🩺
                      </div>
                    )}
                    <div>
                      <h2 className="font-extrabold text-sm text-slate-900" style={includeColor ? { color: primaryColor } : {}}>
                        {pdfConfig.doctor_name || doctor?.nombre_completo || 'Dra. Mariel Herrera'}
                      </h2>
                      <p className="text-[10px] text-slate-500 font-bold max-w-xs">{docSpecialty}</p>
                      <p className="text-[9px] text-slate-400 mt-1">{docLocation}</p>
                      <p className="text-[9px] text-slate-400">Telfs: {docPhones}</p>
                    </div>
                  </div>
                  
                  {pdfConfig.logo_header_2 && (
                    <img src={getImageUrl(pdfConfig.logo_header_2)} alt="QR Code" className="w-16 h-16 object-contain" />
                  )}
                </div>

                {/* 2. Document Title */}
                <div className="text-center py-2">
                  <h3 className="font-black text-xs uppercase tracking-widest text-slate-800 border-b border-slate-800 inline-block px-4 pb-0.5">
                    {pdfConfig.report_title || 'INFORME MÉDICO'}
                  </h3>
                </div>

                {/* 3. Patient Details Card - MATCHING MODEL IN ALL-BLACK TEXT */}
                <div className="border-b-2 pb-3 border-slate-800 text-[10px] text-slate-950 grid grid-cols-2 sm:grid-cols-4 gap-y-2 gap-x-6 font-sans">
                  <div>
                    <span className="font-extrabold text-slate-950 uppercase text-[9px]">Nombre y Apellidos:</span> <span className="text-slate-950 font-medium block sm:inline">{formData.full_name || 'Kelyn Rosal'}</span>
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-950 uppercase text-[9px]">Edad:</span> <span className="text-slate-950 font-medium block sm:inline">{formData.age ? `${formData.age} años` : '35 años'}</span>
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-950 uppercase text-[9px]">CI:</span> <span className="text-slate-950 font-medium block sm:inline">V-{formatCi(formData.ci) || '19.397.706'}</span>
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-950 uppercase text-[9px]">Fecha:</span> <span className="text-slate-950 font-medium block sm:inline">
                      {new Date(reportDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="col-span-2 sm:col-span-4">
                    <span className="font-extrabold text-slate-950 uppercase text-[9px]">Peso:</span> <span className="text-slate-950 font-medium">{formData.weight || '60kg'}</span>
                  </div>
                </div>

                {/* 4. Main Medical Text (Unified view) */}
                <div className="text-[10px] text-slate-950 space-y-4 leading-relaxed font-serif text-justify px-1 pr-2 max-h-[300px] overflow-y-auto pr-2">
                  
                  {/* Párrafo Narrativo Clínico */}
                  <p>
                    Se trata de paciente de <strong>{formData.age ? `${formData.age} años` : '35 años'}</strong> de edad, peso: <strong>{formData.weight || '60kg'}</strong>,
                    quien acude a consulta por presentar sintomatología clínica consistente en: {formData.reason_for_visit.toLowerCase() || 'evaluación médica rutinaria'}.
                    Se realiza exploración física detallada y ultrasonido ginecológico constatando los siguientes hallazgos:
                  </p>
                  
                  <p>
                    <strong>Examen Físico:</strong> {formData.admin_physical_exam}
                  </p>

                  {/* Ecografía Section */}
                  {formData.admin_ultrasound && (
                    <div className="space-y-1 mt-3">
                      <p className="font-extrabold text-slate-950 uppercase text-[9px] underline">
                        ECOGRAFÍA GINECOLÓGICA:
                      </p>
                      <p className="text-slate-950 pl-1">{formData.admin_ultrasound}</p>
                    </div>
                  )}

                  {/* Diagnosis Section */}
                  {formData.admin_diagnosis && (
                    <div className="space-y-1 mt-3">
                      <p className="font-extrabold text-slate-950 uppercase text-[9px] underline">
                        DIAGNÓSTICOS:
                      </p>
                      <div className="whitespace-pre-line text-slate-950 pl-1 font-serif">
                        {formData.admin_diagnosis}
                      </div>
                    </div>
                  )}

                  {/* Plan Section */}
                  {formData.admin_plan && (
                    <div className="space-y-1 mt-3">
                      <p className="font-extrabold text-slate-950 uppercase text-[9px] underline">
                        PLAN TERAPEUTICO:
                      </p>
                      <div className="whitespace-pre-line text-slate-950 pl-1 font-serif">
                        {formData.admin_plan}
                      </div>
                    </div>
                  )}

                </div>

              </div>

              {/* 5. Printable Footer & Signature block */}
              <div className="space-y-4 border-t pt-4 border-slate-100">
                <div className="flex flex-col items-center text-center">
                  
                  {/* Digital Signature Image */}
                  {pdfConfig.logo_signature ? (
                    <img src={getImageUrl(pdfConfig.logo_signature)} alt="Firma del Médico" className="h-10 object-contain mb-1" />
                  ) : (
                    <div className="h-10 w-24 border-b border-dashed border-slate-300 mb-1"></div>
                  )}
                  
                  <p className="font-extrabold text-[9px] text-slate-900">
                    {pdfConfig.doctor_name || doctor?.nombre_completo || 'Dra. Mariel Herrera'}
                  </p>
                  <p className="text-[7.5px] text-slate-500 font-bold uppercase tracking-tight">Ginecólogo Obstetra</p>
                  <p className="text-[7px] text-slate-400 mt-0.5">
                    CI: {docCi} &nbsp;|&nbsp; MPPS: {mpps} &nbsp;|&nbsp; CMDM: {cmdm}
                  </p>
                </div>
                
                {/* Print location and page index */}
                <div className="flex justify-between items-center text-[7px] text-slate-400 px-1">
                  <span>{footerCity}, {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</span>
                  <span className="font-bold tracking-widest text-[7.5px]" style={includeColor ? { color: primaryColor } : {}}>www.gynsys.net</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
