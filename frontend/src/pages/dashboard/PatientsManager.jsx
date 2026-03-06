import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToastStore } from '../../store/toastStore';
import Modal from '../../components/common/Modal';
import { FiTrash2, FiFileText, FiUser, FiCalendar, FiEdit, FiSearch } from 'react-icons/fi';

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
          <div className="flex justify-between items-center">
            <p className="text-gray-500">Teléfono</p>
            <p className="font-semibold text-right">{data.phone}</p>
          </div>
        </div>
      </div>

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

        {downloadUrl && (
          <div className="pt-4 pb-2">
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 active:scale-[0.98] transition-all"
            >
              <FiFileText className="w-5 h-5" />
              DESCARGAR PDF
            </a>
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
        const grouped = {};
        data.forEach(consultation => {
          const ci = consultation.patient_ci;
          if (!grouped[ci] || new Date(consultation.created_at) > new Date(grouped[ci].created_at)) {
            grouped[ci] = consultation;
          }
        });
        setConsultations(Object.values(grouped));
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
      const response = await fetch(`${API_BASE}/consultations/${consultationToEdit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });
      if (response.ok) {
        showToast('Historia actualizada exitosamente', 'success');
        fetchConsultations();
        setEditModalOpen(false);
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
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const handleViewPdf = async (url) => {
    setCurrentPdfUrl(url);
    setHistoryData(null);
    const isHistory = url.includes('history_pdf');
    const isReport = url.includes('/pdf') && !url.includes('history');

    if (isHistory || isReport) {
      const match = url.match(/\/consultations\/(\d+)\//);
      const consultationId = match ? match[1] : null;
      if (consultationId) {
        setLoadingHistory(true);
        try {
          const dataEndpoint = isHistory ? 'history_data' : 'data';
          const response = await fetch(`${API_BASE}/consultations/${consultationId}/${dataEndpoint}`);
          if (response.ok) {
            setHistoryData(await response.json());
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
            Las consultas guardadas aparecerán de forma organizada aquí.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Card View for Mobile */}
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
                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <button onClick={() => handleViewPdf(`${API_BASE}/consultations/${consultation.id}/history_pdf`)} className="flex-1 inline-flex justify-center items-center px-3 py-2.5 rounded-xl text-[10px] font-black bg-blue-50 text-blue-700">
                    HISTORIA
                  </button>
                  <button onClick={() => handleViewPdf(`${API_BASE}/consultations/${consultation.id}/pdf`)} className="flex-1 inline-flex justify-center items-center px-3 py-2.5 rounded-xl text-[10px] font-black bg-green-50 text-green-700">
                    INFORME
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Table View for Desktop */}
          <div className="hidden lg:block bg-white dark:bg-gray-800 shadow-sm rounded-[32px] border border-gray-100 dark:border-gray-700 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-gray-400">Paciente</th>
                  <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-gray-400">N° Historia</th>
                  <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-gray-400">Fecha</th>
                  <th className="px-6 py-4 text-center text-xs font-black uppercase tracking-widest text-gray-400">Acciones</th>
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

      <Modal isOpen={pdfModalOpen} onClose={() => { setPdfModalOpen(false); setHistoryData(null); }} title="Vista Previa" size="4xl">
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-auto min-h-[60vh] md:min-h-0">
            {loadingHistory ? (
              <div className="md:hidden flex flex-col items-center justify-center p-20 animat-pulse">Cargando...</div>
            ) : historyData ? (
              <div className="md:hidden"><HistoryHtmlView data={historyData} downloadUrl={currentPdfUrl} /></div>
            ) : null}
            <div className="hidden md:block h-[70vh] rounded-lg overflow-hidden">
              {currentPdfUrl && <iframe src={currentPdfUrl} className="w-full h-full border-0" title="PDF" />}
            </div>
          </div>
          <div className="mt-4 flex justify-between items-center">
            {currentPdfUrl && <a href={currentPdfUrl} target="_blank" rel="noreferrer" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium">Descargar PDF</a>}
            <button onClick={() => { setPdfModalOpen(false); setHistoryData(null); }} className="px-4 py-2 border rounded-lg text-sm font-medium">Cerrar</button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal Refactored */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Editar Historia" size="lg">
        <form onSubmit={handleUpdate} className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto px-2">
          <div className="grid grid-cols-2 gap-4">
            <input name="full_name" value={editFormData.full_name || ''} onChange={handleEditChange} placeholder="Nombre" className="p-2 border rounded" />
            <input name="ci" value={editFormData.ci || ''} onChange={handleEditChange} placeholder="CI" className="p-2 border rounded" />
          </div>
          <textarea name="reason_for_visit" value={editFormData.reason_for_visit || ''} onChange={handleEditChange} placeholder="Motivo" className="w-full p-2 border rounded" />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setEditModalOpen(false)} className="p-2 border rounded">Cancelar</button>
            <button type="submit" className="p-2 bg-indigo-600 text-white rounded">Guardar</button>
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
