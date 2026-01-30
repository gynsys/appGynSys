import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToastStore } from '../../store/toastStore';
import Modal from '../../components/common/Modal';
import { FiTrash2, FiFileText, FiUser, FiCalendar, FiHome, FiGrid, FiEdit, FiSearch, FiX } from 'react-icons/fi';


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

  const handleViewPdf = (url) => {
    setCurrentPdfUrl(url);
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
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Historias Médicas</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Administra las consultas y reportes generados.</p>
          </div>
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar paciente..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-white transition duration-150 ease-in-out"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredConsultations.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center border border-gray-200 dark:border-gray-700">
          <FiUser className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {searchTerm ? 'No se encontraron resultados' : 'No hay historias registradas'}
          </h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            {searchTerm ? 'Intenta con otro término de búsqueda.' : 'Las consultas guardadas aparecerán aquí.'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Paciente
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    N° Historia
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Motivo
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredConsultations.map((consultation) => (
                  <tr key={consultation.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                          <FiUser />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{consultation.patient_name || 'Desconocido'}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">CI: {consultation.patient_ci || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-gray-900 dark:text-gray-300">
                        {consultation.history_number || 'Pendiente'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-300 flex items-center gap-2">
                        <FiCalendar className="text-gray-400" />
                        {formatDate(consultation.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-gray-300 max-w-xs truncate" title={consultation.reason_for_visit}>
                        {consultation.reason_for_visit || 'No especificado'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-row gap-3 items-center justify-center">
                        {consultation.id ? (
                          <>
                            <button
                              onClick={() => handleViewPdf(`${API_BASE}/consultations/${consultation.id}/history_pdf`)}
                              className="inline-flex justify-center items-center px-3 py-2 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
                            >
                              <FiFileText className="mr-1" /> Historia
                            </button>
                            <button
                              onClick={() => handleViewPdf(`${API_BASE}/consultations/${consultation.id}/pdf`)}
                              className="inline-flex justify-center items-center px-3 py-2 rounded-full text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200"
                            >
                              <FiFileText className="mr-1" /> Informe
                            </button>
                            <button
                              onClick={() => handleEditClick(consultation)}
                              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 px-3 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 rounded-full transition-colors"
                              title="Modificar historia médica"
                            >
                              <FiEdit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(consultation.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 px-3 py-2 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-full transition-colors"
                              title="Eliminar consulta"
                            >
                              <FiTrash2 className="w-5 h-5" />
                            </button>
                          </>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                            Pendiente
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
      )}

      {/* PDF Viewer Modal */}
      <Modal
        isOpen={pdfModalOpen}
        onClose={() => setPdfModalOpen(false)}
        title="Vista Previa del Documento"
        size="4xl"
      >
        <div className="bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden h-[80vh]">
          {currentPdfUrl && (
            <iframe
              src={currentPdfUrl}
              className="w-full h-full border-0"
              title="Visor PDF"
            />
          )}
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            onClick={() => setPdfModalOpen(false)}
          >
            Cerrar
          </button>
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
