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
      <div className="space-y-1 animate-in fade-in duration-200">
        <div className="flex justify-between items-center mb-1">
          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter">{label}</p>
          <div className="flex gap-2">
            <button 
              type="button"
              onClick={() => { setCurrentValue(value); setIsEditing(false); }} 
              className="text-[10px] font-bold text-gray-400 hover:text-red-500 transition-colors"
            >
              CANCELAR
            </button>
            <button 
              type="button"
              onClick={handleSave} 
              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              GUARDAR
            </button>
          </div>
        </div>
        <textarea
          autoFocus
          className="w-full p-3 text-sm border-2 border-indigo-500 rounded-xl outline-none bg-white dark:bg-gray-800 dark:text-gray-100 shadow-inner font-medium ring-4 ring-indigo-50 dark:ring-indigo-900/20"
          value={currentValue || ''}
          onChange={(e) => setCurrentValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          rows={multiline ? 4 : 1}
          placeholder={`Escriba el ${label.toLowerCase()}...`}
        />
      </div>
    );
  }

  return (
    <div 
      onDoubleClick={() => setIsEditing(true)}
      className="group relative cursor-pointer hover:bg-indigo-50/40 dark:hover:bg-indigo-900/20 p-2 -m-2 rounded-xl transition-all border border-transparent hover:border-indigo-100/50 dark:hover:border-indigo-800/50"
    >
      <div className="flex justify-between items-start mb-1">
         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
         <FiEdit className="opacity-0 group-hover:opacity-100 text-indigo-400 transition-all transform scale-90 group-hover:scale-100" size={12} title="Doble clic para editar" />
      </div>
      <p className={`text-sm leading-relaxed ${multiline ? 'whitespace-pre-line' : ''} ${!value ? 'italic text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300 font-medium'}`}>
        {value || `Sin especificar ${label.toLowerCase()}`}
      </p>
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
    <div className="space-y-6 text-gray-800 dark:text-gray-200 p-1 md:p-4 overflow-y-auto max-h-[75vh] scrollbar-thin scrollbar-thumb-indigo-200 pr-3">
      
      {/* Información Demográfica (Editable) */}
      <div className="bg-gradient-to-br from-indigo-50/50 to-white dark:from-gray-800/50 dark:to-gray-800 p-5 rounded-3xl border border-indigo-100/50 dark:border-gray-700 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <FiUser size={80} className="text-indigo-600" />
        </div>
        
        <h4 className="text-lg font-black text-indigo-900 dark:text-white mb-4 flex items-center gap-2">
          {data.is_single_report ? 'Informe Médico' : 'Expediente del Paciente'}
          <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">GynSys</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          <EditableField 
            label="Nombre Completo" 
            value={data.full_name} 
            onSave={(val) => onUpdateField(data.id, 'full_name', val)}
            multiline={false}
          />
          <EditableField 
            label="Identificación (CI)" 
            value={data.ci} 
            onSave={(val) => onUpdateField(data.id, 'ci', val)}
            multiline={false}
          />
          <EditableField 
            label="Edad" 
            value={data.age?.toString()} 
            onSave={(val) => onUpdateField(data.id, 'age', val)}
            multiline={false}
          />
          <EditableField 
            label="Teléfono" 
            value={data.phone} 
            onSave={(val) => onUpdateField(data.id, 'phone', val)}
            multiline={false}
          />
          <div className="md:col-span-2">
            <EditableField 
              label="Dirección" 
              value={data.address} 
              onSave={(val) => onUpdateField(data.id, 'address', val)}
              multiline={false}
            />
          </div>
          <EditableField 
            label="Ocupación" 
            value={data.occupation} 
            onSave={(val) => onUpdateField(data.id, 'occupation', val)}
            multiline={false}
          />
          <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600">
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider">Número de Historia</p>
            <p className="font-black text-indigo-600 dark:text-indigo-400">{data.history_number}</p>
          </div>
        </div>
      </div>

      {/* Motivo de Consulta */}
      <div className="space-y-2 bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <EditableField 
          label="Motivo de Consulta" 
          value={data.reason_for_visit} 
          onSave={(val) => onUpdateField(data.id, 'reason_for_visit', val)}
        />
      </div>

      {/* Antecedentes Médicos */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
        <h4 className="text-sm font-black text-gray-900 dark:text-white border-b border-gray-50 dark:border-gray-700 pb-3 uppercase tracking-widest">Antecedentes Médicos</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <EditableField 
            label="Antecedentes Madre" 
            value={data.family_history_mother} 
            onSave={(val) => onUpdateField(data.id, 'family_history_mother', val)}
          />
          <EditableField 
            label="Antecedentes Padre" 
            value={data.family_history_father} 
            onSave={(val) => onUpdateField(data.id, 'family_history_father', val)}
          />
          <EditableField 
            label="Personales / Suplementos" 
            value={data.personal_history} 
            onSave={(val) => onUpdateField(data.id, 'personal_history', val)}
          />
          <EditableField 
            label="Quirúrgicos" 
            value={data.surgical_history} 
            onSave={(val) => onUpdateField(data.id, 'surgical_history', val)}
          />
          <div className="md:col-span-2">
            <EditableField 
              label="Resumen Gineco-Obstétrico" 
              value={data.summary_gyn_obstetric} 
              onSave={(val) => onUpdateField(data.id, 'summary_gyn_obstetric', val)}
            />
          </div>
          <EditableField 
            label="Examen Funcional" 
            value={data.summary_functional_exam} 
            onSave={(val) => onUpdateField(data.id, 'summary_functional_exam', val)}
          />
          <EditableField 
            label="Hábitos" 
            value={data.summary_habits} 
            onSave={(val) => onUpdateField(data.id, 'summary_habits', val)}
          />
        </div>
      </div>

      {/* Evolución Médica */}
      <div className="space-y-6 pt-4">
        <h4 className="text-sm font-black text-gray-900 dark:text-white border-b border-gray-50 dark:border-gray-700 pb-3 uppercase tracking-widest">
          {data.is_single_report ? 'Detalles Médicos' : 'Evolución Cronológica'}
        </h4>
        
        <div className={`space-y-10 relative ${!data.is_single_report ? "before:content-[''] before:absolute before:left-3 before:top-4 before:bottom-4 before:w-0.5 before:bg-indigo-100 dark:before:bg-gray-700" : ""}`}>
          {consultations.map((c, idx) => (
            <div key={idx} className={`relative ${!data.is_single_report ? "pl-10" : ""}`}>
              {!data.is_single_report && (
                <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-white dark:bg-gray-900 border-2 border-indigo-500 shadow-sm z-10 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                </div>
              )}
              
              <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] shadow-md shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700 space-y-6">
                <div className="flex justify-between items-center bg-indigo-50/30 dark:bg-indigo-900/20 p-3 -m-3 mb-3 rounded-t-[1.8rem] border-b border-indigo-50 dark:border-gray-700">
                  <p className="text-indigo-900 dark:text-indigo-300 font-black text-xs uppercase tracking-wider">
                    {new Date(c.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                  <span className="bg-indigo-600 text-white text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest">
                    {data.is_single_report ? 'Consulta Actual' : `Visita #${consultations.length - idx}`}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <EditableField 
                    label="Diagnóstico Integrado" 
                    value={c.diagnosis} 
                    onSave={(val) => onUpdateField(c.id, 'diagnosis', val)}
                  />
                  
                  <EditableField 
                    label="Plan de Tratamiento" 
                    value={c.plan} 
                    onSave={(val) => onUpdateField(c.id, 'plan', val)}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-50 dark:border-gray-700">
                    <EditableField 
                      label="Examen Físico" 
                      value={c.physical_exam} 
                      onSave={(val) => onUpdateField(c.id, 'physical_exam', val)}
                    />
                    <EditableField 
                      label="Hallazgos Ecográficos" 
                      value={c.ultrasound} 
                      onSave={(val) => onUpdateField(c.id, 'ultrasound', val)}
                    />
                  </div>

                  <div className="pt-4 border-t border-gray-50 dark:border-gray-700">
                    <EditableField 
                      label="Observaciones" 
                      value={c.observations} 
                      onSave={(val) => onUpdateField(c.id, 'observations', val)}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Soportes Digitales */}
      {data.id && (
        <div className="pt-6">
          <ConsultationAssetManager consultationId={data.id} readOnly={false} />
        </div>
      )}
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
                  <button onClick={() => handleViewPdf(`${API_BASE}/consultations/${consultation.id}/history_pdf`)} className="flex-1 inline-flex justify-center items-center px-3 py-2.5 rounded-xl text-[10px] font-black bg-blue-50 text-blue-700">
                    HISTORIA
                  </button>
                  <button onClick={() => handleViewPdf(`${API_BASE}/consultations/${consultation.id}/pdf`)} className="flex-1 inline-flex justify-center items-center px-3 py-2.5 rounded-xl text-[10px] font-black bg-green-50 text-green-700">
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
                        <button onClick={() => handleViewPdf(`${API_BASE}/consultations/${consultation.id}/history_pdf`)} className="px-3 py-2 bg-blue-50 text-blue-700 rounded-xl text-[10px] font-black">HISTORIA</button>
                        <button onClick={() => handleViewPdf(`${API_BASE}/consultations/${consultation.id}/pdf`)} className="px-3 py-2 bg-green-50 text-green-700 rounded-xl text-[10px] font-black">INFORME</button>
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
