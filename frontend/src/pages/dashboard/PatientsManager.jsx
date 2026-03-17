import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/axios';
import { toast } from 'react-hot-toast';
import { useToastStore } from '../../store/toastStore';
import Modal from '../../components/common/Modal';
import { FiTrash2, FiFileText, FiUser, FiCalendar, FiEdit, FiSearch, FiImage, FiDownload } from 'react-icons/fi';
import { ConsultationAssetManager } from '../../components/common/ConsultationAssetManager';
import { openExternalFile, downloadFile, isCapacitor } from '../../utils/platform';

const EditableField = ({ value, onSave, label, multiline = true }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  const handleSave = () => {
    if (currentValue !== value) {
      onSave(currentValue);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setCurrentValue(value);
      setIsEditing(false);
    }
    if (e.key === 'Enter' && !multiline && !e.shiftKey) {
      handleSave();
    }
  };

  if (isEditing) {
    return (
      <div className="animate-in slide-in-from-top-1 duration-200">
        <textarea
          autoFocus
          className="w-full p-2 text-sm border-2 border-indigo-500 rounded-lg outline-none bg-white dark:bg-gray-800 dark:text-gray-100 shadow-sm font-medium"
          value={currentValue || ''}
          onChange={(e) => setCurrentValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          rows={multiline ? 4 : 1}
          placeholder={`Escriba el ${label?.toLowerCase() || ''}...`}
        />
        <div className="flex gap-2 justify-end mt-1">
          <button onClick={handleSave} className="text-[9px] font-black text-indigo-600 hover:text-indigo-800 uppercase">Aceptar</button>
        </div>
      </div>
    );
  }

  return (
    <div 
      onDoubleClick={() => setIsEditing(true)}
      className="group relative cursor-text hover:bg-yellow-50/50 dark:hover:bg-indigo-900/20 p-1 -m-1 rounded-md transition-all border border-transparent hover:border-yellow-200/50"
    >
      <p className={`text-[11pt] leading-relaxed ${multiline ? 'whitespace-pre-line' : ''} ${!value ? 'italic text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-200'}`}>
        {value || `(No reportado)`}
      </p>
      <FiEdit className="absolute -right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-indigo-400 transition-all pointer-events-none" size={10} />
    </div>
  );
};

const HistoryHtmlView = ({ data, onUpdateField }) => {
  if (!data) return null;

  const consultations = data.is_single_report
    ? [{
      id: data.id,
      created_at: data.created_at,
      diagnosis: data.diagnosis,
      plan: data.plan,
      physical_exam: data.physical_exam,
      ultrasound: data.ultrasound,
      observations: data.observations
    }]
    : (data.all_consultations || []).slice().reverse();

  return (
    <div className="bg-gray-100 dark:bg-gray-950 p-2 md:p-8 min-h-full overflow-y-auto max-h-[75vh] custom-scrollbar">
      {/* Contenedor tipo Hoja de Papel */}
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 shadow-[0_0_50px_rgba(0,0,0,0.1)] dark:shadow-none border border-gray-200 dark:border-gray-800 min-h-[1056px] p-[0.75in] font-serif text-[12pt] leading-[1.4] text-gray-900 dark:text-gray-100 flex flex-col">
        
        {/* Encabezado Institucional (Replica PDF) */}
        <div className="flex justify-between items-center border-b-2 border-gray-900 dark:border-gray-100 pb-4 mb-6">
          <div className="w-[1.5in] flex flex-col items-center">
             {/* Logo Placeholder - Espacio reservado para el logo oficial */}
             <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center border border-indigo-100 dark:border-indigo-800">
               <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">GS</span>
             </div>
          </div>
          <div className="flex-1 pl-[0.25in] text-left">
            <h1 className="text-xl font-black uppercase text-gray-900 dark:text-white leading-tight">Dra. Mariel Herrera</h1>
            <p className="text-[10pt] font-medium text-gray-600 dark:text-gray-400">Especialista en Ginecología y Obstetricia</p>
            <p className="text-[10pt] text-gray-500 dark:text-gray-500 italic">Caracas-Guarenas Guatire</p>
            <p className="text-[10pt] font-bold text-gray-700 dark:text-gray-300 mt-1">Citas: 04244281876-04127738918</p>
          </div>
        </div>

        {/* Título del Documento */}
        <div className="text-center mb-8">
           <h2 className="text-xl font-black border-b-2 border-black dark:border-white inline-block px-4 pb-0.5 uppercase tracking-tighter">
             {data.is_single_report ? 'INFORME MÉDICO' : 'HISTORIA MÉDICA'}
           </h2>
        </div>

        {/* Tabla de Datos del Paciente (Estilo PDF) */}
        <div className="grid grid-cols-2 border-b border-gray-300 dark:border-gray-700 pb-4 mb-6 gap-y-2 text-[11pt]">
          <div className="flex gap-2">
            <span className="font-bold min-w-[80px]">Nombre:</span>
            <div className="flex-1"><EditableField value={data.full_name} onSave={(val) => onUpdateField(data.id, 'full_name', val)} multiline={false} /></div>
          </div>
          <div className="flex gap-2 justify-end">
            <span className="font-bold min-w-[50px]">Edad:</span>
            <div className="w-20"><EditableField value={data.age?.toString()} onSave={(val) => onUpdateField(data.id, 'age', val)} multiline={false} /></div>
          </div>
          <div className="flex gap-2">
            <span className="font-bold min-w-[80px]">C.I.:</span>
            <div className="flex-1"><EditableField value={data.ci} onSave={(val) => onUpdateField(data.id, 'ci', val)} multiline={false} /></div>
          </div>
          <div className="flex gap-2 justify-end">
            <span className="font-bold min-w-[50px]">TLF:</span>
            <div className="w-40"><EditableField value={data.phone} onSave={(val) => onUpdateField(data.id, 'phone', val)} multiline={false} /></div>
          </div>
          <div className="flex gap-2 col-span-2 border-t border-gray-100 dark:border-gray-800 pt-2 mt-1">
            <span className="font-bold min-w-[80px]">N° Historia:</span>
            <span className="font-black text-indigo-600 dark:text-indigo-400">{data.history_number}</span>
          </div>
        </div>

        {/* Cuerpo del Informe / Historia */}
        <div className="space-y-6 flex-1">
          {/* Secciones Base (Motivo y Antecedentes) */}
          <div className="space-y-4">
            <section className="flex items-start gap-4 group">
               <span className="font-black text-[10pt] uppercase min-w-[1.8in] pt-1">Motivo de consulta:</span>
               <div className="flex-1"><EditableField value={data.reason_for_visit} onSave={(val) => onUpdateField(data.id, 'reason_for_visit', val)} /></div>
            </section>

            <section className="flex items-start gap-4">
               <span className="font-black text-[10pt] uppercase min-w-[1.8in] pt-1">Antecedentes Familiares:</span>
               <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                  <EditableField label="Madre" value={data.family_history_mother} onSave={(val) => onUpdateField(data.id, 'family_history_mother', val)} />
                  <EditableField label="Padre" value={data.family_history_father} onSave={(val) => onUpdateField(data.id, 'family_history_father', val)} />
               </div>
            </section>

            <section className="flex items-start gap-4">
               <span className="font-black text-[10pt] uppercase min-w-[1.8in] pt-1">Antecedentes Personales:</span>
               <div className="flex-1"><EditableField value={data.personal_history} onSave={(val) => onUpdateField(data.id, 'personal_history', val)} /></div>
            </section>

            <section className="flex items-start gap-4">
               <span className="font-black text-[10pt] uppercase min-w-[1.8in] pt-1">Antecedentes Quirúrgicos:</span>
               <div className="flex-1"><EditableField value={data.surgical_history} onSave={(val) => onUpdateField(data.id, 'surgical_history', val)} /></div>
            </section>

            <section className="flex items-start gap-4">
               <span className="font-black text-[10pt] uppercase min-w-[1.8in] pt-1">Gineco-Obstétricos:</span>
               <div className="flex-1"><EditableField value={data.summary_gyn_obstetric} onSave={(val) => onUpdateField(data.id, 'summary_gyn_obstetric', val)} /></div>
            </section>
          </div>

          {/* Separador para Consultas */}
          {consultations.length > 0 && (
            <div className="mt-8 border-t-2 border-gray-100 dark:border-gray-800 pt-6">
              <h3 className="bg-gray-100 dark:bg-gray-800 px-4 py-2 font-black text-sm uppercase tracking-widest text-gray-700 dark:text-gray-300 mb-6 rounded-lg">
                Registro de Consultas Médicas
              </h3>
              
              <div className="space-y-12">
                {consultations.map((c, idx) => (
                  <article key={idx} className="border-l-4 border-indigo-500 pl-6 space-y-4">
                    <header className="flex justify-between items-center mb-2">
                      <span className="font-black text-gray-900 dark:text-white uppercase text-base">
                        Consulta #{consultations.length - idx}
                      </span>
                      <span className="text-sm font-bold text-indigo-600 italic">
                        {new Date(c.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </span>
                    </header>

                    <div className="space-y-4">
                      <section className="flex items-start gap-4">
                        <span className="font-black text-[9pt] uppercase min-w-[1.5in] pt-1 text-gray-500">Examen Físico:</span>
                        <div className="flex-1 font-medium"><EditableField value={c.physical_exam} onSave={(val) => onUpdateField(c.id, 'physical_exam', val)} /></div>
                      </section>
                      <section className="flex items-start gap-4">
                        <span className="font-black text-[9pt] uppercase min-w-[1.5in] pt-1 text-gray-500">Ultrasonido:</span>
                        <div className="flex-1 font-medium"><EditableField value={c.ultrasound} onSave={(val) => onUpdateField(c.id, 'ultrasound', val)} /></div>
                      </section>
                      <section className="flex items-start gap-4">
                        <span className="font-black text-[9pt] uppercase min-w-[1.5in] pt-1 text-gray-500">Diagnóstico:</span>
                        <div className="flex-1 font-medium"><EditableField value={c.diagnosis} onSave={(val) => onUpdateField(c.id, 'diagnosis', val)} /></div>
                      </section>
                      <section className="flex items-start gap-4">
                        <span className="font-black text-[9pt] uppercase min-w-[1.5in] pt-1 text-gray-500">Plan de Tratamiento:</span>
                        <div className="flex-1 font-medium"><EditableField value={c.plan} onSave={(val) => onUpdateField(c.id, 'plan', val)} /></div>
                      </section>
                      <section className="flex items-start gap-4">
                        <span className="font-black text-[9pt] uppercase min-w-[1.5in] pt-1 text-gray-500">Observaciones:</span>
                        <div className="flex-1 font-medium"><EditableField value={c.observations} onSave={(val) => onUpdateField(c.id, 'observations', val)} /></div>
                      </section>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Firma Placeholder (Si es Informe Único) */}
        {data.is_single_report && (
          <div className="mt-20 border-t border-gray-400 dark:border-gray-600 w-64 mx-auto text-center pt-2">
            <p className="font-black text-sm uppercase leading-tight">Dra. Mariel Herrera</p>
            <p className="text-[9pt] text-gray-500">Ginecólogo Obstetra - UCV</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default function PatientsManager({ isEmbedded = false }) {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';
  const navigate = useNavigate();
  const [consultations, setConsultations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Delete State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [consultationToDelete, setConsultationToDelete] = useState(null);

  // PDF Preview State
  const [isPdfModalOpen, setPdfModalOpen] = useState(false);
  const [currentPdfUrl, setCurrentPdfUrl] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activePdfTab, setActivePdfTab] = useState('pdf'); // 'pdf' or 'assets'
  const [currentConsultationId, setCurrentConsultationId] = useState(null);
  const [basePdfUrl, setBasePdfUrl] = useState(null);
  const [includeImages, setIncludeImages] = useState(false);
  const [isAssetOnly, setIsAssetOnly] = useState(false);
  const [currentPatientName, setCurrentPatientName] = useState('');

  // Edit State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [consultationToEdit, setConsultationToEdit] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  const { showToast } = useToastStore();

  // Función centralizada para cargar datos de la historia o reporte
  const loadHistoryData = async (consultationId, isHistory = false) => {
    if (!consultationId) return;
    setLoadingHistory(true);
    try {
      const dataEndpoint = isHistory ? 'history_data' : 'data';
      const response = await api.get(`/consultations/${consultationId}/${dataEndpoint}`);
      setHistoryData(response.data);
    } catch (error) {
      console.error("Error fetching history data:", error);
      showToast("Error al sincronizar datos", "error");
    } finally {
      setLoadingHistory(false);
    }
  };

  // Manejador de guardado inline (doble click)
  const handleInlineUpdate = async (consultationId, field, value) => {
    try {
      const fieldMap = {
        'summary_gyn_obstetric': 'obstetric_history_summary',
        'summary_functional_exam': 'functional_exam_summary',
        'summary_habits': 'habits_summary'
      };
      
      const dbField = fieldMap[field] || field;
      await api.put(`/consultations/${consultationId}`, { [dbField]: value });
      showToast('Guardado automáticamente', 'success');
      
      if (basePdfUrl) {
         const isHistory = basePdfUrl.includes('history_pdf');
         await loadHistoryData(consultationId, isHistory);
      }
      fetchConsultations();
    } catch (error) {
      showToast('Error al guardar cambio', 'error');
    }
  };

  useEffect(() => {
    fetchConsultations();
  }, []);

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/consultations/');
      const data = response.data;
      const grouped = {};
      data.forEach(consultation => {
        const ci = consultation.patient_ci;
        if (!grouped[ci] || new Date(consultation.created_at) > new Date(grouped[ci].created_at)) {
          grouped[ci] = consultation;
        }
      });
      setConsultations(Object.values(grouped));
    } catch (error) {
      console.error('Error fetching consultations:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPlanWithBullets = (planText) => {
    if (!planText) return '';
    return planText.split('\n').map(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('•')) {
        return '• ' + trimmed;
      }
      return trimmed;
    }).join('\n');
  };

  const handleEditClick = (consultation) => {
    setConsultationToEdit(consultation);
    setEditFormData({
      full_name: consultation.patient_name,
      ci: consultation.patient_ci,
      age: consultation.patient_age,
      phone: consultation.patient_phone,
      address: consultation.address || '',
      occupation: consultation.occupation || '',
      reason_for_visit: consultation.reason_for_visit,
      family_history_mother: consultation.family_history_mother,
      family_history_father: consultation.family_history_father,
      personal_history: consultation.personal_history,
      supplements: consultation.supplements,
      surgical_history: consultation.surgical_history,
      summary_gyn_obstetric: consultation.obstetric_history_summary || '',
      summary_functional_exam: consultation.functional_exam_summary || '',
      summary_habits: consultation.habits_summary || '',
      admin_physical_exam: consultation.physical_exam || '',
      admin_ultrasound: consultation.ultrasound || '',
      admin_diagnosis: formatPlanWithBullets(consultation.diagnosis || ''),
      admin_plan: formatPlanWithBullets(consultation.plan || ''),
      admin_observations: consultation.observations || '',
      history_number: consultation.history_number
    });
    setEditModalOpen(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const addBullet = (fieldName) => {
    setEditFormData(prev => ({
      ...prev,
      [fieldName]: (prev[fieldName] || '') + '\n• '
    }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!consultationToEdit) return;
    try {
      const response = await api.put(`/consultations/${consultationToEdit.id}`, editFormData);
      showToast('Historia actualizada exitosamente', 'success');
      fetchConsultations();
      setEditModalOpen(false);
    } catch (error) {
      showToast('Error al actualizar la historia', 'error');
    }
  };

  const handleDeleteClick = (id) => {
    setConsultationToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!consultationToDelete) return;
    try {
      await api.delete(`/consultations/${consultationToDelete}`);
      showToast('Consulta eliminada exitosamente', 'success');
      setConsultations(prev => prev.filter(c => c.id !== consultationToDelete));
    } catch (error) {
      showToast('Error al eliminar la consulta', 'error');
    } finally {
      setDeleteModalOpen(false);
      setConsultationToDelete(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-VE', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const handleViewPdf = (url) => {
    setIsAssetOnly(false); // Reset to PDF mode
    setBasePdfUrl(url);
    setCurrentPatientName(''); 
    setHistoryData(null);
    setActivePdfTab('pdf'); // Modal siempre abre en PDF por defecto
    
    // Extraer ID inmediatamente para evitar ruidos en AssetManager
    const match = url.match(/\/consultations\/(\d+)\//);
    if (match) setCurrentConsultationId(match[1]);
    
    setPdfModalOpen(true);
  };

  const handleViewAssets = (consultationId, patientName) => {
    setIsAssetOnly(true);
    setBasePdfUrl(null);
    setCurrentConsultationId(consultationId);
    setCurrentPatientName(patientName || '');
    setActivePdfTab('assets');
    setHistoryData(null);
    setPdfModalOpen(true);
  };

  // Helper function to get the actual PDF URL with current parameters
  const getFullPdfUrl = (isDownload = false) => {
    if (!basePdfUrl) return null;
    let url = basePdfUrl;
    const params = new URLSearchParams();
    if (includeImages) params.append('include_images', 'true');
    if (isDownload) params.append('download', 'true');
    
    const queryString = params.toString();
    return queryString ? `${url}${url.includes('?') ? '&' : '?'}${queryString}` : url;
  };

  // Effect to fetch history data when modal opens or basePdfUrl/activePdfTab changes
  useEffect(() => {
    if (!isPdfModalOpen || activePdfTab === 'assets' || !basePdfUrl) return;

    const match = basePdfUrl.match(/\/consultations\/(\d+)\//);
    const consultationId = match ? match[1] : null;
    
    if (consultationId) {
      if (historyData?.id === parseInt(consultationId) && !loadingHistory) return;
      
      setCurrentConsultationId(consultationId);
      const isHistory = basePdfUrl.includes('history_pdf');
      loadHistoryData(consultationId, isHistory);
    }
  }, [isPdfModalOpen, basePdfUrl, activePdfTab]);


  const filteredConsultations = consultations.filter(consultation =>
    consultation.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    consultation.patient_ci?.includes(searchTerm)
  );

  return (
    <div className={isEmbedded ? "py-4" : "max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 py-8"}>
      {!isEmbedded && (
        <div className="mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left px-4 sm:px-0">
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white">Gestión de Historias Médicas</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400 font-medium">Administra las consultas y reportes generados.</p>
          </div>
          <div className="relative w-full md:w-80 px-4 sm:px-0">
            <div className="absolute inset-y-0 left-0 pl-8 md:pl-4 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por nombre o CI..."
              className="block w-full pl-12 pr-4 py-3 border-2 border-gray-100 dark:border-gray-700 rounded-2xl leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent md:text-sm text-gray-900 dark:text-white transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : filteredConsultations.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-none sm:rounded-[32px] shadow-sm p-12 md:p-20 text-center border-y border-x-0 sm:border-x border-gray-100 dark:border-gray-700">
          <FiUser className="mx-auto h-16 w-16 text-gray-200 dark:text-gray-700 mb-6" />
          <h3 className="text-xl font-black text-gray-900 dark:text-white">
            {searchTerm ? 'No se encontraron resultados' : 'No hay historias registradas'}
          </h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400 font-medium max-w-xs mx-auto">
            Las consultas guardadas aparecerán de forma organizada aquí.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Card View for Mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-2">
            {filteredConsultations.map((consultation) => (
              <div key={consultation.id} className="bg-white dark:bg-gray-800 rounded-none sm:rounded-[24px] border-y border-x-0 sm:border-x border-gray-100 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="h-12 w-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xl">
                      <FiUser />
                    </div>
                    <div className="ml-3">
                      <h4 className="font-black text-gray-900 dark:text-white leading-tight">{consultation.patient_name || 'Desconocido'}</h4>
                      <p className="text-xs font-bold text-gray-500 dark:text-gray-400">CI: {consultation.patient_ci || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="text-[10px] font-black bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    #{consultation.history_number || 'PEND'}
                  </div>
                </div>
                <div className="flex gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <button onClick={() => handleViewPdf(`${API_BASE}/consultations/${consultation.id}/history_pdf`)} className="flex-1 inline-flex justify-center items-center px-3 py-2.5 rounded-xl text-[10px] font-black bg-blue-50 text-blue-700 uppercase">
                    HISTORIA
                  </button>
                  <button onClick={() => handleViewPdf(`${API_BASE}/consultations/${consultation.id}/pdf`)} className="flex-1 inline-flex justify-center items-center px-3 py-2.5 rounded-xl text-[10px] font-black bg-green-50 text-green-700 uppercase">
                    INFORME
                  </button>
                  <button 
                    onClick={() => handleViewAssets(consultation.id, consultation.patient_name)} 
                    className="p-2.5 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"
                    title="Ver Soportes Digitales"
                  >
                    <FiImage size={18} />
                  </button>
                  <button onClick={() => handleEditClick(consultation)} className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                    <FiEdit size={18} />
                  </button>
                  <button onClick={() => handleDeleteClick(consultation.id)} className="p-2.5 bg-red-50 text-red-500 rounded-xl flex items-center justify-center">
                    <FiTrash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Table View for Desktop */}
          <div className="hidden lg:block bg-white dark:bg-gray-800 shadow-sm rounded-[32px] border border-gray-100 dark:border-gray-700 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
              <thead className="bg-gray-50/50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-300">Paciente</th>
                  <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-300">N° Historia</th>
                  <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-300">Fecha</th>
                  <th className="px-6 py-4 text-center text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-300">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredConsultations.map((consultation) => (
                  <tr key={consultation.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600"><FiUser /></div>
                        <div className="ml-4 font-black uppercase text-sm">{consultation.patient_name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{consultation.history_number}</td>
                    <td className="px-6 py-4 text-xs font-bold">{formatDate(consultation.created_at)}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex gap-2 justify-center">
                        <button onClick={() => handleViewPdf(`${API_BASE}/consultations/${consultation.id}/history_pdf`)} className="px-3 py-2 bg-blue-50 text-blue-700 rounded-xl text-[10px] font-black uppercase">HISTORIA</button>
                        <button onClick={() => handleViewPdf(`${API_BASE}/consultations/${consultation.id}/pdf`)} className="px-3 py-2 bg-green-50 text-green-700 rounded-xl text-[10px] font-black uppercase">INFORME</button>
                         <button 
                          onClick={() => handleViewAssets(consultation.id, consultation.patient_name)} 
                          className="p-2 text-blue-500 rounded-xl hover:bg-blue-50 transition-colors"
                          title="Ver Soportes Digitales"
                        >
                          <FiImage size={18} />
                        </button>
                        <button onClick={() => handleEditClick(consultation)} className="p-2 text-indigo-500 rounded-xl"><FiEdit /></button>
                        <button onClick={() => handleDeleteClick(consultation.id)} className="p-2 text-red-400 rounded-xl"><FiTrash2 /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal 
        isOpen={isPdfModalOpen} 
        onClose={() => { 
          setPdfModalOpen(false); 
          setHistoryData(null); 
          setActivePdfTab('pdf'); 
          setIsAssetOnly(false);
          setCurrentPatientName('');
        }} 
        title={isAssetOnly ? `Soportes Digitales de ${currentPatientName}` : "Gestión de Historia Clínica"} 
        size="full" 
        fullScreenOnMobile
      >
        <div className="flex flex-col h-[85vh]">
          {/* Barra de Herramientas Superior */}
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100 dark:border-gray-800 flex-wrap gap-4 px-2">
            <div className="flex items-center gap-2">
               <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-200">
                  <FiFileText size={20} />
               </div>
               <div>
                  <h3 className="font-black text-gray-900 dark:text-white leading-none">Visor Interactivo</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Edición & Gestión</p>
               </div>
            </div>

            <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 p-1 rounded-2xl border border-gray-100 dark:border-gray-700 mx-auto lg:mx-0">
                <button
                  onClick={() => setActivePdfTab('pdf')}
                  className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${
                    activePdfTab === 'pdf' 
                      ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm ring-1 ring-black/5' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  HISTORIA
                </button>
                <button
                  onClick={() => setActivePdfTab('assets')}
                  className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${
                    activePdfTab === 'assets' 
                      ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm ring-1 ring-black/5' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  SOPORTES
                </button>
            </div>

            {/* Checkbox Imágenes (Restaurado) */}
            {!isAssetOnly && activePdfTab === 'pdf' && (
              <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100/50 dark:border-indigo-800/50">
                <input 
                  type="checkbox" 
                  id="includeImages" 
                  checked={includeImages} 
                  onChange={(e) => setIncludeImages(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <label htmlFor="includeImages" className="text-[10px] font-black text-indigo-900 dark:text-indigo-300 uppercase tracking-widest cursor-pointer select-none">
                  Incluir Imágenes
                </label>
              </div>
            )}

            {!isAssetOnly && (
               <div className="flex items-center gap-4 ml-auto">
                  {basePdfUrl && (
                    <button 
                      onClick={() => isCapacitor() ? openExternalFile(getFullPdfUrl(true)) : downloadFile(getFullPdfUrl(true))} 
                      className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5"
                    >
                      <FiDownload />
                      <span className="hidden sm:inline">{isCapacitor() ? 'DESCARGAR OFICIAL' : 'DESCARGAR PDF'}</span>
                      <span className="sm:hidden">PDF</span>
                    </button>
                  )}
               </div>
            )}
          </div>

          {/* Contenido Principal */}
          <div className="flex-1 min-h-0">
            {activePdfTab === 'assets' ? (
              <div className="h-full bg-white dark:bg-gray-800 p-4 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-y-auto">
                {currentConsultationId && (
                  <ConsultationAssetManager consultationId={currentConsultationId} readOnly={false} />
                )}
              </div>
            ) : (
              <div className="h-full bg-gray-50/50 dark:bg-gray-900/50 rounded-3xl border border-indigo-100/30 dark:border-gray-800 overflow-hidden flex flex-col">
                 <div className="p-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur border-b border-indigo-50/50 dark:border-gray-800 flex justify-between items-center">
                    <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                      Edición en Vivo Activa (Doble clic cualquier texto)
                    </p>
                 </div>
                 <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar p-1">
                   {loadingHistory ? (
                     <div className="h-full flex flex-col items-center justify-center space-y-4">
                        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                        <p className="text-xs font-black text-indigo-400 uppercase tracking-widest">Sincronizando...</p>
                     </div>
                   ) : (
                     <HistoryHtmlView data={historyData} onUpdateField={handleInlineUpdate} />
                   )}
                 </div>
              </div>
            )}
          </div>
        </div>
      </Modal>


      {/* Edit Modal Refactored - Full Version */}
      <Modal 
        isOpen={editModalOpen} 
        onClose={() => setEditModalOpen(false)} 
        title="Editar Historia Clínica" 
        size="4xl"
        fullScreenOnMobile
      >
        <form onSubmit={handleUpdate} className="flex flex-col h-full max-h-[85vh]">
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8 scrollbar-thin scrollbar-thumb-indigo-200">
            
            {/* Sección: Datos de Identificación */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                Identificación del Paciente
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Nombre Completo</label>
                  <input name="full_name" value={editFormData.full_name || ''} onChange={handleEditChange} placeholder="Nombre completo" className="w-full p-3 bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-xl text-sm transition-all outline-none font-medium" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Cédula / ID</label>
                  <input name="ci" value={editFormData.ci || ''} onChange={handleEditChange} placeholder="CI" className="w-full p-3 bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-xl text-sm transition-all outline-none font-medium" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Número de Historia</label>
                  <input name="history_number" value={editFormData.history_number || ''} onChange={handleEditChange} placeholder="N° Historia" className="w-full p-3 bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-xl text-sm transition-all outline-none font-medium" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Edad</label>
                  <input name="age" value={editFormData.age || ''} onChange={handleEditChange} placeholder="Edad" className="w-full p-3 bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-xl text-sm transition-all outline-none font-medium" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Teléfono</label>
                  <input name="phone" value={editFormData.phone || ''} onChange={handleEditChange} placeholder="Teléfono" className="w-full p-3 bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-xl text-sm transition-all outline-none font-medium" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Ocupación</label>
                  <input name="occupation" value={editFormData.occupation || ''} onChange={handleEditChange} placeholder="Ocupación" className="w-full p-3 bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-xl text-sm transition-all outline-none font-medium" />
                </div>
                <div className="space-y-1 md:col-span-3">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Dirección</label>
                  <input name="address" value={editFormData.address || ''} onChange={handleEditChange} placeholder="Dirección de habitación" className="w-full p-3 bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-xl text-sm transition-all outline-none font-medium" />
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Sección: Antecedentes */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                Antecedentes Médicos
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Motivo de Consulta</label>
                  <textarea name="reason_for_visit" value={editFormData.reason_for_visit || ''} onChange={handleEditChange} rows="2" className="w-full p-3 bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-xl text-sm transition-all outline-none font-medium" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Antecedentes Familiares (Madre)</label>
                  <textarea name="family_history_mother" value={editFormData.family_history_mother || ''} onChange={handleEditChange} rows="2" className="w-full p-3 bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-xl text-sm transition-all outline-none font-medium" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Antecedentes Familiares (Padre)</label>
                  <textarea name="family_history_father" value={editFormData.family_history_father || ''} onChange={handleEditChange} rows="2" className="w-full p-3 bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-xl text-sm transition-all outline-none font-medium" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Antecedentes Personales</label>
                  <textarea name="personal_history" value={editFormData.personal_history || ''} onChange={handleEditChange} rows="2" className="w-full p-3 bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-xl text-sm transition-all outline-none font-medium" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Antecedentes Quirúrgicos</label>
                  <textarea name="surgical_history" value={editFormData.surgical_history || ''} onChange={handleEditChange} rows="2" className="w-full p-3 bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-xl text-sm transition-all outline-none font-medium" />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Suplementos / Medicamentos</label>
                  <textarea name="supplements" value={editFormData.supplements || ''} onChange={handleEditChange} rows="2" className="w-full p-3 bg-teal-50/30 border-2 border-transparent focus:border-teal-500 focus:bg-white rounded-xl text-sm transition-all outline-none font-medium" />
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Sección: Resúmenes de Sistemas */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-pink-600 uppercase tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 bg-pink-600 rounded-full"></div>
                Resúmenes de Sistemas
              </h3>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Resumen Gineco-Obstétrico</label>
                  <textarea name="summary_gyn_obstetric" value={editFormData.summary_gyn_obstetric || ''} onChange={handleEditChange} rows="3" className="w-full p-3 bg-pink-50/30 border-2 border-transparent focus:border-pink-500 focus:bg-white rounded-xl text-sm transition-all outline-none font-medium" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Resumen Examen Funcional</label>
                  <textarea name="summary_functional_exam" value={editFormData.summary_functional_exam || ''} onChange={handleEditChange} rows="2" className="w-full p-3 bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-xl text-sm transition-all outline-none font-medium" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Resumen de Hábitos</label>
                  <textarea name="summary_habits" value={editFormData.summary_habits || ''} onChange={handleEditChange} rows="2" className="w-full p-3 bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-xl text-sm transition-all outline-none font-medium" />
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Sección: Hallazgos Médicos */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-green-600 uppercase tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                Consulta Médica Actual
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Examen Físico</label>
                    <textarea name="admin_physical_exam" value={editFormData.admin_physical_exam || ''} onChange={handleEditChange} rows="4" className="w-full p-3 bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-xl text-sm transition-all outline-none font-medium" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Ultrasonido / Ecografía</label>
                    <textarea name="admin_ultrasound" value={editFormData.admin_ultrasound || ''} onChange={handleEditChange} rows="4" className="w-full p-3 bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-xl text-sm transition-all outline-none font-medium" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Diagnóstico Integrado</label>
                    <button type="button" onClick={() => addBullet('admin_diagnosis')} className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">+ AÑADIR PUNTO</button>
                  </div>
                  <textarea name="admin_diagnosis" value={editFormData.admin_diagnosis || ''} onChange={handleEditChange} rows="4" className="w-full p-3 bg-indigo-50/30 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-xl text-sm transition-all outline-none font-medium" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Plan de Tratamiento</label>
                    <button type="button" onClick={() => addBullet('admin_plan')} className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">+ AÑADIR PUNTO</button>
                  </div>
                  <textarea name="admin_plan" value={editFormData.admin_plan || ''} onChange={handleEditChange} rows="5" className="w-full p-3 bg-indigo-50/30 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-xl text-sm transition-all outline-none font-medium" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Observaciones Internas</label>
                  <textarea name="admin_observations" value={editFormData.admin_observations || ''} onChange={handleEditChange} rows="3" className="w-full p-3 bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-xl text-sm transition-all outline-none font-medium" />
                </div>
              </div>
            </div>

          </div>

          {/* Footer del Modal */}
          <div className="flex-shrink-0 p-6 bg-white border-t border-gray-100 flex items-center justify-between gap-4">
            <button 
              type="button" 
              onClick={() => setEditModalOpen(false)} 
              className="flex-1 md:flex-none px-6 py-3 border-2 border-gray-100 text-gray-500 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-gray-50 transition-all"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="flex-1 md:flex-none px-10 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </Modal>


      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Confirmar">
        <div className="p-4 text-center">
          <p>¿Seguro de eliminar?</p>
          <div className="mt-4 flex justify-center gap-4">
            <button onClick={() => setDeleteModalOpen(false)} className="px-4 py-2 border rounded">No</button>
            <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded">Sí, eliminar</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
