import { useState, useEffect } from 'react'
import Modal from '../common/Modal'
import Button from '../common/Button'
import { useToastStore } from '../../store/toastStore'
import { appointmentService } from '../../services/appointmentService'
import { locationService } from '../../services/locationService'
import { useAuthStore } from '../../store/authStore'
import { MdCalendarToday, MdAccessTime, MdLocationOn, MdPerson, MdCheckCircle } from 'react-icons/md'

// --- Helpers ported from ChatBooking.jsx ---

const parseAllowedDays = (scheduleString) => {
  if (!scheduleString) return [1, 2, 3, 4, 5];
  const s = scheduleString.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const days = new Set();
  const has = (word) => new RegExp(`\\b${word}\\b`).test(s);
  const hasPartial = (str) => s.includes(str);

  if (hasPartial('lunes a viernes') || hasPartial('l-v') || hasPartial('l a v')) {
    [1, 2, 3, 4, 5].forEach(d => days.add(d));
  }
  if (has('lunes') || has('lun') || has('lu')) days.add(1);
  if (has('martes') || has('mar') || has('ma')) days.add(2);
  if (has('miercoles') || has('mie') || has('mi')) days.add(3);
  if (has('jueves') || has('jue') || has('ju')) days.add(4);
  if (has('viernes') || has('vie') || has('vi')) days.add(5);
  if (hasPartial('sabado') || has('sab') || has('sa')) days.add(6);
  if (hasPartial('domingo') || has('dom') || has('do')) days.add(0);

  if (days.size === 0) return [1, 2, 3, 4, 5];
  return Array.from(days).sort();
};

const generateSmartDates = (allowedDays, count = 5) => {
  const dates = [];
  let current = new Date();
  current.setDate(current.getDate() + 1);
  let safety = 0;
  while (dates.length < count && safety < 30) {
    if (allowedDays.includes(current.getDay())) {
      dates.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
    safety++;
  }
  return dates;
};

const parseTimeRange = (timeStr) => {
  if (!timeStr) return null;
  const s = timeStr.toLowerCase().replace(/\s/g, '');
  const match = s.match(/(\d{1,2})(?::00)?(?:am|pm)?(?:-|a|to)(\d{1,2})(?::00)?(am|pm)?/);
  if (match) {
    let start = parseInt(match[1]);
    let end = parseInt(match[2]);
    const endAmpm = match[3];
    if (endAmpm === 'pm' && end < 12) end += 12;
    return { start, end };
  }
  return null;
}

const generateSmartTimes = (scheduleStr) => {
  const defaultSlots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
  if (!scheduleStr) return defaultSlots;
  const range = parseTimeRange(scheduleStr);
  if (!range) return defaultSlots;
  const { start, end } = range;
  const slots = [];
  for (let h = start; h < end; h++) {
    slots.push(`${h.toString().padStart(2, '0')}:00`);
  }
  return slots.length > 0 ? slots : defaultSlots;
}

const capitalizeWords = (str) => {
  if (!str) return '';
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

export default function AppointmentRequestModal({ isOpen, onClose, doctorId, doctorSlug, primaryColor = '#4F46E5' }) {
  const { cycleUser } = useAuthStore()
  const { showToast } = useToastStore()
  
  const [loading, setLoading] = useState(false)
  const [locations, setLocations] = useState([])
  const [suggestedDates, setSuggestedDates] = useState([])
  const [suggestedTimes, setSuggestedTimes] = useState([])
  const [bookedTimes, setBookedTimes] = useState([])
  const [isVerifying, setIsVerifying] = useState(false)
  const [status, setStatus] = useState('editing') // 'editing', 'success'

  const [formData, setFormData] = useState({
    patient_name: '',
    patient_email: '',
    patient_phone: '',
    patient_dni: '',
    patient_age: '',
    residence: '',
    occupation: '',
    appointment_type: 'Consulta Presencial',
    reason_for_visit: 'Control Ginecologico',
    location: '',
    date_part: '',
    time_part: '',
  })

  // Load locations on mount
  useEffect(() => {
    const fetchLocations = async () => {
      if (doctorSlug && isOpen) {
        try {
          const data = await locationService.getPublicLocations(doctorSlug)
          setLocations(data || [])
          if (data && data.length > 0) {
            setFormData(prev => ({ ...prev, location: data[0].name }))
            updateSmartSchedules(data[0])
          }
        } catch (err) {
          console.error("Error fetching locations", err)
        }
      }
    }
    fetchLocations()
  }, [doctorSlug, isOpen])

  // Pre-fill if logged in
  useEffect(() => {
    if (cycleUser && isOpen) {
      setFormData(prev => ({
        ...prev,
        patient_name: prev.patient_name || cycleUser.nombre_completo || '',
        patient_email: prev.patient_email || cycleUser.email || '',
      }))
      if (cycleUser.email && !formData.patient_email) {
        handleVerification(cycleUser.email, 'email')
      }
    }
  }, [cycleUser, isOpen])

  const updateSmartSchedules = (loc) => {
    const scheduleStr = loc?.schedule?.label || loc?.schedule || ''
    const allowedDays = parseAllowedDays(scheduleStr)
    const dates = generateSmartDates(allowedDays)
    setSuggestedDates(dates)
    
    const times = generateSmartTimes(scheduleStr)
    setSuggestedTimes(times)
  }

  const handleLocationChange = (locName) => {
    const loc = locations.find(l => l.name === locName)
    setFormData(prev => ({ ...prev, location: locName, date_part: '', time_part: '' }))
    if (loc) {
      updateSmartSchedules(loc)
    }
  }

  const handleDateChange = async (date) => {
    setFormData(prev => ({ ...prev, date_part: date, time_part: '' }))
    if (date && doctorId) {
      try {
        const booked = await appointmentService.getBookedTimes(doctorId, date)
        const localBooked = booked.map(iso => {
          const d = new Date(iso)
          return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
        })
        setBookedTimes(localBooked)
      } catch (err) {
        console.error("Error fetching booked times", err)
      }
    }
  }

  const handleVerification = async (value, field) => {
    if (!value || value.length < 5) return
    setIsVerifying(true)
    try {
      let result = null
      if (field === 'dni') {
        result = await appointmentService.checkPatient(formData.patient_name, value)
      } else {
        result = await appointmentService.getPatientByEmail(value)
      }

      if (result && (result.exists || result.patient_data)) {
        const pd = result.patient_data || result
        setFormData(prev => ({
          ...prev,
          patient_name: prev.patient_name || pd.patient_name || '',
          patient_phone: prev.patient_phone || pd.patient_phone || '',
          patient_email: prev.patient_email || pd.patient_email || pd.email || '',
          patient_dni: prev.patient_dni || pd.patient_dni || pd.ci || '',
          patient_age: prev.patient_age || pd.patient_age || pd.age || '',
          residence: prev.residence || pd.residence || '',
          occupation: prev.occupation || pd.occupation || ''
        }))
        showToast('Datos de paciente encontrados y cargados.', 'success')
      }
    } catch (err) {
      console.warn("Verification failed", err)
    } finally {
      setIsVerifying(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!formData.date_part || !formData.time_part || !formData.location) {
      showToast('Por favor selecciona sede, fecha y hora para tu cita.', 'error')
      return
    }

    setLoading(true)
    try {
      // Combine date and time
      const appointment_date = `${formData.date_part}T${formData.time_part}:00`
      
      // Prepare clean payload for backend
      const { date_part, time_part, ...cleanData } = formData
      const payload = {
        ...cleanData,
        doctor_id: parseInt(doctorId),
        appointment_date,
        patient_name: capitalizeWords(formData.patient_name),
        patient_age: formData.patient_age ? parseInt(formData.patient_age) : null
      }

      // Direct appointment creation
      await appointmentService.createAppointment(payload)
      
      const successMsg = '¡Cita solicitada con éxito! Revisa tu correo.'
      showToast(successMsg, 'success')
      
      setStatus('success')
      
      setTimeout(() => {
        onClose()
        // Reset status after closing delay for next time modal opens
        setTimeout(() => setStatus('editing'), 500)
      }, 4000)
    } catch (error) {
      console.error("Booking error:", error)
      let errorMsg = 'Error al agendar la cita. Intenta de nuevo.'
      
      if (error.response?.status === 422) {
        const detail = error.response.data?.detail
        if (Array.isArray(detail)) {
          errorMsg = `Error de validación: ${detail.map(d => d.msg).join(', ')}`
        } else if (typeof detail === 'string') {
          errorMsg = detail
        }
      } else if (error.response?.data?.detail) {
        errorMsg = error.response.data.detail
      }

      showToast(errorMsg, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={status === 'editing' ? "Agendar Cita Médica" : null}>
      <div className="max-h-[75vh] overflow-y-auto px-1 custom-scrollbar">
        {status === 'editing' ? (
          <form onSubmit={handleSubmit} className="space-y-6 py-2">
            
            {/* Section: Patient Identity */}
            <div className="space-y-4">
              <h4 className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-wider">
                <MdPerson className="text-lg" style={{ color: primaryColor }} /> Datos Personales
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nombre Completo</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={formData.patient_name}
                      onChange={(e) => setFormData({...formData, patient_name: e.target.value})}
                      className="w-full rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm p-3 focus:ring-2"
                      style={{ '--tw-ring-color': primaryColor }}
                      placeholder="Ej. Ana María Pérez"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Cédula / DNI</label>
                  <input
                    type="text"
                    required
                    value={formData.patient_dni}
                    onChange={(e) => setFormData({...formData, patient_dni: e.target.value})}
                    onBlur={() => handleVerification(formData.patient_dni, 'dni')}
                    className="w-full rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm p-3 focus:ring-2"
                    style={{ '--tw-ring-color': primaryColor }}
                    placeholder="Número de identificación"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    required
                    value={formData.patient_email}
                    onChange={(e) => setFormData({...formData, patient_email: e.target.value})}
                    onBlur={() => handleVerification(formData.patient_email, 'email')}
                    className="w-full rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm p-3 focus:ring-2"
                    style={{ '--tw-ring-color': primaryColor }}
                    placeholder="ejemplo@correo.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Teléfono (WhatsApp)</label>
                  <input
                    type="tel"
                    required
                    value={formData.patient_phone}
                    onChange={(e) => setFormData({...formData, patient_phone: e.target.value})}
                    className="w-full rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm p-3 focus:ring-2"
                    style={{ '--tw-ring-color': primaryColor }}
                    placeholder="Ej. 04141234567"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Edad</label>
                  <input
                    type="number"
                    required
                    value={formData.patient_age}
                    onChange={(e) => setFormData({...formData, patient_age: e.target.value})}
                    className="w-full rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm p-3 focus:ring-2"
                    style={{ '--tw-ring-color': primaryColor }}
                    placeholder="Ej. 28"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Ciudad de Residencia</label>
                  <input
                    type="text"
                    required
                    value={formData.residence}
                    onChange={(e) => setFormData({...formData, residence: e.target.value})}
                    className="w-full rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm p-3 focus:ring-2"
                    style={{ '--tw-ring-color': primaryColor }}
                    placeholder="Ej. Caracas"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Ocupación</label>
                <input
                  type="text"
                  value={formData.occupation}
                  onChange={(e) => setFormData({...formData, occupation: e.target.value})}
                  className="w-full rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm p-3 focus:ring-2"
                  style={{ '--tw-ring-color': primaryColor }}
                  placeholder="¿A qué se dedica?"
                />
              </div>
            </div>

            <hr className="border-gray-100 dark:border-gray-700" />

            {/* Section: Appointment Details */}
            <div className="space-y-4">
              <h4 className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-wider">
                <MdLocationOn className="text-lg" style={{ color: primaryColor }} /> Detalles de la Cita
              </h4>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Sede de Atención</label>
                <select
                  required
                  value={formData.location}
                  onChange={(e) => handleLocationChange(e.target.value)}
                  className="w-full rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm p-3 focus:ring-2"
                  style={{ '--tw-ring-color': primaryColor }}
                >
                  {locations.length > 0 ? (
                    locations.map(loc => (
                      <option key={loc.id} value={loc.name}>{loc.name}</option>
                    ))
                  ) : (
                    <option value="">Cargando sedes...</option>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Tipo de Consulta</label>
                  <select
                    required
                    value={formData.appointment_type}
                    onChange={(e) => setFormData({...formData, appointment_type: e.target.value})}
                    className="w-full rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm p-3 focus:ring-2"
                    style={{ '--tw-ring-color': primaryColor }}
                  >
                    <option value="Consulta Presencial">Consulta Presencial</option>
                    <option value="Control">Control / Seguimiento</option>
                    <option value="Procedimiento">Procedimiento</option>
                    <option value="Resultados">Entrega de Resultados</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Motivo de la Cita</label>
                  <select
                    required
                    value={formData.reason_for_visit}
                    onChange={(e) => setFormData({...formData, reason_for_visit: e.target.value})}
                    className="w-full rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm p-3 focus:ring-2"
                    style={{ '--tw-ring-color': primaryColor }}
                  >
                    <option value="Control Ginecologico">Control Ginecologico</option>
                    <option value="Control Prenatal">Control Prenatal</option>
                    <option value="Dolor pelvico">Dolor pelvico</option>
                    <option value="Sangrado">Sangrado Anormal</option>
                    <option value="Infertilidad">Evaluación Fertilidad</option>
                    <option value="VPH">VPH / Citología</option>
                    <option value="Otro">Otro Motivo</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-bold text-gray-400 uppercase">Selecciona el Día</label>
                <div className="flex flex-wrap gap-2">
                  {suggestedDates.map((date, idx) => {
                    const iso = date.toISOString().split('T')[0]
                    const isSelected = formData.date_part === iso
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleDateChange(iso)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                          isSelected 
                            ? 'bg-primary-500 text-white border-transparent' 
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-primary-300'
                        }`}
                        style={{ 
                          backgroundColor: isSelected ? primaryColor : undefined,
                          borderColor: isSelected ? primaryColor : undefined
                        }}
                      >
                        <div className="flex flex-col items-center">
                          <span>{['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][date.getDay()]}</span>
                          <span className="text-sm">{date.getDate()}</span>
                        </div>
                      </button>
                    )
                  })}
                  <div className="relative">
                     <input 
                      type="date"
                      className="absolute inset-0 opacity-0 cursor-pointer w-full"
                      onChange={(e) => handleDateChange(e.target.value)}
                     />
                     <div className="px-4 py-2 rounded-xl text-xs font-bold border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center min-w-[60px] h-full">
                        <MdCalendarToday className="text-lg" />
                        <span className="mt-0.5">Otro</span>
                     </div>
                  </div>
                </div>
                {formData.date_part && (
                  <p className="text-[10px] text-primary-600 font-bold uppercase italic">
                    Fecha seleccionada: {new Date(formData.date_part + 'T12:00:00').toLocaleDateString('es-ES', { dateStyle: 'long' })}
                  </p>
                )}
              </div>

              {formData.date_part && (
                <div className="space-y-3 animate-fade-in">
                  <label className="block text-xs font-bold text-gray-400 uppercase">Selecciona la Hora</label>
                  <div className="flex flex-wrap gap-2">
                    {suggestedTimes.map((time, idx) => {
                      const isBooked = bookedTimes.includes(time)
                      const isSelected = formData.time_part === time
                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={isBooked}
                          onClick={() => setFormData({...formData, time_part: time})}
                          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                            isSelected 
                              ? 'text-white border-transparent' 
                              : isBooked 
                                ? 'bg-gray-100 text-gray-300 border-gray-100 cursor-not-allowed'
                                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-primary-300'
                          }`}
                          style={{ 
                            backgroundColor: isSelected ? primaryColor : undefined,
                          }}
                        >
                          {time}
                        </button>
                      )
                    })}
                    <div className="relative">
                      <input 
                        type="time"
                        className="absolute inset-0 opacity-0 cursor-pointer w-full"
                        onChange={(e) => setFormData({...formData, time_part: e.target.value})}
                      />
                      <div className="px-4 py-2 rounded-xl text-sm font-bold border border-gray-200 dark:border-gray-700 flex items-center gap-2">
                          <MdAccessTime />
                          <span>Otra</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100 dark:border-gray-700 sticky bottom-0 bg-white dark:bg-gray-800 pb-2">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={loading || !formData.date_part || !formData.time_part} 
                primaryColor={primaryColor}
                className="px-8"
              >
                {loading ? 'Procesando...' : 'Confirmar Cita'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center animate-fade-in bg-white dark:bg-gray-800 min-h-[400px]">
            <MdCheckCircle size={80} style={{ color: primaryColor }} className="mb-6 drop-shadow-md animate-bounce" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">¡Solicitud Enviada!</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-xs mx-auto">
              Tu cita ha sido registrada con éxito. Te contactaremos pronto para confirmarla.
            </p>
            <p className="text-sm text-gray-400 animate-pulse">Cerrando en unos segundos...</p>
          </div>
        )}
      </div>
    </Modal>
  )
}
