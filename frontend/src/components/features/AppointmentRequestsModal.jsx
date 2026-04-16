import React, { useState, useEffect } from 'react';
import { appointmentService } from '../../services/appointmentService';
import { useToastStore } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';
import { 
  FiCalendar, FiPhone, FiCreditCard, 
  FiBriefcase, FiMapPin, FiClock, FiCheck, 
  FiMessageCircle, FiChevronRight, FiBell,
  FiActivity, FiFileText, FiTrash2
} from 'react-icons/fi';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';

export default function AppointmentRequestsModal({ isOpen, onClose, doctorSlug }) {
  const { user } = useAuthStore();
  const { success, error: toastError } = useToastStore();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadRequests();
    }
  }, [isOpen]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await appointmentService.getAppointments();
      const pending = data
        .filter(a => a.status === 'scheduled')
        .sort((a, b) => new Date(b.created_at || b.appointment_date) - new Date(a.created_at || a.appointment_date));
      setRequests(pending);
    } catch (err) {
      toastError("Error al cargar solicitudes");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      setIsActionLoading(true);
      await appointmentService.updateAppointment(id, { status: newStatus });
      success(`Cita ${newStatus === 'confirmed' ? 'confirmada' : 'actualizada'}`);
      setSelectedApp(null);
      loadRequests();
    } catch (err) {
      toastError("Error al actualizar estado");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReschedule = async (e) => {
    e.preventDefault();
    if (!selectedApp || !rescheduleDate || !rescheduleTime) return;

    try {
      // Combine date and time
      const datetime = new Date(`${rescheduleDate}T${rescheduleTime}`);
      await appointmentService.updateAppointment(selectedApp.id, {
        appointment_date: datetime.toISOString(),
      });
      success("Cita reagendada exitosamente");
      setIsRescheduleOpen(false);
      setSelectedApp(null);
      loadRequests();
    } catch (err) {
      toastError("Error al reagendar cita");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleWhatsApp = (app) => {
    if (!app.patient_phone) {
      toastError("La paciente no registró un número de teléfono");
      return;
    }

    const slug = doctorSlug || user?.slug_url || 'admin';
    const onboardingUrl = `https://gynsys.net/${slug}/onboarding`;

    const message = `Hola ${app.patient_name}! Te informo que he confirmado tu solicitud de cita. Para aprovechar al máximo el tiempo en consulta, por favor realiza la preconsulta ingresando aquí: ${onboardingUrl}`;
    const encodedMsg = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${app.patient_phone.replace(/\D/g, '')}?text=${encodedMsg}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Intl.DateTimeFormat('es-VE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(new Date(dateString));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Solicitudes de Cita"
      size="lg"
      fullScreenOnMobile
    >
      <div className="max-w-full mx-auto pb-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mb-4"></div>
            <p className="text-gray-500 text-sm">Cargando solicitudes...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-12 text-center border border-gray-100 dark:border-gray-700">
            <div className="w-16 h-16 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <FiCheck className="text-green-500 w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">¡Todo al día!</h3>
            <p className="text-gray-500 text-sm mt-2">No tienes nuevas solicitudes de cita pendientes.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {requests.map((app) => (
              <button
                key={app.id}
                onClick={() => setSelectedApp(app)}
                className="w-full text-left bg-white dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm active:scale-95 transition-all flex items-center justify-between hover:border-indigo-300 dark:hover:border-indigo-700"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 dark:text-white truncate">{app.patient_name}</h4>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <FiCalendar className="text-indigo-400" /> {new Date(app.appointment_date).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <FiClock className="text-indigo-400" /> {new Date(app.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                <FiChevronRight className="text-gray-300 w-5 h-5 flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Detail Child Modal */}
      <Modal
        isOpen={!!selectedApp}
        onClose={() => setSelectedApp(null)}
        title="Detalles de Solicitud"
        size="md"
        fullScreenOnMobile
      >
        {selectedApp && (
          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-black text-xl">
                  {selectedApp.patient_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white">{selectedApp.patient_name}</h3>
                  <p className="text-xs text-gray-500">Solicitado el {formatDate(selectedApp.created_at)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <FiCreditCard className="flex-shrink-0" /> <span className="truncate">{selectedApp.patient_dni || 'Sin Cédula'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <FiPhone className="flex-shrink-0" /> <span className="truncate">{selectedApp.patient_phone || 'Sin Teléfono'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <FiMapPin className="flex-shrink-0" /> <span className="truncate">{selectedApp.residence || 'Sin Zona'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <FiBriefcase className="flex-shrink-0" /> <span className="truncate">{selectedApp.occupation || 'Sin Ocupación'}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold">
                  <FiCalendar /> {formatDate(selectedApp.appointment_date)}
                </div>
                
                {selectedApp.appointment_type && (
                  <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <FiActivity className="text-gray-400" />
                    <span className="font-semibold text-gray-500">Tipo:</span> {selectedApp.appointment_type}
                  </div>
                )}
                
                {selectedApp.reason_for_visit && (
                  <div className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <FiFileText className="text-gray-400 mt-1" />
                    <div>
                      <span className="font-semibold text-gray-500">Motivo:</span> {selectedApp.reason_for_visit}
                    </div>
                  </div>
                )}

                <div className="text-xs flex items-center gap-2 font-medium text-gray-900 dark:text-gray-100">
                  <FiMapPin className="text-indigo-500" /> 
                  <span>Sede: {selectedApp.location || 'Sede Principal (Legacy)'}</span>
                </div>

                {selectedApp.notes && (
                  <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-xs text-amber-800 dark:text-amber-200 border border-amber-100 dark:border-amber-900/30 italic">
                    <span className="font-bold not-italic block mb-1 uppercase tracking-wider text-[10px]">Nota:</span>
                    {selectedApp.notes}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={async () => {
                  try {
                    setIsActionLoading(true);
                    // Silently confirm in system to trigger backend emails
                    await appointmentService.updateAppointment(selectedApp.id, { status: 'confirmed' });
                    // Open WhatsApp
                    handleWhatsApp(selectedApp);
                    success("Cita confirmada y link de preconsulta enviado por correo");
                    setSelectedApp(null);
                    loadRequests();
                  } catch (err) {
                    toastError("Error al confirmar cita");
                  } finally {
                    setIsActionLoading(false);
                  }
                }}
                className="w-full justify-center gap-2 py-4 rounded-2xl text-white font-black border-none shadow-lg transform active:scale-95 transition-all"
                style={{ backgroundColor: '#25D366' }}
                disabled={isActionLoading}
              >
                <FiMessageCircle size={24} /> Confirmar vía WhatsApp
              </Button>
              
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="secondary"
                  onClick={() => {
                    const date = new Date(selectedApp.appointment_date);
                    const offset = date.getTimezoneOffset() * 60000;
                    const localDate = new Date(date.getTime() - offset);
                    
                    setRescheduleDate(localDate.toISOString().split('T')[0]);
                    setRescheduleTime(localDate.toISOString().split('T')[1].slice(0, 5));
                    setIsRescheduleOpen(true);
                  }}
                  className="justify-center gap-2 rounded-2xl border-indigo-200 text-indigo-600 dark:text-indigo-400 py-4 text-sm font-bold"
                  disabled={isActionLoading}
                >
                  Reagendar
                </Button>
                <Button 
                  variant="secondary"
                  onClick={async () => {
                    if (window.confirm("¿Estás seguro de que deseas eliminar esta solicitud?")) {
                      try {
                        setIsActionLoading(true);
                        await appointmentService.deleteAppointment(selectedApp.id);
                        success("Solicitud eliminada");
                        setSelectedApp(null);
                        loadRequests();
                      } catch (err) {
                        toastError("Error al eliminar solicitud");
                      } finally {
                        setIsActionLoading(false);
                      }
                    }
                  }}
                  className="justify-center gap-2 rounded-2xl border-red-200 text-red-500 py-4 text-sm font-bold"
                  disabled={isActionLoading}
                >
                  <FiTrash2 /> Eliminar
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Reschedule Internal Modal */}
      <Modal
        isOpen={isRescheduleOpen}
        onClose={() => setIsRescheduleOpen(false)}
        title="Reagendar Cita"
        size="sm"
      >
        <form onSubmit={handleReschedule} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <Input
              label="Fecha"
              type="date"
              value={rescheduleDate}
              onChange={(e) => setRescheduleDate(e.target.value)}
              required
            />
            <Input
              label="Hora"
              type="time"
              value={rescheduleTime}
              onChange={(e) => setRescheduleTime(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsRescheduleOpen(false)}>
              Volver
            </Button>
            <Button type="submit" disabled={isActionLoading}>
              {isActionLoading ? 'Guardando...' : 'Reagendar'}
            </Button>
          </div>
        </form>
      </Modal>
    </Modal>
  );
}
