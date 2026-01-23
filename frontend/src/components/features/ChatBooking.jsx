import { useState, useEffect, useRef } from 'react';
import { getImageUrl } from '../../lib/imageUtils';
import PropTypes from 'prop-types';
import Button from '../common/Button';
import { appointmentService } from '../../services/appointmentService';
import { locationService } from '../../services/locationService';
import ModernLoader from '../common/ModernLoader';
import { MdSend, MdCalendarToday, MdAccessTime, MdCheckCircle } from 'react-icons/md';

// Helper: Parse Schedule String to Allowed Days (0=Sun, 1=Mon, ..., 6=Sat)
const parseAllowedDays = (scheduleString) => {
  if (!scheduleString) return [1, 2, 3, 4, 5]; // Default M-F

  const s = scheduleString.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Normalize accents (Sábado -> Sabado)
  const days = new Set();

  // Regex helpers for whole words
  const has = (word) => new RegExp(`\\b${word}\\b`).test(s);
  const hasPartial = (str) => s.includes(str);

  // 1. Check Ranges first
  if (hasPartial('lunes a viernes') || hasPartial('l-v') || hasPartial('l a v')) {
    [1, 2, 3, 4, 5].forEach(d => days.add(d));
  }

  // 2. Check individual days
  if (has('lunes') || has('lun') || has('lu')) days.add(1);
  if (has('martes') || has('mar') || has('ma')) days.add(2);
  if (has('miercoles') || has('mie') || has('mi')) days.add(3);
  if (has('jueves') || has('jue') || has('ju')) days.add(4);
  if (has('viernes') || has('vie') || has('vi')) days.add(5);
  // "Sabado" might be "Sabados", so check root
  if (hasPartial('sabado') || has('sab') || has('sa')) days.add(6);
  if (hasPartial('domingo') || has('dom') || has('do')) days.add(0);

  // If no specific days found (and not range), fallback to M-F
  // But if we found ANY day, return only those.
  if (days.size === 0) return [1, 2, 3, 4, 5];

  return Array.from(days).sort();
};

// Helper: Generate next N valid dates
const generateSmartDates = (allowedDays, count = 3, startDate = new Date()) => {
  const dates = [];
  let current = new Date(startDate);
  current.setDate(current.getDate() + 1); // Start from tomorrow

  // Safety break to prevent infinite loop if allowedDays is empty
  let safety = 0;
  while (dates.length < count && safety < 30) {
    const day = current.getDay();
    if (allowedDays.includes(day)) {
      dates.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
    safety++;
  }
  return dates;
};

// Helper: Format Date for Button (e.g., "Lun 12")
const formatSmartDate = (date) => {
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  return `${days[date.getDay()]} ${date.getDate()}`;
};

// Helper: Parse hours from string (e.g. "8am a 12pm" -> [8, 12])
const parseTimeRange = (timeStr) => {
  if (!timeStr) return null;
  const s = timeStr.toLowerCase().replace(/\s/g, ''); // remove spaces

  // Regex for "8am-12pm", "8:00-12:00", "8a12"
  // Capture groups: 1=StartHour, 2=StartAmpm, 3=EndHour, 4=EndAmpm
  const match = s.match(/(\d{1,2})(?::00)?(?:am|pm)?(?:-|a|to)(\d{1,2})(?::00)?(am|pm)?/);

  if (match) {
    let start = parseInt(match[1]);
    let end = parseInt(match[2]);
    const endAmpm = match[3]; // often only the end has pm e.g "8-12pm"

    // Basic AM/PM logic
    // If end is small (1, 2, 3, 4, 5) and has pm, add 12.
    if (endAmpm === 'pm' && end < 12) end += 12;
    // If start is small (1-6) and end > 12, start is likely PM too? No, usually 1pm-5pm.
    // Let's assume standard business hours if ambiguous.
    // If 8-12, assume 8am-12pm.

    return { start, end };
  }
  return null;
}

const generateSmartTimes = (scheduleStr) => {
  // Default Slots
  const defaultSlots = ['09:00', '10:00', '14:00', '16:00'];
  if (!scheduleStr) return defaultSlots;

  const range = parseTimeRange(scheduleStr);
  if (!range) return defaultSlots; // Fallback if no range detected

  const { start, end } = range;
  const slots = [];

  // Generate valid hours
  for (let h = start; h < end; h++) {
    // Skip lunch hour? Maybe not logic for now.
    slots.push(`${h.toString().padStart(2, '0')}:00`);
  }

  // If we have too many slots, maybe just pick 4 evenly distributed?
  // For now, return first 4 or all if less.
  return slots.slice(0, 4);
}

// Helper: Capitalize words
const capitalizeWords = (str) => {
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

// Simple Input Component
const SimpleInput = ({ placeholder, onSubmit, type = 'text', autoFocus = true, numericOnly = false, primaryColor }) => {
  const [value, setValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!value.trim()) return;
    onSubmit(value);
    setValue('');
  };

  const handleChange = (e) => {
    let val = e.target.value;
    if (numericOnly) {
      val = val.replace(/[^0-9]/g, ''); // Strip non-numeric chars
    }
    setValue(val);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 w-full">
      <div className="relative flex-1 flex items-center">
        <input
          type={type === 'number' ? 'text' : type}
          inputMode={numericOnly ? 'numeric' : undefined}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-400 dark:border-gray-500 rounded-full px-5 py-3 pr-12 text-sm focus:outline-none focus:ring-2 dark:text-white transition-all shadow-sm"
          style={{
            '--tw-ring-color': primaryColor,
            borderColor: value ? primaryColor : undefined
          }}
          autoFocus={autoFocus}
        />
        <button
          type="submit"
          disabled={!value.trim()}
          className="absolute right-2 p-1.5 rounded-full disabled:opacity-50 disabled:bg-gray-400 flex items-center justify-center shadow-md"
          style={{
            backgroundColor: value.trim() ? primaryColor : '#9CA3AF',
            color: 'white'
          }}
          title="Enviar"
        >
          <MdSend size={18} className={!value.trim() ? "ml-0.5" : ""} />
        </button>
      </div>
    </form>
  );
};

SimpleInput.propTypes = {
  placeholder: PropTypes.string,
  onSubmit: PropTypes.func.isRequired,
  type: PropTypes.string,
  autoFocus: PropTypes.bool,
  numericOnly: PropTypes.bool,
  primaryColor: PropTypes.string.isRequired,
};

export default function ChatBooking({ doctorId, doctor = {}, onClose }) {
  // Brand Color
  const primaryColor = doctor?.theme_primary_color || '#4F46E5';

  // Constants
  const STEPS = {
    NAME: 'NAME',
    DNI: 'DNI',        // Moved up
    AGE: 'AGE',
    RESIDENCE: 'RESIDENCE', // New Step
    TYPE: 'TYPE',
    REASON: 'REASON',
    LOCATION: 'LOCATION',
    DATE_SUGGESTION: 'DATE_SUGGESTION', // Smart Step
    TIME_SUGGESTION: 'TIME_SUGGESTION', // Smart Step
    DATE_MANUAL: 'DATE_MANUAL',         // Fallback
    TIME_MANUAL: 'TIME_MANUAL',         // Fallback
    PHONE: 'PHONE',
    OCCUPATION: 'OCCUPATION',
    EMAIL: 'EMAIL',
    RECURRENT_CONFIRM: 'RECURRENT_CONFIRM', // New Step
    CONFIRM: 'CONFIRM',
    SUCCESS: 'SUCCESS'
  };

  // State
  const [step, setStep] = useState(STEPS.NAME);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState([]);

  // Smart Logic State
  const [suggestedDates, setSuggestedDates] = useState([]);
  const [suggestedTimes, setSuggestedTimes] = useState([]);

  const [formData, setFormData] = useState({
    patient_name: '',
    patient_dni: '',
    patient_age: '',
    residence: '',      // Added residence
    appointment_type: '',
    reason_for_visit: '',
    location: null,
    date_part: '', // YYYY-MM-DD
    time_part: '', // HH:MM
    patient_phone: '',
    occupation: '',
    patient_email: ''
  });

  const messagesEndRef = useRef(null);

  // Initialize Chat
  useEffect(() => {
    let name = doctor?.nombre_completo || 'Doctor';
    const hasTitle = name.toLowerCase().startsWith('dr');
    const isFemale = name.toLowerCase().includes('dra.');
    // Use dynamic prefix and enforce 4 lines for aesthetics
    let finalPrefix = 'de';
    if (isFemale) {
      finalPrefix = 'de la';
    } else if (hasTitle) {
      finalPrefix = 'del';
    }

    setHistory([
      {
        type: 'bot',
        text: `<p class="mb-1">Hola, soy el asistente virtual ${finalPrefix}</p><p class="font-bold mb-1">${name}.</p><p class="mb-1">Para comenzar a agendar tu cita,</p><p class="font-bold">¿podrías indicarme tu nombre completo?</p>`
      }
    ]);
  }, [doctor]);

  // Fetch Locations on Mount
  useEffect(() => {
    const fetchLocations = async () => {
      if (doctor?.slug_url) {
        try {
          const data = await locationService.getPublicLocations(doctor.slug_url);
          setLocations(data || []);
        } catch (err) {
          console.error("Error fetching locations for chatbot", err);
        }
      }
    };
    fetchLocations();
  }, [doctor]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history]);

  const addMessage = (text, type = 'user') => {
    setHistory(prev => [...prev, { type, text }]);
  };

  /* --- Step Handlers --- */

  const handleNameSubmit = (value) => {
    // Validation: No numbers allowed
    if (/\d/.test(value)) {
      addMessage("El nombre no debe contener números. Por favor intenta de nuevo.", 'bot');
      return;
    }
    const capsName = capitalizeWords(value);
    addMessage(capsName, 'user');
    setFormData(prev => ({ ...prev, patient_name: capsName }));
    setTimeout(() => {
      addMessage(`Un gusto Sra. ${capsName}. Por favor indíqueme su número de cédula o DNI`, 'bot');
      setStep(STEPS.DNI);
    }, 600);
  };

  /* --- RECURRENT PATIENT LOGIC --- */

  const handleRecurrentResponse = (response) => {
    // response: 'UPDATE' or 'KEEP'
    if (response === 'KEEP') {
      addMessage("No, mantener datos actuales", 'user');

      // Auto-fill form with stored data has been done in handleDniSubmit _tempData
      // Just ensure it's committed to formData
      setFormData(prev => ({
        ...prev,
        ...prev._tempData, // Apply temp data
        patient_dni: prev.patient_dni, // Ensure DNI is kept
        patient_name: prev.patient_name // Ensure Name is kept
      }));

      setTimeout(() => {
        addMessage("¡Perfecto! Continuemos entonces.", 'bot');
        // SKIP to Type
        setStep(STEPS.TYPE);
        setTimeout(() => {
          addMessage("¿Qué tipo de consulta deseas agendar?", 'bot');
        }, 500);
      }, 600);

    } else {
      addMessage("Sí, quiero actualizar", 'user');
      setTimeout(() => {
        addMessage("Entendido. Actualicemos su información. ¿Podría indicarme su edad?", 'bot');
        setStep(STEPS.AGE);
      }, 600);
    }
  };

  const handleDniSubmit = async (value) => {
    // Validation: Min 7 digits (millions)
    const digits = value.replace(/\D/g, '');
    if (digits.length < 7) {
      addMessage("La cédula debe tener al menos 7 dígitos (millones). Por favor revisa.", 'bot');
      return;
    }

    addMessage(value, 'user');
    setFormData(prev => ({ ...prev, patient_dni: value }));

    // Check if patient exists (Recurrent Check)
    let recurrentData = null;
    try {
      const checkPromise = appointmentService.checkPatient(formData.patient_name, value);
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2500));

      const result = await Promise.race([checkPromise, timeoutPromise]);
      if (result && result.exists && result.patient_data) {
        recurrentData = result.patient_data;
      }
    } catch (err) {
      console.warn("Patient verification skipped/failed:", err);
    }

    if (recurrentData) {
      // Store found data temporarily
      setFormData(prev => ({ ...prev, _tempData: recurrentData }));

      setTimeout(() => {
        addMessage(`¡Bienvenida nuevamente Sra. ${recurrentData.patient_name}!`, 'bot');

        // Show summary of known data
        const summaryHtml = `
          <p class="mb-2">Veo que ya tienes historia con nosotros,</p>
          <p class="font-bold">¿Desea actualizar algún dato?</p>
        `;

        setTimeout(() => {
          addMessage(summaryHtml, 'bot');
          setStep(STEPS.RECURRENT_CONFIRM); // NEW STATE
        }, 600);
      }, 600);

      return; // STOP HERE if recurrent
    }

    // New Patient Flow (Normal)
    setTimeout(() => {
      addMessage("¿Podría indicarme su edad?", 'bot');
      setStep(STEPS.AGE);
    }, 1200);
  };

  const handleAgeSubmit = (value) => {
    addMessage(value, 'user');
    setFormData(prev => ({ ...prev, patient_age: value }));
    setTimeout(() => {
      addMessage("¿En qué zona reside actualmente?", 'bot');
      setStep(STEPS.RESIDENCE); // Go to Residence
    }, 600);
  };

  const handleResidenceSubmit = (value) => {
    addMessage(value, 'user');
    setFormData(prev => ({ ...prev, residence: value }));
    setTimeout(() => {
      addMessage("¿Qué tipo de consulta deseas agendar?", 'bot');
      setStep(STEPS.TYPE);
    }, 600);
  };

  const handleTypeSelect = (type) => {
    addMessage(type, 'user');
    setFormData(prev => ({ ...prev, appointment_type: type }));
    setTimeout(() => {
      addMessage("Entendido. ¿Cuál es el motivo de tu consulta?", 'bot');
      setStep(STEPS.REASON);
    }, 600);
  };

  const handleReasonSelect = (value) => {
    addMessage(value, 'user');
    setFormData(prev => ({ ...prev, reason_for_visit: value }));
    setTimeout(() => {
      if (locations.length > 0) {
        addMessage("Perfecto. ¿En qué sede te gustaría ser atendida?", 'bot');
        setStep(STEPS.LOCATION);
      } else {
        addMessage("¿En qué sede te gustaría ser atendida? (Escribe el nombre)", 'bot');
        setStep(STEPS.LOCATION);
      }
    }, 600);
  };

  const handleLocationSelect = (loc) => {
    const locName = typeof loc === 'string' ? loc : loc.name;
    const scheduleStr = typeof loc !== 'string' ? (loc.schedule?.label || loc.schedule) : '';

    addMessage(locName, 'user');

    // Extract days text (heuristic: take everything before the first digit)
    // e.g. "Lunes a Viernes 8am" -> "Lunes a Viernes"
    let daysText = "los días de consulta";
    if (scheduleStr) {
      const match = scheduleStr.match(/^([^\d]+)/);
      if (match) {
        daysText = match[1].replace(/[:|-]$/, '').trim(); // Remove trailing colon/dash
      }
    }

    // Generate Smart Logic
    if (typeof loc !== 'string') {
      const allowedDays = parseAllowedDays(scheduleStr);
      const suggestions = generateSmartDates(allowedDays);
      setSuggestedDates(suggestions);
      setFormData(prev => ({ ...prev, location: locName, _tempSchedule: scheduleStr }));
    } else {
      setSuggestedDates(generateSmartDates([1, 2, 3, 4, 5]));
      setFormData(prev => ({ ...prev, location: locName, _tempSchedule: '' }));
    }

    setTimeout(() => {
      const firstName = formData.patient_name.split(' ')[0];
      // Updated Message: "Sra. {name}, para {sede} las consultas son {dias}, le mostraré..."
      addMessage(`Sra. ${firstName}, para ${locName} las consultas son ${daysText}, le mostraré los dias disponibles para su cita:`, 'bot');
      setStep(STEPS.DATE_SUGGESTION);
    }, 800);
  };

  const handleLocationTextSubmit = (value) => {
    handleLocationSelect(value);
  }

  // --- Date Handling ---

  const handleSmartDateSelect = (dateObj) => {
    const readable = dateObj.toLocaleDateString();
    const isoDate = dateObj.toISOString().split('T')[0];

    addMessage(readable, 'user');
    setFormData(prev => ({ ...prev, date_part: isoDate }));

    // Generate Smart Times
    const smartTimes = generateSmartTimes(formData._tempSchedule);
    setSuggestedTimes(smartTimes);

    setTimeout(() => {
      const nameParts = formData.patient_name.split(' ');
      const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : nameParts[0];
      addMessage(`Perfecto Sra. ${lastName}, ¿A qué hora le gustaría su cita?`, 'bot');
      setStep(STEPS.TIME_SUGGESTION);
    }, 600);
  };

  const handleManualDateTrigger = () => {
    addMessage("Elegir otra fecha...", 'user');
    setTimeout(() => {
      addMessage("Por favor selecciona la fecha en el calendario.", 'bot');
      setStep(STEPS.DATE_MANUAL);
    }, 500);
  }

  const handleManualDateSubmit = (val) => {
    // val is YYYY-MM-DD
    const [y, m, d] = val.split('-');
    const readable = `${d}/${m}/${y}`;
    addMessage(readable, 'user');
    setFormData(prev => ({ ...prev, date_part: val }));

    setTimeout(() => {
      const nameParts = formData.patient_name.split(' ');
      const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : nameParts[0];
      addMessage(`Perfecto Sra. ${lastName}, ¿A qué hora le gustaría su cita?`, 'bot');
      // Just go to manual time for manual dates to be safe
      setStep(STEPS.TIME_MANUAL);
    }, 600);
  }

  // --- Time Handling ---

  const handleSmartTimeSelect = (timeStr) => {
    addMessage(timeStr, 'user');
    setFormData(prev => ({ ...prev, time_part: timeStr }));
    triggerPhoneStep();
  }

  const handleManualTimeTrigger = () => {
    addMessage("Elegir otra hora...", 'user');
    setTimeout(() => {
      addMessage("Por favor selecciona la hora.", 'bot');
      setStep(STEPS.TIME_MANUAL);
    }, 500);
  }

  const handleManualTimeSubmit = (val) => {
    addMessage(val, 'user');
    setFormData(prev => ({ ...prev, time_part: val }));
    triggerPhoneStep();
  }

  /* --- CONTACT FLOW LOGIC --- */

  const triggerPhoneStep = () => {
    // Check if we already have the contact info (Recurrent Patient who kept data)
    if (formData.patient_phone && formData.occupation && formData.patient_email) {
      setTimeout(() => {
        addMessage("¡Perfecto! Ya tengo tus datos de contacto.", 'bot');
        addMessage("Aquí tienes el resumen de tu solicitud. Por favor confirma si todos los datos son correctos.", 'bot');
        setStep(STEPS.CONFIRM);
      }, 600);
      return;
    }

    setTimeout(() => {
      addMessage("Entendido. Por favor indica tu número de teléfono (mínimo 11 dígitos).", 'bot');
      setStep(STEPS.PHONE);
    }, 600);
  }

  // --- Contact Info ---

  const handlePhoneSubmit = (value) => {
    // Validation: Min 11 digits
    const digits = value.replace(/\D/g, '');
    if (digits.length < 11) {
      addMessage("El teléfono debe tener al menos 11 dígitos. Ej: 04141234567.", 'bot');
      return;
    }

    setFormData(prev => ({ ...prev, patient_phone: value }));
    addMessage(value, 'user');

    // Check if occupation is needed
    if (formData.occupation) {
      // Skip occupation if exists (Partial update scenario)
      handleOccupationSubmit(formData.occupation); // Recursively check email
      return;
    }

    setTimeout(() => {
      addMessage(`Gracias. ¿Cuál es su ocupación actual?`, 'bot');
      setStep(STEPS.OCCUPATION);
    }, 500);
  };

  const handleOccupationSubmit = (value) => {
    // If value passed directly (from skip logic) or event
    const val = typeof value === 'string' ? value : value;

    if (typeof value !== 'string') { // Only add message if it came from user input
      addMessage(val, 'user');
    }

    setFormData(prev => ({ ...prev, occupation: val }));

    // Check if email is needed
    if (formData.patient_email) {
      handleEmailSubmit(formData.patient_email);
      return;
    }

    // Proceed to Email
    setTimeout(() => {
      addMessage("Finalmente, ¿cuál es tu correo electrónico?", 'bot');
      setStep(STEPS.EMAIL);
    }, 400);
  };

  const handleEmailSubmit = (value) => {
    const val = typeof value === 'string' ? value : value;
    if (typeof value !== 'string') {
      addMessage(val, 'user');
    }

    setFormData(prev => ({ ...prev, patient_email: val }));
    setTimeout(() => {
      addMessage("¡Gracias! Aquí tienes el resumen de tu solicitud. Por favor confirma si todos los datos son correctos.", 'bot');
      setStep(STEPS.CONFIRM);
    }, 600);
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const fullDate = `${formData.date_part}T${formData.time_part}`;
      const appointmentPayload = {
        doctor_id: doctorId,
        ...formData,
        appointment_date: fullDate,
        status: 'pending'
      };
      await appointmentService.createAppointment(appointmentPayload);

      setLoading(false);
      // Force explicit success view
      setStep(STEPS.SUCCESS);
      setTimeout(() => {
        onClose();
      }, 4000);
    } catch (error) {
      console.error("Error booking", error);
      setLoading(false);
      addMessage("Hubo un error al agendar tu cita. Por favor intenta nuevamente.", 'bot');
    }
  };

  const getReasonOptions = () => {
    if (formData.appointment_type === 'Ginecología') {
      return ['Control Ginecológico', 'Dolor Pélvico', 'Sangrado'];
    }
    if (formData.appointment_type === 'Prenatal') {
      return ['Control Prenatal', 'Dolor Pélvico', 'Sangrado'];
    }
    return [];
  };

  // RENDER SUCCESS VIEW
  if (step === STEPS.SUCCESS) {
    return (
      <div className="flex flex-col h-[500px] max-h-[80vh] items-center justify-center p-8 text-center animate-fade-in bg-white dark:bg-gray-800 rounded-2xl relative">
        <MdCheckCircle size={80} style={{ color: primaryColor }} className="mb-6 drop-shadow-md animate-bounce" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">¡Solicitud Enviada!</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-xs mx-auto">
          Tu cita ha sido registrada con éxito. Te contactaremos pronto para confirmarla.
        </p>
        <p className="text-sm text-gray-400">Cerrando en unos segundos...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-auto min-h-[300px] max-h-[500px] bg-white dark:bg-gray-800 relative">
      <ModernLoader isOpen={loading} text="Agendando Cita..." />

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        {history.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start items-end gap-2'}`}>
            {msg.type === 'bot' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-gray-200 mb-1 border border-gray-100">
                {doctor?.photo_url ? (
                  <img
                    src={getImageUrl(doctor.photo_url)}
                    alt="Doctor"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center font-bold text-xs text-white"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {doctor?.nombre_completo?.charAt(0) || 'D'}
                  </div>
                )}
              </div>
            )}
            <div
              className={`max-w-[85%] p-3 text-sm rounded-2xl shadow-sm ${msg.type === 'user'
                ? 'text-white rounded-br-none'
                : 'border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'
                }`}
              style={{
                backgroundColor: msg.type === 'user' ? primaryColor : `${primaryColor}33`
              }}
            >
              {msg.type === 'bot' ? (
                <span dangerouslySetInnerHTML={{ __html: msg.text }} />
              ) : (
                msg.text
              )}
            </div>
          </div>
        ))}

        {/* Confirmation Summary */}
        {step === STEPS.CONFIRM && (
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mx-4 animate-fade-in">
            <h3 className="font-bold text-gray-900 dark:text-white mb-3 text-sm border-b pb-2">Resumen de la Cita</h3>
            <ul className="text-sm space-y-2 text-gray-600 dark:text-gray-300">
              <li><span className="font-medium text-gray-900 dark:text-gray-100">Nombre:</span> {formData.patient_name}</li>
              <li><span className="font-medium text-gray-900 dark:text-gray-100">Cédula:</span> {formData.patient_dni}</li>
              <li><span className="font-medium text-gray-900 dark:text-gray-100">Edad:</span> {formData.patient_age} años</li>
              <li><span className="font-medium text-gray-900 dark:text-gray-100">Zona:</span> {formData.residence}</li>
              <li><span className="font-medium text-gray-900 dark:text-gray-100">Tipo:</span> {formData.appointment_type}</li>
              <li><span className="font-medium text-gray-900 dark:text-gray-100">Motivo:</span> {formData.reason_for_visit}</li>
              <li><span className="font-medium text-gray-900 dark:text-gray-100">Sede:</span> {formData.location}</li>
              <li><span className="font-medium text-gray-900 dark:text-gray-100">Fecha:</span> {new Date(`${formData.date_part}T${formData.time_part}`).toLocaleString()}</li>
              <li><span className="font-medium text-gray-900 dark:text-gray-100">Teléfono:</span> {formData.patient_phone}</li>
              <li><span className="font-medium text-gray-900 dark:text-gray-100">Email:</span> {formData.patient_email}</li>
            </ul>
            <div className="mt-4 flex gap-3">
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="w-full py-2 text-white rounded-lg font-medium hover:opacity-90 transition-opacity shadow-sm"
                style={{ backgroundColor: primaryColor }}
              >
                Confirmar Cita
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 w-full flex-shrink-0">
        {step === STEPS.NAME && (
          <SimpleInput placeholder="Escribe tu nombre completo..." onSubmit={handleNameSubmit} primaryColor={primaryColor} />
        )}

        {step === STEPS.RECURRENT_CONFIRM && (
          <div className="flex gap-2 justify-center w-full">
            <button
              onClick={() => handleRecurrentResponse('KEEP')}
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-full font-medium hover:bg-gray-300 transition"
            >
              No, mantener datos
            </button>
            <button
              onClick={() => handleRecurrentResponse('UPDATE')}
              className="px-6 py-2 text-white rounded-full font-medium shadow-md transition transform hover:scale-105"
              style={{ backgroundColor: primaryColor }}
            >
              Sí, actualizar
            </button>
          </div>
        )}

        {step === STEPS.DNI && (
          <SimpleInput placeholder="Ej: V-12345678" onSubmit={handleDniSubmit} primaryColor={primaryColor} />
        )}

        {step === STEPS.AGE && (
          <SimpleInput placeholder="Ej: 30" onSubmit={handleAgeSubmit} type="text" numericOnly={true} primaryColor={primaryColor} />
        )}

        {step === STEPS.RESIDENCE && (
          <SimpleInput placeholder="Ej: Centro, Norte..." onSubmit={handleResidenceSubmit} primaryColor={primaryColor} />
        )}

        {step === STEPS.TYPE && (
          <div className="flex flex-wrap gap-2">
            {['Ginecología', 'Prenatal'].map(type => (
              <button
                key={type}
                onClick={() => handleTypeSelect(type)}
                className="px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-full transition-colors text-sm font-medium border"
                style={{
                  color: primaryColor,
                  borderColor: `${primaryColor}40`, // 25% opacity
                }}
              >
                {type}
              </button>
            ))}
          </div>
        )}

        {step === STEPS.REASON && (
          <div className="flex flex-wrap gap-2">
            {getReasonOptions().map(reason => (
              <button
                key={reason}
                onClick={() => handleReasonSelect(reason)}
                className="px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-full transition-colors text-sm font-medium border"
                style={{
                  color: primaryColor,
                  borderColor: `${primaryColor}40`,
                }}
              >
                {reason}
              </button>
            ))}
          </div>
        )}

        {step === STEPS.LOCATION && (
          <div className="flex flex-wrap gap-2">
            {locations.length > 0 ? (
              locations.map(loc => (
                <button
                  key={loc.id}
                  onClick={() => handleLocationSelect(loc)}
                  className="px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-full transition-colors text-sm font-medium border"
                  style={{
                    color: primaryColor,
                    borderColor: `${primaryColor}40`,
                  }}
                >
                  {loc.name}
                </button>
              ))
            ) : (
              <SimpleInput placeholder="Escribe la sede..." onSubmit={handleLocationTextSubmit} primaryColor={primaryColor} />
            )}
          </div>
        )}

        {/* SMART DATE SELECTION */}
        {step === STEPS.DATE_SUGGESTION && (
          <div className="flex flex-wrap gap-2">
            {suggestedDates.map((date, idx) => (
              <button
                key={idx}
                onClick={() => handleSmartDateSelect(date)}
                className="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl transition-all text-sm font-bold border flex items-center gap-2"
                style={{
                  color: primaryColor,
                  borderColor: `${primaryColor}40`,
                }}
              >
                <MdCalendarToday /> {formatSmartDate(date)}
              </button>
            ))}
            <button
              onClick={handleManualDateTrigger}
              className="px-4 py-3 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all text-sm border border-gray-200 dark:border-gray-600"
            >
              Otra fecha...
            </button>
          </div>
        )}

        {/* MANUAL DATE FALLBACK */}
        {step === STEPS.DATE_MANUAL && (
          <form onSubmit={(e) => { e.preventDefault(); const val = e.target.elements.date.value; if (val) handleManualDateSubmit(val); }} className="flex gap-2 w-full">
            <input
              name="date"
              type="date"
              className="flex-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 w-full dark:text-white"
              style={{ '--tw-ring-color': primaryColor }}
              required
            />
            <button
              type="submit"
              className="p-3 text-white rounded-lg flex items-center justify-center shadow-md"
              style={{ backgroundColor: primaryColor }}
              title="Enviar"
            >
              <MdSend size={20} />
            </button>
          </form>
        )}

        {/* SMART TIME SELECTION */}
        {step === STEPS.TIME_SUGGESTION && (
          <div className="flex flex-wrap gap-2">
            {suggestedTimes.map((time, idx) => (
              <button
                key={idx}
                onClick={() => handleSmartTimeSelect(time)}
                className="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl transition-all text-sm font-bold border flex items-center gap-2"
                style={{
                  color: primaryColor,
                  borderColor: `${primaryColor}40`,
                }}
              >
                <MdAccessTime /> {time}
              </button>
            ))}
            <button
              onClick={handleManualTimeTrigger}
              className="px-4 py-3 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all text-sm border border-gray-200 dark:border-gray-600"
            >
              Otra hora...
            </button>
          </div>
        )}

        {/* MANUAL TIME FALLBACK */}
        {step === STEPS.TIME_MANUAL && (
          <form onSubmit={(e) => { e.preventDefault(); const val = e.target.elements.time.value; if (val) handleManualTimeSubmit(val); }} className="flex gap-2 w-full">
            <input
              name="time"
              type="time"
              step="900" // 15 minutes
              className="flex-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 w-full dark:text-white"
              style={{ '--tw-ring-color': primaryColor }}
              required
            />
            <button
              type="submit"
              className="p-3 text-white rounded-lg flex items-center justify-center shadow-md"
              style={{ backgroundColor: primaryColor }}
              title="Enviar"
            >
              <MdSend size={20} />
            </button>
          </form>
        )}

        {step === STEPS.PHONE && (
          <SimpleInput placeholder="Ej: 0414-1234567" onSubmit={handlePhoneSubmit} type="tel" primaryColor={primaryColor} />
        )}

        {step === STEPS.OCCUPATION && (
          <SimpleInput
            placeholder="Ej: Docente, Ingeniero, Estudiante..."
            onSubmit={handleOccupationSubmit}
            type="text"
            autoFocus
            primaryColor={primaryColor}
          />
        )}

        {step === STEPS.EMAIL && (
          <SimpleInput placeholder="Ej: correo@ejemplo.com" onSubmit={handleEmailSubmit} type="email" primaryColor={primaryColor} />
        )}
      </div>
    </div>
  );
}
