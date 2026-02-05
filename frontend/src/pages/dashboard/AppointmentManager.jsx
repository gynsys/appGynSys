import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { appointmentService } from '../../services/appointmentService';
import { useToastStore } from '../../store/toastStore';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { FiCalendar, FiPhone, FiMail, FiCreditCard, FiBriefcase, FiMapPin } from 'react-icons/fi';

export default function AppointmentManager() {
  const navigate = useNavigate();
  const { success, error: toastError } = useToastStore();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState(null); // Track which appointment is confirming
  const [filter, setFilter] = useState('scheduled'); // 'scheduled' (pending), 'confirmed', 'cancelled', 'completed'

  // Reschedule Modal State
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [newDate, setNewDate] = useState('');

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState(null);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const data = await appointmentService.getAppointments();
      // Sort by date descending
      const sorted = data.sort((a, b) => new Date(b.appointment_date) - new Date(a.appointment_date));
      setAppointments(sorted);
    } catch (err) {
      toastError("Error al cargar citas");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    if (newStatus === 'confirmed') setConfirmingId(id);
    try {
      // Artificial delay for better UX (so user sees the spinner)
      if (newStatus === 'confirmed') {
        await new Promise(resolve => setTimeout(resolve, 700));
      }

      await appointmentService.updateAppointment(id, { status: newStatus });
      success(`Cita ${newStatus === 'confirmed' ? 'confirmada' : 'actualizada'}`);
      loadAppointments();
    } catch (err) {
      toastError("Error al actualizar estado");
    } finally {
      if (newStatus === 'confirmed') setConfirmingId(null);
    }
  };

  const handleDeleteClick = (appointment) => {
    setAppointmentToDelete(appointment);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!appointmentToDelete) return;
    try {
      await appointmentService.deleteAppointment(appointmentToDelete.id);
      success("Cita eliminada");
      setIsDeleteModalOpen(false);
      setAppointmentToDelete(null);
      loadAppointments();
    } catch (err) {
      toastError("Error al eliminar cita");
    }
  };

  const openRescheduleModal = (appointment) => {
    setSelectedAppointment(appointment);
    // Format date for datetime-local input (YYYY-MM-DDThh:mm)
    const date = new Date(appointment.appointment_date);
    // Adjust for timezone offset to show correct local time in input
    const offset = date.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, 16);
    setNewDate(localISOTime);
    setIsRescheduleModalOpen(true);
  };

  const handleReschedule = async (e) => {
    e.preventDefault();
    if (!selectedAppointment || !newDate) return;

    try {
      await appointmentService.updateAppointment(selectedAppointment.id, {
        appointment_date: new Date(newDate).toISOString(),
      });
      success("Cita reagendada exitosamente");
      setIsRescheduleModalOpen(false);
      loadAppointments();
    } catch (err) {
      toastError("Error al reagendar cita");
    }
  };

  const filteredAppointments = appointments.filter(app =>
    // Logic: if filter is confirmed, show confirmed AND preconsulta_completed
    // if filter is completed, show completed
    // if filter is scheduled, show scheduled
    // if filter is cancelled, show cancelled
    filter === 'confirmed' ? (app.status === 'confirmed' || app.status === 'preconsulta_completed') :
      app.status === filter
  );

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(dateString));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Citas</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Administra tus citas médicas</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('scheduled')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${filter === 'scheduled' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
          >
            Pendientes
          </button>
          <button
            onClick={() => setFilter('confirmed')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${filter === 'confirmed' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
          >
            Confirmadas
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${filter === 'completed' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
          >
            Completadas
          </button>
          <button
            onClick={() => setFilter('cancelled')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${filter === 'cancelled' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
          >
            Canceladas
          </button>
        </div>

        {/* List */}
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Cargando citas...</div>
          ) : filteredAppointments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No hay citas en esta categoría.</div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAppointments.map((appointment) => (
                <li key={appointment.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0 w-full">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-medium text-indigo-600 dark:text-indigo-400 truncate">
                          {appointment.patient_name}
                        </h3>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center">
                          <FiCalendar className="mr-2 text-indigo-500" />
                          {formatDate(appointment.appointment_date)}
                        </span>
                        <span className="flex items-center">
                          <FiPhone className="mr-2 text-green-500" />
                          {appointment.patient_phone || 'N/A'}
                        </span>
                        <span className="flex items-center">
                          <FiMail className="mr-2 text-blue-500" />
                          {appointment.patient_email || 'N/A'}
                        </span>
                      </div>
                      {/* Patient Extra Details Row */}
                      <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center" title="Cédula de Identidad">
                          <FiCreditCard className="mr-2 text-gray-400" />
                          {appointment.patient_dni || 'CI: N/A'}
                        </span>
                        <span className="flex items-center" title="Ocupación">
                          <FiBriefcase className="mr-2 text-gray-400" />
                          {appointment.occupation || 'Ocupación: N/A'}
                        </span>
                        <span className="flex items-center" title="Residencia">
                          <FiMapPin className="mr-2 text-gray-400" />
                          {appointment.residence || 'Zona: N/A'}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-3 w-full sm:w-auto justify-end mt-4 sm:mt-0">
                      {appointment.status === 'scheduled' && filter === 'scheduled' && (
                        <button
                          onClick={() => handleStatusChange(appointment.id, 'confirmed')}
                          disabled={confirmingId === appointment.id}
                          className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${confirmingId === appointment.id ? 'opacity-75 cursor-not-allowed' : ''}`}
                        >
                          {confirmingId === appointment.id ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Confirmando...
                            </>
                          ) : (
                            'Confirmar'
                          )}
                        </button>
                      )}

                      {/* Reschedule Button - Only valid in Scheduled tab */}
                      {filter === 'scheduled' && ['scheduled', 'confirmed', 'preconsulta_completed'].includes(appointment.status) && (
                        <button
                          onClick={() => openRescheduleModal(appointment)}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Reagendar
                        </button>
                      )}



                      {/* Delete Button - Only valid in Scheduled tab per user request */}
                      {filter === 'scheduled' && (
                        <button
                          onClick={() => handleDeleteClick(appointment)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Reschedule Modal */}
      <Modal
        isOpen={isRescheduleModalOpen}
        onClose={() => setIsRescheduleModalOpen(false)}
        title="Reagendar Cita"
        size="md"
      >
        <form onSubmit={handleReschedule} className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Selecciona la nueva fecha y hora para la cita de <strong>{selectedAppointment?.patient_name}</strong>.
            </p>
            <Input
              label="Nueva Fecha y Hora"
              name="newDate"
              type="datetime-local"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsRescheduleModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
            >
              Guardar Cambios
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Eliminar Cita"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            ¿Estás seguro de que deseas eliminar la cita de <strong>{appointmentToDelete?.patient_name}</strong>? Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
              onClick={confirmDelete}
            >
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
