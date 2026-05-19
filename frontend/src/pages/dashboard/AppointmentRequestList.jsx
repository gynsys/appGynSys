import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { appointmentService } from '../../services/appointmentService';
import { useToastStore } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';
import { 
  FiCalendar, FiPhone, FiMail, FiCreditCard, 
  FiBriefcase, FiMapPin, FiClock, FiCheck, 
  FiX, FiMessageCircle, FiChevronRight 
} from 'react-icons/fi';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import GynSysLoader from '../../components/common/GynSysLoader';

export default function AppointmentRequestList() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const primaryColor = user?.theme_primary_color || '#4F46E5';
  const { success, error: toastError } = useToastStore();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await appointmentService.getAppointments();
      // Filter for scheduled (pending) status
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
    if (!selectedApp || !newDate) return;

    try {
      setIsActionLoading(true);
      await appointmentService.updateAppointment(selectedApp.id, {
        appointment_date: new Date(newDate).toISOString(),
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

    const dateStr = new Date(app.appointment_date).toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
    const timeStr = new Date(app.appointment_date).toLocaleTimeString('es-ES', {
      hour: 'numeric',
      minute: '2-digit'
    });

    const slug = user?.slug_url || 'admin';
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

  if (loading) return <GynSysLoader />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <div className="max-w-xl mx-auto px-4 py-6">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
              <FiMessageCircle className="text-indigo-500" /> Solicitudes
            </h1>
            <p className="text-sm text-gray-500">Gestiona nuevas citas pendientes</p>
          </div>
          <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full text-xs font-bold">
            {requests.length} Pendientes
          </span>
        </header>

        {requests.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiCheck className="text-gray-300 w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">¡Todo al día!</h3>
            <p className="text-gray-500 text-sm mt-2">No tienes nuevas solicitudes de cita pendientes.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((app) => (
              <button
                key={app.id}
                onClick={() => setSelectedApp(app)}
                className="w-full text-left bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm active:scale-95 transition-all flex items-center justify-between hover:border-indigo-300 dark:hover:border-indigo-700"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 dark:text-white truncate">{app.patient_name}</h4>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <FiCalendar className="text-indigo-400" /> {new Date(app.appointment_date).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <FiClock className="text-indigo-400" /> {new Date(app.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                <FiChevronRight className="text-gray-300 w-5 h-5" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Summary Drawer/Modal */}
      <Modal
        isOpen={!!selectedApp}
        onClose={() => setSelectedApp(null)}
        title="Detalles de Solicitud"
        size="md"
      >
        {selectedApp && (
          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-black text-xl">
                  {selectedApp.patient_name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white">{selectedApp.patient_name}</h3>
                  <p className="text-xs text-gray-500">Solicitado el {formatDate(selectedApp.created_at)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm">
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

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold mb-1">
                  <FiCalendar /> {formatDate(selectedApp.appointment_date)}
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-2">
                  <FiMapPin /> {selectedApp.location || 'Sede Principal'}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={() => handleWhatsApp(selectedApp)}
                className="w-full justify-center gap-2 py-4 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-black"
                disabled={isActionLoading}
              >
                <FiMessageCircle size={20} /> Confirmar vía WhatsApp
              </Button>
              
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="secondary"
                  onClick={() => {
                    const date = new Date(selectedApp.appointment_date);
                    const offset = date.getTimezoneOffset() * 60000;
                    const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, 16);
                    setNewDate(localISOTime);
                    setIsRescheduleOpen(true);
                  }}
                  className="justify-center gap-2 rounded-2xl border-indigo-200 text-indigo-600 dark:text-indigo-400 py-3"
                  disabled={isActionLoading}
                >
                  Reagendar
                </Button>
                <Button 
                  variant="secondary"
                  onClick={() => handleStatusChange(selectedApp.id, 'cancelled')}
                  className="justify-center gap-2 rounded-2xl border-red-200 text-red-500 py-3"
                  disabled={isActionLoading}
                >
                  <FiX /> Cancelar
                </Button>
              </div>

              <Button 
                onClick={() => handleStatusChange(selectedApp.id, 'confirmed')}
                className="w-full justify-center gap-2 py-3 rounded-2xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={isActionLoading}
              >
                Confirmar en Sistema
              </Button>
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
          <Input
            label="Nueva Fecha y Hora"
            type="datetime-local"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            required
          />
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
    </div>
  );
}
