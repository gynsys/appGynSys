import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/axios';
import { toast } from 'react-hot-toast';
import { useToastStore } from '../../store/toastStore';
import Modal from '../../components/common/Modal';
import { FiTrash2, FiFileText, FiUser, FiCalendar, FiEdit, FiSearch, FiImage, FiDownload } from 'react-icons/fi';
import { ConsultationAssetManager } from '../../components/common/ConsultationAssetManager';
import { openExternalFile, downloadFile, isCapacitor } from '../../utils/platform';

const HistoryHtmlView = ({ data, downloadUrl }) => {
  if (!data) return null;

  const consultations = data.is_single_report
    ? [{
      created_at: data.created_at,
      diagnosis: data.diagnosis,
      plan: data.plan,
      physical_exam: data.physical_exam,
      ultrasound: data.ultrasound,
      observations: data.observations
    }]
    : (data.all_consultations || []).slice().reverse();

  return (
    <div className="space-y-6 text-gray-800 dark:text-gray-200 p-1 md:p-4 overflow-y-auto max-h-[70vh]">
      <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
        <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
          {data.is_single_report ? 'Informe Médico' : 'Información del Paciente'}
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2">
            <p className="text-gray-500">Nombre Completo</p>
            <p className="font-semibold text-right">{data.full_name}</p>
          </div>
          <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2">
            <p className="text-gray-500">Identificación (CI)</p>
            <p className="font-semibold text-right">{data.ci}</p>
          </div>
          <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2">
            <p className="text-gray-500">Edad</p>
            <p className="font-semibold text-right">{data.age} años</p>
          </div>
          <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2">
            <p className="text-gray-500">Teléfono</p>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-right">{data.phone}</p>
              {data.phone && data.phone !== 'N/A' && (
                <a
                  href={`https://wa.me/${data.phone?.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  title="Abrir WhatsApp"
                  className="flex-shrink-0 w-7 h-7 rounded-full bg-[#25D366] flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </a>
              )}
            </div>
          </div>
          <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2">
            <p className="text-gray-500">Dirección</p>
            <p className="font-semibold text-right">{data.address || ' '}</p>
          </div>
          <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2">
            <p className="text-gray-500">Ocupación</p>
            <p className="font-semibold text-right">{data.occupation || ' '}</p>
          </div>
          <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2">
            <p className="text-gray-500">Correo</p>
            <p className="font-semibold text-right truncate max-w-[60%]">{data.email || '-'}</p>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-gray-500">N° Historia</p>
            <p className="font-semibold text-right text-indigo-600">{data.history_number}</p>
          </div>
        </div>
      </div>

      {(data.reason_for_visit) && (
        <div className="space-y-4">
          <h4 className="text-lg font-bold border-b pb-2">Motivo de consulta</h4>
          <p className="text-sm italic">{data.reason_for_visit}</p>
        </div>
      )}

      {(data.summary_gyn_obstetric || data.personal_history || data.family_history_mother || data.family_history_father || data.summary_functional_exam || data.surgical_history || !data.is_single_report) && (
        <div className="space-y-4">
          <h4 className="text-lg font-bold border-b pb-2">Antecedentes y Perfil</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(data.family_history_mother || data.family_history_father) && (
              <div className="space-y-2 col-span-1 md:col-span-2">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Antecedentes Familiares</p>
                {data.family_history_mother && <p className="text-sm italic"><strong>Madre:</strong> {data.family_history_mother}</p>}
                {data.family_history_father && <p className="text-sm italic"><strong>Padre:</strong> {data.family_history_father}</p>}
              </div>
            )}
            {data.personal_history && (
              <div className="space-y-1">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider inline mr-2">Antecedentes Personales:</p>
                <p className="text-sm italic inline">{data.personal_history}</p>
              </div>
            )}
            {data.supplements && (
              <div className="space-y-1">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider inline mr-2">Suplementos:</p>
                <p className="text-sm italic inline">{data.supplements}</p>
              </div>
            )}
            {data.surgical_history && (
              <div className="space-y-1">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider inline mr-2">Antecedentes Quirúrgicos:</p>
                <p className="text-sm italic inline">{data.surgical_history}</p>
              </div>
            )}
            {data.summary_gyn_obstetric && (
              <div className="space-y-1">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider inline mr-2">Gineco-Obstétricos:</p>
                <p className="text-sm italic inline">{data.summary_gyn_obstetric}</p>
              </div>
            )}
            {data.summary_functional_exam && (
              <div className="space-y-1 col-span-1 md:col-span-2">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider inline mr-2">Examen Funcional:</p>
                <p className="text-sm italic inline">{data.summary_functional_exam}</p>
              </div>
            )}
            {data.summary_habits && (
              <div className="space-y-1 col-span-1 md:col-span-2">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider inline mr-2">Hábitos:</p>
                <p className="text-sm italic inline">{data.summary_habits}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-4 pt-4">
        <h4 className="text-lg font-bold border-b pb-2">
          {data.is_single_report ? 'Detalles de la Consulta' : 'Evolución Médica (Consultas)'}
        </h4>
        <div className={`space-y-8 relative ${!data.is_single_report ? "before:content-[''] before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200 dark:before:bg-gray-700" : ""}`}>
          {consultations.map((c, idx) => (
            <div key={idx} className={`relative ${!data.is_single_report ? "pl-10" : ""}`}>
              {!data.is_single_report && (
                <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-white dark:bg-gray-900 border-2 border-indigo-500 z-10 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                </div>
              )}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-start mb-3">
                  <p className="text-indigo-600 font-bold">{new Date(c.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                  <span className="bg-indigo-50 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                    {data.is_single_report ? 'Reporte Actual' : 'Consulta'}
                  </span>
                </div>

                <div className="space-y-4">
                  {c.diagnosis && (
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase">Diagnóstico</p>
                      <p className="text-sm font-medium">{c.diagnosis}</p>
                    </div>
                  )}
                  {c.plan && (
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase">Plan de Tratamiento</p>
                      <p className="text-sm whitespace-pre-line">{c.plan}</p>
                    </div>
                  )}
                  {(c.physical_exam || c.ultrasound) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-50 dark:border-gray-700">
                      {c.physical_exam && (
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Examen Físico</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{c.physical_exam}</p>
                        </div>
                      )}
                      {c.ultrasound && (
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Ecografía</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{c.ultrasound}</p>
                        </div>
                      )}
                    </div>
                  )}
                  {c.observations && (
                    <div className="pt-2 border-t border-gray-50 dark:border-gray-700">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Observaciones</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{c.observations}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Adjuntos / Soportes */}
      {data.id && (
          <ConsultationAssetManager consultationId={data.id} readOnly={false} />
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
    const fetchHistoryData = async () => {
      // 1. Si el modal no está abierto, no hacemos nada
      if (!isPdfModalOpen) return;

      // 2. Si es pestaña de activos, solo nos aseguramos de tener el ID si es posible
      if (activePdfTab === 'assets') {
        setHistoryData(null);
        if (!currentConsultationId && basePdfUrl) {
           const match = basePdfUrl.match(/\/consultations\/(\d+)\//);
           if (match) setCurrentConsultationId(match[1]);
        }
        return;
      }

      // 3. Si no hay URL base y no estamos en modo solo activos, paramos
      if (!basePdfUrl) return;

      const isHistory = basePdfUrl.includes('history_pdf');
      const isReport = basePdfUrl.includes('/pdf') && !basePdfUrl.includes('history');

      if (isHistory || isReport) {
        const match = basePdfUrl.match(/\/consultations\/(\d+)\//);
        const consultationId = match ? match[1] : null;
        
        if (consultationId) {
          // Si ya tenemos el ID y los datos de ESE ID, no recargamos
          if (historyData?.id === parseInt(consultationId) && !loadingHistory) {
              return;
          }

          setCurrentConsultationId(consultationId);
          setLoadingHistory(true);
          try {
            const dataEndpoint = isHistory ? 'history_data' : 'data';
            const response = await api.get(`/consultations/${consultationId}/${dataEndpoint}`);
            setHistoryData(response.data);
          } catch (error) {
            console.error("Error fetching native data:", error);
            setHistoryData(null);
          } finally {
            setLoadingHistory(false);
          }
        }
      }
    };

    fetchHistoryData();
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
        title={isAssetOnly ? `Soportes Digitales de ${currentPatientName}` : "Vista Previa"} 
        size="4xl" 
        fullScreenOnMobile
      >
        <div className="flex flex-col h-full">
          {/* Tabs Navigation - Ocultas en modo solo activos */}
          {currentConsultationId && !isAssetOnly && (
            <div className="border-b border-gray-200 dark:border-gray-700 mb-4 pb-4">
              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={() => setActivePdfTab('pdf')}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    activePdfTab === 'pdf' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {basePdfUrl?.includes('history_pdf') ? 'HISTORIA' : 'INFORME'}
                </button>
                <button
                  onClick={() => setActivePdfTab('assets')}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    activePdfTab === 'assets' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  SOPORTES
                </button>

                <label className="flex items-center gap-2 cursor-pointer sm:ml-auto">
                  <input
                    type="checkbox"
                    checked={includeImages}
                    onChange={(e) => setIncludeImages(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Incluir imágenes en el PDF</span>
                </label>
              </div>
            </div>
          )}

          <div className={`flex-1 overflow-auto min-h-[50vh] md:min-h-0 ${activePdfTab === 'assets' ? 'p-4' : ''}`}>
            {activePdfTab === 'pdf' ? (
              <>
                {loadingHistory ? (
                  <div className="md:hidden flex flex-col items-center justify-center p-20 animat-pulse text-gray-500">Cargando documento...</div>
                ) : historyData ? (
                  <div className="md:hidden"><HistoryHtmlView data={historyData} downloadUrl={getFullPdfUrl()} /></div>
                ) : null}
                 <div className="hidden md:block h-[60vh] rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900">
                  {basePdfUrl && <iframe src={getFullPdfUrl()} className="w-full h-full border-0" title="Visor de PDF" />}
                </div>
                {/* Mobile specific PDF helper for native apps */}
                {isCapacitor() && (
                  <div className="md:hidden flex flex-col items-center justify-center p-8 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border-2 border-dashed border-indigo-200 dark:border-indigo-800">
                    <FiFileText className="w-12 h-12 text-indigo-500 mb-4" />
                    <p className="text-sm text-center font-medium mb-6">Para una mejor experiencia y compatibilidad, abre el documento en el visor nativo del sistema.</p>
                     <button 
                      onClick={() => openExternalFile(getFullPdfUrl())}
                      className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2"
                    >
                      ABRIR DOCUMENTO
                    </button>
                  </div>
                )}
              </>
            ) : (
              // Tab Content: Assets
              <div className="h-[60vh] overflow-y-auto pr-2">
                <ConsultationAssetManager consultationId={currentConsultationId} readOnly={false} />
              </div>
            )}
          </div>
          <div className="mt-6 flex-shrink-0 flex justify-between items-center px-2 pb-6">
             {basePdfUrl && !isAssetOnly && (
              <button 
                onClick={() => isCapacitor() ? openExternalFile(getFullPdfUrl(true)) : downloadFile(getFullPdfUrl(true))} 
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium"
              >
                {isCapacitor() ? 'Abrir Externo' : 'Descargar PDF'}
              </button>
            )}
            <button onClick={() => { setPdfModalOpen(false); setHistoryData(null); }} className="px-4 py-2 border rounded-lg text-sm font-medium">Cerrar</button>
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
                  <input name="full_name" value={editFormData.full_name || ''} onChange={handleEditChange} placeholder="Nombre completo" className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 rounded-xl text-sm transition-all outline-none font-medium dark:text-gray-100" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Cédula / ID</label>
                  <input name="ci" value={editFormData.ci || ''} onChange={handleEditChange} placeholder="CI" className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 rounded-xl text-sm transition-all outline-none font-medium dark:text-gray-100" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Número de Historia</label>
                  <input name="history_number" value={editFormData.history_number || ''} onChange={handleEditChange} placeholder="N° Historia" className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 rounded-xl text-sm transition-all outline-none font-medium dark:text-gray-100" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Edad</label>
                  <input name="age" value={editFormData.age || ''} onChange={handleEditChange} placeholder="Edad" className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 rounded-xl text-sm transition-all outline-none font-medium dark:text-gray-100" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Teléfono</label>
                  <input name="phone" value={editFormData.phone || ''} onChange={handleEditChange} placeholder="Teléfono" className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 rounded-xl text-sm transition-all outline-none font-medium dark:text-gray-100" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Ocupación</label>
                  <input name="occupation" value={editFormData.occupation || ''} onChange={handleEditChange} placeholder="Ocupación" className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 rounded-xl text-sm transition-all outline-none font-medium dark:text-gray-100" />
                </div>
                <div className="space-y-1 md:col-span-3">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Dirección</label>
                  <input name="address" value={editFormData.address || ''} onChange={handleEditChange} placeholder="Dirección de habitación" className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 rounded-xl text-sm transition-all outline-none font-medium dark:text-gray-100" />
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
                  <textarea name="reason_for_visit" value={editFormData.reason_for_visit || ''} onChange={handleEditChange} rows="2" className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 rounded-xl text-sm transition-all outline-none font-medium dark:text-gray-100" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Antecedentes Familiares (Madre)</label>
                  <textarea name="family_history_mother" value={editFormData.family_history_mother || ''} onChange={handleEditChange} rows="2" className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 rounded-xl text-sm transition-all outline-none font-medium dark:text-gray-100" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Antecedentes Familiares (Padre)</label>
                  <textarea name="family_history_father" value={editFormData.family_history_father || ''} onChange={handleEditChange} rows="2" className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 rounded-xl text-sm transition-all outline-none font-medium dark:text-gray-100" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Antecedentes Personales</label>
                  <textarea name="personal_history" value={editFormData.personal_history || ''} onChange={handleEditChange} rows="2" className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 rounded-xl text-sm transition-all outline-none font-medium dark:text-gray-100" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Antecedentes Quirúrgicos</label>
                  <textarea name="surgical_history" value={editFormData.surgical_history || ''} onChange={handleEditChange} rows="2" className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 rounded-xl text-sm transition-all outline-none font-medium dark:text-gray-100" />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Suplementos / Medicamentos</label>
                  <textarea name="supplements" value={editFormData.supplements || ''} onChange={handleEditChange} rows="2" className="w-full p-3 bg-teal-50/30 dark:bg-teal-900/10 border-2 border-transparent focus:border-teal-500 focus:bg-white dark:focus:bg-gray-800 rounded-xl text-sm transition-all outline-none font-medium dark:text-gray-100" />
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
                  <textarea name="summary_gyn_obstetric" value={editFormData.summary_gyn_obstetric || ''} onChange={handleEditChange} rows="3" className="w-full p-3 bg-pink-50/30 dark:bg-pink-900/10 border-2 border-transparent focus:border-pink-500 focus:bg-white dark:focus:bg-gray-800 rounded-xl text-sm transition-all outline-none font-medium dark:text-gray-100" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Resumen Examen Funcional</label>
                  <textarea name="summary_functional_exam" value={editFormData.summary_functional_exam || ''} onChange={handleEditChange} rows="2" className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 rounded-xl text-sm transition-all outline-none font-medium dark:text-gray-100" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Resumen de Hábitos</label>
                  <textarea name="summary_habits" value={editFormData.summary_habits || ''} onChange={handleEditChange} rows="2" className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 rounded-xl text-sm transition-all outline-none font-medium dark:text-gray-100" />
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
                    <textarea name="admin_physical_exam" value={editFormData.admin_physical_exam || ''} onChange={handleEditChange} rows="4" className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 rounded-xl text-sm transition-all outline-none font-medium dark:text-gray-100" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Ultrasonido / Ecografía</label>
                    <textarea name="admin_ultrasound" value={editFormData.admin_ultrasound || ''} onChange={handleEditChange} rows="4" className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 rounded-xl text-sm transition-all outline-none font-medium dark:text-gray-100" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Diagnóstico Integrado</label>
                    <button type="button" onClick={() => addBullet('admin_diagnosis')} className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">+ AÑADIR PUNTO</button>
                  </div>
                  <textarea name="admin_diagnosis" value={editFormData.admin_diagnosis || ''} onChange={handleEditChange} rows="4" className="w-full p-3 bg-indigo-50/30 dark:bg-indigo-900/10 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 rounded-xl text-sm transition-all outline-none font-medium dark:text-gray-100" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Plan de Tratamiento</label>
                    <button type="button" onClick={() => addBullet('admin_plan')} className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">+ AÑADIR PUNTO</button>
                  </div>
                  <textarea name="admin_plan" value={editFormData.admin_plan || ''} onChange={handleEditChange} rows="5" className="w-full p-3 bg-indigo-50/30 dark:bg-indigo-900/10 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 rounded-xl text-sm transition-all outline-none font-medium dark:text-gray-100" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Observaciones Internas</label>
                  <textarea name="admin_observations" value={editFormData.admin_observations || ''} onChange={handleEditChange} rows="3" className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 rounded-xl text-sm transition-all outline-none font-medium dark:text-gray-100" />
                </div>
              </div>
            </div>

          </div>

          {/* Footer del Modal */}
          <div className="flex-shrink-0 p-6 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-4">
            <button 
              type="button" 
              onClick={() => setEditModalOpen(false)} 
              className="flex-1 md:flex-none px-6 py-3 border-2 border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="flex-1 md:flex-none px-10 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all active:scale-95"
            >
              Guardar
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
