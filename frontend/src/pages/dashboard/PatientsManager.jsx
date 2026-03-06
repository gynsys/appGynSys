import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToastStore } from '../../store/toastStore';
import Modal from '../../components/common/Modal';
import { FiTrash2, FiFileText, FiUser, FiCalendar, FiHome, FiGrid, FiEdit, FiSearch, FiX, FiClipboard } from 'react-icons/fi';

const HistoryHtmlView = ({ data }) => {
  if (!data) return null;

  // Si es un informe individual, usamos los datos raíz de la consulta
  // Si es una historia, usamos el array all_consultations
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
      {/* Patient Header */}
      <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
        <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
          {data.is_single_report ? 'Informe Médico' : 'Información del Paciente'}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Nombre Completo</p>
            <p className="font-semibold">{data.full_name}</p>
          </div>
          <div>
            <p className="text-gray-500">Identificación (CI)</p>
            <p className="font-semibold">{data.ci}</p>
          </div>
          <div>
            <p className="text-gray-500">Edad</p>
            <p className="font-semibold">{data.age} años</p>
          </div>
          <div>
            <p className="text-gray-500">Teléfono</p>
            <p className="font-semibold">{data.phone}</p>
          </div>
        </div>
      </div>

      {/* Antecedentes Section - Solo mostrar si hay datos relevantes o es una historia completa */}
      {(data.summary_gyn_obstetric || data.personal_history || !data.is_single_report) && (
        <div className="space-y-4">
          <h4 className="text-lg font-bold border-b pb-2">Antecedentes y Perfil</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.summary_gyn_obstetric && (
              <div className="space-y-2">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Gineco-Obstétricos</p>
                <p className="text-sm italic">{data.summary_gyn_obstetric}</p>
              </div>
            )}
            {data.summary_habits && (
              <div className="space-y-2">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Hábitos</p>
                <p className="text-sm italic">{data.summary_habits}</p>
              </div>
            )}
            <div className="space-y-2">
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Personales / Suplementos</p>
              <p className="text-sm italic">{data.personal_history} {data.supplements && `| ${data.supplements}`}</p>
            </div>
            {data.surgical_history && (
              <div className="space-y-2">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Quirúrgicos</p>
                <p className="text-sm italic">{data.surgical_history}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Consultations Timeline / Single Consultation Detail */}
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
    </div>
  );
};


export default function PatientsManager({ isEmbedded = false }) {
  // Define API Base URL dynamically
  const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';
  const navigate = useNavigate();
  const [consultations, setConsultations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Delete State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [consultationToDelete, setConsultationToDelete] = useState(null);

  // PDF Preview State
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [currentPdfUrl, setCurrentPdfUrl] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

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
      const response = await fetch(`${API_BASE}/consultations/`);
      if (response.ok) {
        const data = await response.json();

        // Group by patient_ci and keep only the most recent consultation per patient
        const grouped = {};
        data.forEach(consultation => {
          const ci = consultation.patient_ci;
          if (!grouped[ci] || new Date(consultation.created_at) > new Date(grouped[ci].created_at)) {
            grouped[ci] = consultation;
          }
        });

        // Convert back to array
        const uniquePatients = Object.values(grouped);
        setConsultations(uniquePatients);
      } else {
        // Handle error silently or log
      }
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

    // Map DB fields to Schema fields for the form
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
      // Backend returns WITHOUT admin_ prefix, but form uses WITH prefix
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
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
      // Ensure plan and treatment are sent separately
      const payload = {
        ...editFormData,
        // The schema expects keys like 'admin_plan', which are already in editFormData
      };
      const response = await fetch(`${API_BASE}/consultations/${consultationToEdit.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        showToast('Historia actualizada exitosamente', 'success');
        // Refresh list
        fetchConsultations();
        setEditModalOpen(false);
        setConsultationToEdit(null);
      } else {
        showToast('Error al actualizar la historia', 'error');
      }
    } catch (error) {
      showToast('Error de conexión', 'error');
    }
  };

  const handleDeleteClick = (id) => {
    setConsultationToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!consultationToDelete) return;

    try {
      const response = await fetch(`${API_BASE}/consultations/${consultationToDelete}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showToast('Consulta eliminada exitosamente', 'success');
        setConsultations(prev => prev.filter(c => c.id !== consultationToDelete));
      } else {
        showToast('Error al eliminar la consulta', 'error');
      }
    } catch (error) {
      showToast('Error de conexión', 'error');
    } finally {
      setDeleteModalOpen(false);
      setConsultationToDelete(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-VE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewPdf = async (url) => {
    setCurrentPdfUrl(url);
    setHistoryData(null); // Reset before loading

    // Check if it's a history PDF OR a single report PDF
    const isHistory = url.includes('history_pdf');
    const isReport = url.includes('/pdf') && !url.includes('history');

    if (isHistory || isReport) {
      // Robust ID extraction for both patterns
      const match = url.match(/\/consultations\/(\d+)\//);
      const consultationId = match ? match[1] : null;

      if (consultationId) {
        setLoadingHistory(true);
        try {
          const dataEndpoint = isHistory ? 'history_data' : 'data';
          const response = await fetch(`${API_BASE}/consultations/${consultationId}/${dataEndpoint}`);
          if (response.ok) {
            const data = await response.json();
            setHistoryData(data);
          }
        } catch (error) {
          console.error("Error fetching native data:", error);
        } finally {
          setLoadingHistory(false);
        }
      }
    }

    setPdfModalOpen(true);
  };

  // Helper filter function
  const filteredConsultations = consultations.filter(consultation =>
    consultation.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    consultation.patient_ci?.includes(searchTerm)
  );

  return (
    <div className={isEmbedded ? "py-4" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"}>
      {!isEmbedded && (
        <div className="mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white">Gestión de Historias Médicas</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400 font-medium">Administra las consultas y reportes generados.</p>
          </div>
          <div className="relative w-full md:w-80">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
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
        <div className="bg-white dark:bg-gray-800 rounded-[32px] shadow-sm p-12 md:p-20 text-center border border-gray-100 dark:border-gray-700">
          <FiUser className="mx-auto h-16 w-16 text-gray-200 dark:text-gray-700 mb-6" />
          <h3 className="text-xl font-black text-gray-900 dark:text-white">
            {searchTerm ? 'No se encontraron resultados' : 'No hay historias registradas'}
          </h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400 font-medium max-w-xs mx-auto">
            {searchTerm ? 'Intenta con otro término de búsqueda.' : 'Las consultas guardadas aparecerán de forma organizada aquí.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Card View for Mobile/Tablet */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-4">
            {filteredConsultations.map((consultation) => (
              <div key={consultation.id} className="bg-white dark:bg-gray-800 rounded-[24px] border border-gray-100 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-shadow">
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
                  <div className="text-[10px] font-black bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg text-gray-600 dark:text-gray-300">
                    #{consultation.history_number || 'PEND'}
                  </div>
                </div>

                <div className="space-y-3 mb-5">
                  <div className="flex items-center text-xs text-gray-600 dark:text-gray-400 font-bold">
                    <FiCalendar className="mr-2 w-4 h-4 text-indigo-400" />
                    {formatDate(consultation.created_at)}
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl">
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-black mb-1">Motivo</p>
                    <p className="text-xs text-gray-700 dark:text-gray-300 font-medium line-clamp-2">{consultation.reason_for_visit || 'No especificado'}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <button
                    onClick={() => handleViewPdf(`${API_BASE}/consultations/${consultation.id}/history_pdf`)}
                    className="flex-1 inline-flex justify-center items-center px-3 py-2.5 rounded-xl text-[10px] font-black bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                  >
                    <FiFileText className="mr-1 w-3 h-3" /> HISTORIA
                  </button>
                  <button
                    onClick={() => handleViewPdf(`${API_BASE}/consultations/${consultation.id}/pdf`)}
                    className="flex-1 inline-flex justify-center items-center px-3 py-2.5 rounded-xl text-[10px] font-black bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                  >
                    <FiFileText className="mr-1 w-3 h-3" /> INFORME
                  </button>
                  <div className="flex gap-2 w-full mt-1">
                    <button
                      onClick={() => handleEditClick(consultation)}
                      className="flex-1 p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex justify-center hover:bg-indigo-100 transition-colors"
                    >
                      <FiEdit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(consultation.id)}
                      className="flex-1 p-2.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl flex justify-center hover:bg-red-100 transition-colors"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block bg-white dark:bg-gray-800 shadow-sm rounded-[32px] border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto no-scrollbar">
              <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
                <thead className="bg-gray-50/50 dark:bg-gray-800/50">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                      Paciente
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                      N° Historia
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                      Fecha
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                      Motivo
                    </th>
                    <th scope="col" className="px-6 py-4 text-center text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredConsultations.map((consultation) => (
                    <tr key={consultation.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <FiUser />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">{consultation.patient_name || 'Desconocido'}</div>
                            <div className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider">CI: {consultation.patient_ci || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="inline-block px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-[10px] md:text-xs font-black text-gray-600 dark:text-gray-300 tracking-widest">
                          {consultation.history_number || 'PENDIENTE'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <FiCalendar className="text-indigo-400" />
                          {formatDate(consultation.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs font-medium text-gray-600 dark:text-gray-400 max-w-xs truncate italic" title={consultation.reason_for_visit}>
                          {consultation.reason_for_visit || 'No especificado'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-row gap-2 items-center justify-center translate-x-2 opacity-80 group-hover:opacity-100 transition-all">
                          {consultation.id ? (
                            <>
                              <button
                                onClick={() => handleViewPdf(`${API_BASE}/consultations/${consultation.id}/history_pdf`)}
                                className="inline-flex justify-center items-center px-3 py-2 rounded-xl text-[10px] font-black bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                              >
                                <FiFileText className="mr-1" /> HISTORIA
                              </button>
                              <button
                                onClick={() => handleViewPdf(`${API_BASE}/consultations/${consultation.id}/pdf`)}
                                className="inline-flex justify-center items-center px-3 py-2 rounded-xl text-[10px] font-black bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                              >
                                <FiFileText className="mr-1" /> INFORME
                              </button>
                              <button
                                onClick={() => handleEditClick(consultation)}
                                className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-colors"
                                title="Modificar historia médica"
                              >
                                <FiEdit className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(consultation.id)}
                                className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors"
                                title="Eliminar consulta"
                              >
                                <FiTrash2 className="w-5 h-5" />
                              </button>
                            </>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                              PENDIENTE
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PDF Viewer Modal - Dual View (HTML for Mobile, Iframe for Desktop) */}
      <Modal
        isOpen={pdfModalOpen}
        onClose={() => { setPdfModalOpen(false); setHistoryData(null); }}
        title="Vista Previa del Documento"
        size="4xl"
      >
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-auto min-h-[60vh] md:min-h-0">
            {/* Native HTML view for mobile */}
            {loadingHistory ? (
              <div className="md:hidden flex flex-col items-center justify-center p-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                <p className="text-gray-500 font-medium italic">Obteniendo historia clínica...</p>
              </div>
            ) : historyData ? (
              <div className="md:hidden">
                <HistoryHtmlView data={historyData} />
              </div>
            ) : (
              /* Default PDF message for non-history docs on mobile if needed */
              <div className="md:hidden flex flex-col items-center justify-center p-10 bg-gray-50 dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                <FiFileText className="w-12 h-12 text-gray-300 mb-4" />
                <p className="text-gray-500 text-center font-medium">Usa un dispositivo de escritorio para previsualizar este informe detallado o descárgalo a continuación.</p>
              </div>
            )}

            {/* Iframe for desktop */}
            <div className="hidden md:block h-[70vh] bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden">
              {currentPdfUrl && (
                <iframe
                  src={currentPdfUrl}
                  className="w-full h-full border-0"
                  title="Visor PDF"
                />
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[10px] text-gray-400 italic">Documento médico generado digitalmente.</p>
            <div className="flex items-center gap-3 w-full md:w-auto">
              {currentPdfUrl && (
                <a
                  href={currentPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 md:flex-none text-center px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition shadow-md"
                >
                  Descargar PDF
                </a>
              )}
              <button
                type="button"
                className="flex-1 md:flex-none px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                onClick={() => { setPdfModalOpen(false); setHistoryData(null); }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Editar Historia Médica"
        size="lg"
      >
        <form onSubmit={handleUpdate} className="mt-4 space-y-6 max-h-[70vh] overflow-y-auto px-2">

          {/* Patient Info */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Datos del Paciente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Nombre Completo</label>
                <input type="text" name="full_name" value={editFormData.full_name || ''} onChange={handleEditChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-600 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Cédula</label>
                <input type="text" name="ci" value={editFormData.ci || ''} onChange={handleEditChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-600 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Edad</label>
                <input type="text" name="age" value={editFormData.age || ''} onChange={handleEditChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-600 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Teléfono</label>
                <input type="text" name="phone" value={editFormData.phone || ''} onChange={handleEditChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-600 dark:text-white" />
              </div>
            </div>
          </div>

          {/* Clinical Data */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 pb-2">Datos Clínicos</h3>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Motivo de Consulta</label>
              <textarea name="reason_for_visit" rows={2} value={editFormData.reason_for_visit || ''} onChange={handleEditChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm pl-4 bg-white dark:bg-gray-700 dark:text-white" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Antecedentes Familiares (Madre)</label>
                <textarea name="family_history_mother" rows={2} value={editFormData.family_history_mother || ''} onChange={handleEditChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm pl-4 bg-white dark:bg-gray-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Antecedentes Familiares (Padre)</label>
                <textarea name="family_history_father" rows={2} value={editFormData.family_history_father || ''} onChange={handleEditChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm pl-4 bg-white dark:bg-gray-700 dark:text-white" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Antecedentes Personales</label>
                <textarea name="personal_history" rows={2} value={editFormData.personal_history || ''} onChange={handleEditChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm pl-4 bg-white dark:bg-gray-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Suplementos</label>
                <textarea name="supplements" rows={2} value={editFormData.supplements || ''} onChange={handleEditChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm pl-4 bg-white dark:bg-gray-700 dark:text-white" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Resumen Gineco-Obstétrico</label>
              <textarea name="summary_gyn_obstetric" rows={3} value={editFormData.summary_gyn_obstetric || ''} onChange={handleEditChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm pl-4 bg-white dark:bg-gray-700 dark:text-white" />
            </div>
          </div>

          {/* Medical Report Data */}
          <div className="space-y-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200 border-b border-blue-200 dark:border-blue-800 pb-2">Datos del Informe Médico</h3>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Examen Físico</label>
              <textarea name="admin_physical_exam" rows={3} value={editFormData.admin_physical_exam || ''} onChange={handleEditChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm pl-4 bg-white dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Ultrasonido Transvaginal</label>
              <textarea name="admin_ultrasound" rows={3} value={editFormData.admin_ultrasound || ''} onChange={handleEditChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm pl-4 bg-white dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <div className="flex justify-between items-center">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Diagnóstico</label>
                <button
                  type="button"
                  onClick={() => addBullet('admin_diagnosis')}
                  className="text-xs text-indigo-600 hover:text-indigo-800 underline"
                >
                  Agregar Item
                </button>
              </div>
              <textarea name="admin_diagnosis" rows={2} value={editFormData.admin_diagnosis || ''} onChange={handleEditChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm pl-4 bg-white dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <div className="flex justify-between items-center">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Plan</label>
                <button
                  type="button"
                  onClick={() => addBullet('admin_plan')}
                  className="text-xs text-indigo-600 hover:text-indigo-800 underline"
                >
                  Agregar Item
                </button>
              </div>
              <textarea name="admin_plan" rows={4} value={editFormData.admin_plan || ''} onChange={handleEditChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm pl-4 bg-white dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Observaciones</label>
              <textarea name="admin_observations" rows={2} value={editFormData.admin_observations || ''} onChange={handleEditChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm pl-4 bg-white dark:bg-gray-700 dark:text-white" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              onClick={() => setEditModalOpen(false)}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirmar Eliminación"
      >
        <div className="mt-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            ¿Estás seguro de que deseas eliminar esta historia médica? Esta acción no se puede deshacer y se perderán todos los datos asociados.
          </p>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            onClick={() => setDeleteModalOpen(false)}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            onClick={confirmDelete}
          >
            Eliminar
          </button>
        </div>
      </Modal>
    </div>
  );
}
