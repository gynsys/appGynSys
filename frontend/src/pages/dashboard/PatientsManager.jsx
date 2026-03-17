import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/axios';
import { toast } from 'react-hot-toast';
import { useToastStore } from '../../store/toastStore';
import Modal from '../../components/common/Modal';
import { FiTrash2, FiFileText, FiUser, FiCalendar, FiSearch, FiImage, FiDownload, FiPrinter } from 'react-icons/fi';
import { ConsultationAssetManager } from '../../components/common/ConsultationAssetManager';
import { openExternalFile, downloadFile, isCapacitor } from '../../utils/platform';

// EditableField removed as per user request to simplify and remove edit functionality


const HistoryHtmlView = ({ data, onUpdateField, onDownload }) => {
  if (!data) return null;

  if (data.is_single_report) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-950">
        <div className="max-w-md w-full bg-indigo-50 dark:bg-indigo-900/20 p-8 rounded-[40px] border border-indigo-100 dark:border-indigo-800 text-center space-y-6">
          <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-indigo-200/20">
             <FiFileText size={40} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase leading-tight">Informe Preparado</h2>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">El layout detallado se genera exclusivamente para impresión segura.</p>
          </div>
          
          <div className="py-4 border-y border-indigo-100/50 dark:border-indigo-800/50 space-y-1">
             <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Paciente</p>
             <p className="font-bold text-gray-900 dark:text-white">{data.full_name}</p>
          </div>

          <button 
            onClick={onDownload}
            className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-200/40 transition-all hover:scale-[1.02] active:scale-95"
          >
            <FiDownload size={20} />
            Descargar PDF Oficial
          </button>
          
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
             Diseño institucional optimizado para papel A4 / Carta
          </p>
        </div>
      </div>
    );
  }

  const consultations = (data.all_consultations || []).slice().reverse();

  return (
    <div className="bg-gray-100 dark:bg-gray-950 p-2 md:p-8 min-h-full overflow-y-auto max-h-[75vh] custom-scrollbar">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 shadow-[0_0_50px_rgba(0,0,0,0.1)] dark:shadow-none border border-gray-200 dark:border-gray-800 min-h-[1056px] p-[0.75in] font-serif text-[12pt] leading-[1.4] text-gray-900 dark:text-gray-100 flex flex-col">
        {/* Encabezado Institucional */}
        <header className="flex items-center gap-6 mb-8 border-b-2 border-gray-900 dark:border-gray-100 pb-6 shrink-0">
           <div className="w-[1.2in] h-[1.2in] flex items-center justify-center shrink-0">
              <img src="/logo_gyn.png" alt="Logo" className="max-w-full max-h-full object-contain" />
           </div>
           <div className="flex-1 text-left">
              <h2 className="font-black text-xl text-gray-900 dark:text-white uppercase leading-tight">Dra. Mariel Herrera</h2>
              <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Especialista en Ginecología y Obstetricia</p>
              <p className="text-xs font-medium text-gray-500">Caracas - Guarenas - Guatire</p>
              <p className="text-xs font-medium text-gray-500">Citas: 04244281876 / 04127738918</p>
           </div>
        </header>

        <div className="text-center mb-10 shrink-0">
           <h1 className="text-2xl font-black text-gray-900 dark:text-white underline decoration-2 underline-offset-8 uppercase tracking-widest">
              HISTORIA MÉDICA
           </h1>
        </div>

        <div className="mb-10 text-[11pt] shrink-0">
          <div className="grid grid-cols-2 gap-x-12 gap-y-2 border-b border-gray-100 dark:border-gray-800 pb-6 text-gray-800 dark:text-gray-200">
             <div className="flex gap-1.5"><span className="font-bold min-w-[70px]">Nombre:</span> <span className="flex-1 capitalize">{data.full_name}</span></div>
             <div className="flex gap-1.5"><span className="font-bold min-w-[40px]">Edad:</span> <span>{data.age}</span></div>
             <div className="flex gap-1.5"><span className="font-bold min-w-[70px]">C.I.:</span> <span>{data.ci}</span></div>
             <div className="flex gap-1.5"><span className="font-bold min-w-[40px]">TLF:</span> <span>{data.phone}</span></div>
             <div className="flex gap-1.5"><span className="font-bold min-w-[70px]">Dirección:</span> <span className="flex-1 opacity-80">{data.address || 'N/A'}</span></div>
             <div className="flex gap-1.5"><span className="font-bold min-w-[70px]">N° Historia:</span> <span className="text-indigo-600 dark:text-indigo-400 font-bold">{data.history_number}</span></div>
          </div>
        </div>

        <div className="flex-1">
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="space-y-4">
              <section className="flex items-start gap-4">
                 <span className="font-black text-[10pt] uppercase min-w-[1.8in] pt-1 text-gray-500">Motivo de consulta:</span>
                 <div className="flex-1 text-gray-900 dark:text-gray-100">{data.reason_for_visit}</div>
              </section>

              <section className="flex items-start gap-4">
                 <span className="font-black text-[10pt] uppercase min-w-[1.8in] pt-1 text-gray-500">Antecedentes Familiares:</span>
                 <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><span className="font-bold text-[9pt] text-gray-400 block uppercase">Madre:</span> {data.family_history_mother || '(No reportado)'}</div>
                    <div><span className="font-bold text-[9pt] text-gray-400 block uppercase">Padre:</span> {data.family_history_father || '(No reportado)'}</div>
                 </div>
              </section>

              <section className="flex items-start gap-4">
                 <span className="font-black text-[10pt] uppercase min-w-[1.8in] pt-1 text-gray-500">Enfermedad Actual:</span>
                 <div className="flex-1">{data.personal_history}</div>
              </section>

              <section className="flex items-start gap-4">
                 <span className="font-black text-[10pt] uppercase min-w-[1.8in] pt-1 text-gray-500">Ant. Quirúrgicos:</span>
                 <div className="flex-1">{data.surgical_history}</div>
              </section>

              <section className="flex items-start gap-4">
                 <span className="font-black text-[10pt] uppercase min-w-[1.8in] pt-1 text-gray-500">Gineco-Obstétricos:</span>
                 <div className="flex-1">{data.summary_gyn_obstetric}</div>
              </section>
            </div>

            {consultations.length > 0 && (
              <div className="mt-12 border-t-4 border-double border-gray-100 dark:border-gray-800 pt-8">
                <h3 className="bg-gray-50 dark:bg-gray-800 px-6 py-3 font-black text-sm uppercase tracking-[0.2em] text-gray-600 dark:text-gray-300 mb-8 rounded-xl border border-gray-100 dark:border-gray-700">
                  Registro de Consultas Médicas
                </h3>
                
                <div className="space-y-16">
                  {consultations.map((c, idx) => (
                    <article key={idx} className="border-l-4 border-indigo-500 pl-8 space-y-6">
                      <header className="flex justify-between items-center bg-indigo-50/30 dark:bg-indigo-900/10 p-4 rounded-r-2xl">
                        <span className="font-black text-gray-900 dark:text-white uppercase text-base tracking-wide">
                          Consulta #{consultations.length - idx}
                        </span>
                        <span className="px-4 py-1 bg-white dark:bg-gray-800 shadow-sm rounded-full text-sm font-black text-indigo-600 italic border border-indigo-100 dark:border-indigo-800">
                          {new Date(c.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </span>
                      </header>

                      <div className="space-y-6 pl-2">
                        {[
                          { label: 'Examen Físico', key: 'physical_exam' },
                          { label: 'Ultrasonido', key: 'ultrasound' },
                          { label: 'Diagnóstico', key: 'diagnosis' },
                          { label: 'Plan de Tratamiento', key: 'plan' },
                          { label: 'Observaciones', key: 'observations' }
                        ].map((field) => (
                          <section key={field.key} className="flex items-start gap-6">
                            <span className="font-black text-[9pt] uppercase min-w-[1.6in] pt-1 text-gray-400">{field.label}:</span>
                            <div className="flex-1 font-medium">{c[field.key] || '(No reportado)'}</div>
                          </section>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
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
  const [historyData, setHistoryData] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activePdfTab, setActivePdfTab] = useState('pdf'); // 'pdf' or 'assets'
  const [currentConsultationId, setCurrentConsultationId] = useState(null);
  const [basePdfUrl, setBasePdfUrl] = useState(null);
  const [includeImages, setIncludeImages] = useState(false);
  const [isAssetOnly, setIsAssetOnly] = useState(false);
  const [currentPatientName, setCurrentPatientName] = useState('');

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
  }, [isPdfModalOpen, basePdfUrl, activePdfTab, historyData, loadingHistory]);


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
                <div className="grid grid-cols-2 gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <button onClick={() => handleViewPdf(`${API_BASE}/consultations/${consultation.id}/history_pdf`)} className="flex-1 inline-flex justify-center items-center px-3 py-2.5 rounded-xl text-[10px] font-black bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 uppercase truncate">
                    DETALLE
                  </button>
                  <button onClick={() => handleViewPdf(`${API_BASE}/consultations/${consultation.id}/pdf`)} className="flex-1 inline-flex justify-center items-center px-3 py-2.5 rounded-xl text-[10px] font-black bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 uppercase truncate">
                    INFORME
                  </button>
                  <div className="col-span-2 flex gap-2">
                    <button 
                      onClick={() => handleViewAssets(consultation.id, consultation.patient_name)} 
                      className="flex-1 px-3 py-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase"
                    >
                      <FiImage size={16} /> SOPORTES
                    </button>
                    <button onClick={() => handleDeleteClick(consultation.id)} className="px-4 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl flex items-center justify-center">
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
                        <button onClick={() => handleViewPdf(`${API_BASE}/consultations/${consultation.id}/history_pdf`)} className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-blue-100">Detalle</button>
                        <button onClick={() => handleViewPdf(`${API_BASE}/consultations/${consultation.id}/pdf`)} className="px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-green-100">Informe</button>
                         <button 
                          onClick={() => handleViewAssets(consultation.id, consultation.patient_name)} 
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-colors"
                          title="Ver Soportes Digitales"
                        >
                          <FiImage size={18} />
                        </button>
                        <button onClick={() => handleDeleteClick(consultation.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-colors"><FiTrash2 size={18} /></button>
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
                     <HistoryHtmlView 
                       data={historyData} 
                       onUpdateField={handleInlineUpdate} 
                       onDownload={() => isCapacitor() ? openExternalFile(getFullPdfUrl(true)) : downloadFile(getFullPdfUrl(true))}
                     />
                   )}
                 </div>
              </div>
            )}
          </div>
        </div>
      </Modal>


      {/* Edit Modal Removed as per user request */}


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
