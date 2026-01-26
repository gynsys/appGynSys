import { useState, useEffect, useRef } from 'react';
import { getImageUrl } from '../../lib/imageUtils';
import PropTypes from 'prop-types';
import { appointmentService } from '../../services/appointmentService';
import { onlineConsultationService } from '../../services/onlineConsultationService';
import ModernLoader from '../common/ModernLoader';
import { MdSend, MdCheckCircle, MdClose } from 'react-icons/md';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import axios from 'axios';

// Helper: Capitalize words
const capitalizeWords = (str) => {
    return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
};

// Helper: Generate smart dates (Mon-Fri by default for online)
const generateOnlineDates = (count = 3) => {
    const dates = [];
    let current = new Date();
    current.setDate(current.getDate() + 1); // Start tomorrow

    let safety = 0;
    while (dates.length < count && safety < 30) {
        const day = current.getDay();
        // Mon-Fri only (1-5)
        if (day >= 1 && day <= 5) {
            dates.push(new Date(current));
        }
        current.setDate(current.getDate() + 1);
        safety++;
    }
    return dates;
};

// Helper: Format date for button
const formatSmartDate = (date) => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return `${days[date.getDay()]} ${date.getDate()}`;
};

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
            val = val.replace(/[^0-9]/g, '');
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

export default function OnlineChatBooking({ doctorId, doctor = {}, onClose }) {
    // Brand Color
    const primaryColor = doctor?.theme_primary_color || '#4F46E5';

    // Steps
    const STEPS = {
        WELCOME_ONLINE: 'WELCOME_ONLINE',
        EXPLAIN_ONLINE: 'EXPLAIN_ONLINE',
        FAREWELL_MESSAGE: 'FAREWELL_MESSAGE',
        NAME: 'NAME',
        DNI: 'DNI',
        AGE: 'AGE',
        RESIDENCE: 'RESIDENCE',
        REASON: 'REASON',
        DATE_SUGGESTION: 'DATE_SUGGESTION',
        DATE_MANUAL: 'DATE_MANUAL',
        TIME_SUGGESTION: 'TIME_SUGGESTION',
        TIME_MANUAL: 'TIME_MANUAL',
        PHONE: 'PHONE',
        PAYMENT_METHOD: 'PAYMENT_METHOD',
        EMAIL: 'EMAIL',
        CONFIRM: 'CONFIRM',
        SUCCESS: 'SUCCESS'
    };

    // State
    const [step, setStep] = useState(STEPS.WELCOME_ONLINE);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState(null);
    const [suggestedDates, setSuggestedDates] = useState([]);
    const [suggestedTimes, setSuggestedTimes] = useState([]);

    const [formData, setFormData] = useState({
        patient_name: '',
        patient_dni: '',
        patient_age: '',
        residence: '',
        appointment_type: 'Consulta Online', // Pre-assigned
        reason_for_visit: '',
        location: 'Online (Videollamada)', // Pre-assigned
        date_part: '',
        time_part: '',
        patient_phone: '',
        payment_method: '',
        patient_email: ''
    });

    const [paypalConfig, setPaypalConfig] = useState(null);

    // Body Scroll Lock
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const messagesEndRef = useRef(null);

    // Load settings and PayPal config
    useEffect(() => {
        const loadData = async () => {
            if (doctor?.slug_url) {
                try {
                    const [settingsData, paypalData] = await Promise.all([
                        onlineConsultationService.getPublicSettings(doctor.slug_url),
                        axios.get(`${import.meta.env.VITE_API_URL}/api/v1/payment/config`)
                    ]);
                    setSettings(settingsData);
                    setPaypalConfig(paypalData.data);
                } catch (err) {
                    console.error("Error loading data", err);
                }
            }
        };
        loadData();
    }, [doctor]);

    // Initialize chat with welcome
    useEffect(() => {
        const name = doctor?.nombre_completo || 'Doctor';
        setHistory([
            {
                type: 'bot',
                text: `<p class="mb-1">👋 ¡Hola! Soy el asistente virtual de la ${name}.</p><p class="mb-1">Has seleccionado <span class="font-bold">CONSULTAS ONLINE</span>.</p><p>¿Deseas que te explique cómo funciona esta modalidad?</p>`
            }
        ]);
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

    /* ========== STEP HANDLERS ========== */

    // EXPLAIN_ONLINE
    const handleWelcomeResponse = (response) => {
        if (response === 'YES') {
            addMessage("Sí, continuar →", 'user');
            setTimeout(() => {
                setStep(STEPS.EXPLAIN_ONLINE);
            }, 500);
        } else {
            addMessage("No, en otra ocasión", 'user');
            setTimeout(() => {
                onClose();
            }, 500);
        }
    };

    // EXPLAIN_ONLINE (Consolidated Step)
    useEffect(() => {
        if (step === STEPS.EXPLAIN_ONLINE && settings) {
            const price1 = settings.first_consultation_price || 50;
            const price2 = settings.followup_price || 40;
            const currency = settings.currency || 'USD';

            setTimeout(() => {
                addMessage(
                    `<p class="mb-2 font-bold">✨ ¿Cómo funciona la Consulta Online?</p>
          <p class="mb-1"><strong>📹 Se realiza Videollamada en Vivo de acuerdo a la cita pautada.</strong></p>
          <p class="mb-2 text-xs">• Consulta por Zoom o Google Meet<br/>• Pantalla compartida para revisar exámenes</p>
          <p class="mb-1"><strong>⏱️ Duración: 30-45 minutos</strong></p>
          <p class="mb-2 text-xs">• Tiempo completo de atención personalizada</p>
          <p class="mb-1"><strong>📄 Incluye:</strong></p>
          <p class="mb-2 text-xs">✓ Receta médica digital firmada<br/>✓ Recomendaciones por escrito<br/>✓ Seguimiento vía email</p>
          <p class="mb-2"><strong>🔒 100% Privado y Confidencial</strong></p>
          
          <div class="border-t border-gray-200 dark:border-gray-700 my-3"></div>
          
          <p class="mb-2 font-bold">💰 Precios - Consulta Online</p>
          <div class="bg-white dark:bg-gray-800 p-3 rounded-lg mb-3 border border-gray-200 dark:border-gray-700">
            <p class="text-sm">Primera Consulta: <span class="font-bold">${currency} $${price1}</span></p>
            <p class="text-sm">Control/Seguimiento: <span class="font-bold">${currency} $${price2}</span></p>
          </div>
          
          <p class="mb-1 font-semibold">💳 Métodos de Pago:</p>
          <p class="text-xs mb-2">• Zelle<br/>• PayPal<br/>• Transferencia bancaria<br/>• Pago móvil (Bs)</p>
          <p class="text-xs mb-3">📌 Nota: El pago se confirma antes de la videollamada. Se enviarán los datos bancarios por email.</p>
          
          <p class="font-semibold">¿Deseas agendar tu Consulta Online ahora?</p>`,
                    'bot'
                );
            }, 800);
        }
    }, [step, settings, STEPS.EXPLAIN_ONLINE]);

    const handleExplainResponse = (response) => {
        if (response === 'YES') {
            addMessage("📆 Sí, agendar", 'user');
            setTimeout(() => {
                addMessage(
                    `<p class="mb-2">¡Perfecto! 🎉</p>
          <p class="mb-2">Procederemos a agendar tu Consulta Online.</p>
          <p class="mb-2">Necesitaré algunos datos básicos para crear tu expediente.</p>
          <p class="font-semibold">Para comenzar, ¿podrías indicarme tu nombre completo?</p>`,
                    'bot'
                );
                setStep(STEPS.NAME);
            }, 500);
        } else {
            addMessage("En otra ocasión", 'user');
            setTimeout(() => {
                onClose();
            }, 500);
        }
    };



    // ONLINE_CONFIRM
    useEffect(() => {
        if (step === STEPS.ONLINE_CONFIRM) {
            setTimeout(() => {
                addMessage(
                    `<p class="mb-2">¡Perfecto! 🎉</p>
          <p class="mb-2">Procederemos a agendar tu Consulta Online.</p>
          <p class="mb-2">Necesitaré algunos datos básicos para crear tu expediente.</p>
          <p class="font-semibold">Para comenzar, ¿podrías indicarme tu nombre completo?</p>`,
                    'bot'
                );
                setTimeout(() => {
                    setStep(STEPS.NAME);
                }, 800);
            }, 600);
        }
    }, [step, STEPS.ONLINE_CONFIRM, STEPS.NAME]);

    // NAME
    const handleNameSubmit = (value) => {
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

    // DNI
    const handleDniSubmit = (value) => {
        const digits = value.replace(/\D/g, '');
        if (digits.length < 7) {
            addMessage("La cédula debe tener al menos 7 dígitos (millones). Por favor revisa.", 'bot');
            return;
        }
        addMessage(value, 'user');
        setFormData(prev => ({ ...prev, patient_dni: value }));
        setTimeout(() => {
            addMessage("¿Podría indicarme su edad?", 'bot');
            setStep(STEPS.AGE);
        }, 600);
    };

    // AGE
    const handleAgeSubmit = (value) => {
        addMessage(value, 'user');
        setFormData(prev => ({ ...prev, patient_age: value }));
        setTimeout(() => {
            addMessage("¿En qué zona reside actualmente?", 'bot');
            setStep(STEPS.RESIDENCE);
        }, 600);
    };

    // RESIDENCE
    const handleResidenceSubmit = (value) => {
        addMessage(value, 'user');
        setFormData(prev => ({ ...prev, residence: value }));
        setTimeout(() => {
            addMessage("Entendido. ¿Cuál es el motivo de tu consulta online?", 'bot');
            setStep(STEPS.REASON);
        }, 600);
    };

    // REASON (adapted for online)
    const getOnlineReasonOptions = () => {
        return [
            'Control Ginecológico',
            'Asesoría Anticonceptiva',
            'Resultados de Exámenes',
            'Seguimiento Post-Consulta',
            'Planificación Familiar',
            'Otro'
        ];
    };

    const handleReasonSelect = (value) => {
        addMessage(value, 'user');
        setFormData(prev => ({ ...prev, reason_for_visit: value }));

        // Generate dates and times for online
        const dates = generateOnlineDates(3);
        setSuggestedDates(dates);
        setSuggestedTimes(['09:00', '11:00', '14:00', '16:00']);

        setTimeout(() => {
            const lastName = formData.patient_name.split(' ').pop();
            addMessage(
                `<p class="mb-1">La consulta será por videollamada 📹.</p>
        <p class="mb-2">Sra. ${lastName}, las consultas online están disponibles de <span class="font-semibold">Lunes a Viernes</span>.</p>
        <p class="font-semibold">Le mostraré los próximos días disponibles:</p>`,
                'bot'
            );
            setStep(STEPS.DATE_SUGGESTION);
        }, 800);
    };

    // DATE
    const handleSmartDateSelect = (dateObj) => {
        const readable = dateObj.toLocaleDateString();
        const isoDate = dateObj.toISOString().split('T')[0];
        addMessage(readable, 'user');
        setFormData(prev => ({ ...prev, date_part: isoDate }));

        setTimeout(() => {
            const lastName = formData.patient_name.split(' ').pop();
            addMessage(`Perfecto Sra. ${lastName}, ¿A qué hora le gustaría su videollamada?`, 'bot');
            setStep(STEPS.TIME_SUGGESTION);
        }, 600);
    };

    const handleManualDateTrigger = () => {
        addMessage("📅 Elegir otra fecha...", 'user');
        setTimeout(() => {
            addMessage("Por favor selecciona la fecha en el calendario.", 'bot');
            setStep(STEPS.DATE_MANUAL);
        }, 500);
    };

    const handleManualDateSubmit = (val) => {
        const [y, m, d] = val.split('-');
        const readable = `${d}/${m}/${y}`;
        addMessage(readable, 'user');
        setFormData(prev => ({ ...prev, date_part: val }));

        setTimeout(() => {
            const lastName = formData.patient_name.split(' ').pop();
            addMessage(`Perfecto Sra. ${lastName}, ¿A qué hora le gustaría su videollamada?`, 'bot');
            setStep(STEPS.TIME_MANUAL);
        }, 600);
    };

    // TIME
    const handleSmartTimeSelect = (timeStr) => {
        addMessage(timeStr, 'user');
        setFormData(prev => ({ ...prev, time_part: timeStr }));
        setTimeout(() => {
            addMessage("Entendido. Por favor indica tu número de teléfono (WhatsApp preferiblemente, mínimo 11 dígitos).", 'bot');
            setStep(STEPS.PHONE);
        }, 600);
    };

    const handleManualTimeTrigger = () => {
        addMessage("🕐 Otra hora...", 'user');
        setTimeout(() => {
            addMessage("Por favor selecciona la hora.", 'bot');
            setStep(STEPS.TIME_MANUAL);
        }, 500);
    };

    const handleManualTimeSubmit = (val) => {
        addMessage(val, 'user');
        setFormData(prev => ({ ...prev, time_part: val }));
        setTimeout(() => {
            addMessage("Entendido. Por favor indica tu número de teléfono (WhatsApp preferiblemente, mínimo 11 dígitos).", 'bot');
            setStep(STEPS.PHONE);
        }, 600);
    };

    // PHONE
    const handlePhoneSubmit = (value) => {
        const digits = value.replace(/\D/g, '');
        if (digits.length < 11) {
            addMessage("El teléfono debe tener al menos 11 dígitos. Ej: 04141234567.", 'bot');
            return;
        }
        setFormData(prev => ({ ...prev, patient_phone: value }));
        addMessage(value, 'user');
        setTimeout(() => {
            addMessage("Por favor, indíqueme su método de pago.", 'bot');
            setStep(STEPS.PAYMENT_METHOD);
        }, 500);
    };

    // PAYMENT METHOD
    const handlePaymentMethodSubmit = (method) => {
        addMessage(method, 'user');
        setFormData(prev => ({ ...prev, payment_method: method }));
        setTimeout(() => {
            addMessage(
                `<p class="mb-2">⚠️ <span class="font-bold">IMPORTANTE</span> para tu Consulta Online:</p>
        <p class="mb-2 text-sm">Por favor indica tu correo electrónico donde recibirás:</p>
        <div class="ml-2 mb-3">
            <p class="text-xs mb-1">• Link de la videollamada (Zoom/Meet)</p>
            <p class="text-xs mb-1">• Datos para el pago</p>
            <p class="text-xs mb-1">• Recordatorios automáticos</p>
        </div>
        <p class="font-semibold">Correo electrónico:</p>`,
                'bot'
            );
            setStep(STEPS.EMAIL);
        }, 400);
    };

    // EMAIL
    const handleEmailSubmit = (value) => {
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            addMessage("Por favor ingresa un correo electrónico válido.", 'bot');
            return;
        }
        addMessage(value, 'user');
        setFormData(prev => ({ ...prev, patient_email: value }));
        setTimeout(() => {
            addMessage("¡Gracias! Aquí tienes el resumen de tu solicitud. Por favor confirma si todos los datos son correctos.", 'bot');
            setStep(STEPS.CONFIRM);
        }, 600);
    };

    // CONFIRM
    const handleConfirm = async () => {
        setLoading(true);
        try {
            await submitAppointment('pending');
        } catch (error) {
            console.error("Error booking online consultation", error);
            setLoading(false);
            addMessage("Hubo un error al agendar tu consulta. Por favor intenta nuevamente.", 'bot');
        }
    };

    const submitAppointment = async (status = 'pending') => {
        const fullDate = `${formData.date_part}T${formData.time_part}`;
        const appointmentPayload = {
            doctor_id: doctorId,
            ...formData,
            appointment_date: fullDate,
            status: status
        };
        await appointmentService.createAppointment(appointmentPayload);
        setLoading(false);
        setStep(STEPS.SUCCESS);
        setTimeout(() => {
            onClose();
        }, 5000);
    }

    // ========== RENDER ==========

    // SUCCESS VIEW
    if (step === STEPS.SUCCESS) {
        return (
            <div className={`flex flex-col h-[500px] max-h-[80vh] items-center justify-center p-8 text-center animate-fade-in bg-white dark:bg-gray-800 rounded-2xl relative`}>
                <MdCheckCircle size={80} className="mb-6 drop-shadow-md animate-bounce" style={{ color: primaryColor }} />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">✅ ¡Cita Agendada!</h2>
                <p className="text-lg font-semibold mb-4" style={{ color: primaryColor }}>📹 Consulta Online Registrada</p>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl shadow-lg mb-4 max-w-sm w-full">
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 font-medium">Tu solicitud ha sido enviada con éxito. En breve recibirás:</p>
                    <div className="text-left space-y-1 ml-4">
                        <p className="text-xs text-gray-600 dark:text-gray-400">✓ Confirmación por email</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">✓ Datos para el pago</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">✓ Link de videollamada</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">✓ Recordatorios automáticos</p>
                    </div>
                </div>
                <p className="text-sm text-gray-500">Revisa tu bandeja de entrada y spam.</p>
                <p className="text-xs text-gray-400 mt-4">Cerrando en unos segundos...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-auto min-h-[300px] max-h-[500px] bg-white dark:bg-gray-800 relative rounded-lg overflow-hidden">
            <ModernLoader isOpen={loading} text="Agendando Consulta Online..." />

            {/* Header */}
            <div className="p-3 flex items-center justify-between text-white" style={{ backgroundColor: primaryColor }}>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-white">
                        {doctor?.photo_url ? (
                            <img
                                src={getImageUrl(doctor.photo_url)}
                                alt="Doctor"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-purple-600 text-sm">
                                {doctor?.nombre_completo?.charAt(0) || 'D'}
                            </div>
                        )}
                    </div>
                    <div>
                        <p className="text-white font-bold text-sm">Consulta Online</p>
                        <p className="text-white/80 text-xs">📹 Videollamada</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="text-white hover:bg-white/20 p-1 rounded-full transition"
                >
                    <MdClose size={20} />
                </button>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
                {history.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start items-end gap-2'}`}>
                        {msg.type === 'bot' && (
                            <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-purple-100 border-2 border-purple-300">
                                {doctor?.photo_url ? (
                                    <img
                                        src={getImageUrl(doctor.photo_url)}
                                        alt="Doctor"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center font-bold text-xs text-purple-600">
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
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border-2 border-purple-300 dark:border-purple-500 shadow-lg mx-4 animate-fade-in">
                        <h3 className="font-bold text-purple-600 dark:text-purple-400 mb-3 text-sm border-b border-purple-200 pb-2">
                            📹 CONSULTA ONLINE - RESUMEN
                        </h3>
                        <div className="space-y-1 text-xs">
                            <p><span className="font-semibold">Nombre:</span> {formData.patient_name}</p>
                            <p><span className="font-semibold">Cédula:</span> {formData.patient_dni}</p>
                            <p><span className="font-semibold">Edad:</span> {formData.patient_age} años</p>
                            <p><span className="font-semibold">Zona:</span> {formData.residence}</p>
                            <div className="border-t border-purple-100 my-2"></div>
                            <p><span className="font-semibold">Motivo:</span> {formData.reason_for_visit}</p>
                            <p><span className="font-semibold">Fecha:</span> {new Date(`${formData.date_part}T${formData.time_part}`).toLocaleString()}</p>
                            <p><span className="font-semibold">Medio:</span> Videollamada Zoom/Meet 📹</p>
                            <div className="border-t border-purple-100 my-2"></div>
                            <p><span className="font-semibold">Teléfono:</span> {formData.patient_phone}</p>
                            <p><span className="font-semibold">Email:</span> {formData.patient_email}</p>
                            <p><span className="font-semibold">Pago:</span> {formData.payment_method}</p>
                            <div className="border-t border-purple-100 my-2"></div>
                            <p className="font-bold text-purple-600">💰 Costo: {settings?.currency || 'USD'} ${settings?.first_consultation_price || 50}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-3 mb-3">📧 Recibirás un email con datos para el pago, link de videollamada y recomendaciones pre-consulta.</p>

                        {formData.payment_method === 'PayPal' && paypalConfig ? (
                            <PayPalScriptProvider options={{ "client-id": paypalConfig.client_id, currency: "USD" }}>
                                <PayPalButtons
                                    style={{ layout: "vertical" }}
                                    createOrder={async (data, actions) => {
                                        try {
                                            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/payment/create-order`, {
                                                doctor_id: doctorId,
                                                patient_dni: formData.patient_dni
                                            });
                                            return response.data.id;
                                        } catch (err) {
                                            console.error("Error creating order", err);
                                            throw err;
                                        }
                                    }}
                                    onApprove={async (data, actions) => {
                                        try {
                                            await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/payment/capture-order/${data.orderID}`);
                                            await submitAppointment('confirmed'); // Mark as confirmed/paid
                                        } catch (err) {
                                            console.error("Capture error", err);
                                            addMessage("Error al procesar el pago. Contacte soporte.", 'bot');
                                        }
                                    }}
                                />
                            </PayPalScriptProvider>
                        ) : (
                            <button
                                onClick={handleConfirm}
                                disabled={loading}
                                className="w-full py-2 text-white rounded-lg font-medium hover:opacity-90 transition shadow-md"
                                style={{ backgroundColor: primaryColor }}
                            >
                                ✓ Confirmar Cita
                            </button>
                        )}
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                {/* WELCOME_ONLINE buttons */}
                {step === STEPS.WELCOME_ONLINE && (
                    <div className="flex gap-2 justify-center">
                        <button
                            onClick={() => handleWelcomeResponse('YES')}
                            className="px-6 py-2 text-white rounded-full font-medium shadow-md hover:scale-105 transition-transform"
                            style={{ backgroundColor: primaryColor }}
                        >
                            Sí, continuar →
                        </button>
                        <button
                            onClick={() => handleWelcomeResponse('NO')}
                            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-full font-medium hover:bg-gray-300 transition"
                        >
                            ✘ No, en otra ocasión
                        </button>
                    </div>
                )}

                {/* EXPLAIN_ONLINE buttons */}
                {step === STEPS.EXPLAIN_ONLINE && (
                    <div className="flex gap-2 justify-center">
                        <button
                            onClick={() => handleExplainResponse('YES')}
                            className="px-6 py-2 text-white rounded-full font-medium shadow-md hover:scale-105 transition-transform"
                            style={{ backgroundColor: primaryColor }}
                        >
                            📆 Sí, agendar
                        </button>
                        <button
                            onClick={() => handleExplainResponse('NO')}
                            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-full font-medium hover:bg-gray-300 transition"
                        >
                            En otra ocasión
                        </button>
                    </div>
                )}

                {/* FAREWELL buttons */}
                {step === STEPS.FAREWELL_MESSAGE && (
                    <div className="flex gap-2 justify-center">
                        <button
                            onClick={() => handleFarewellResponse('PRESENCIAL')}
                            className="px-6 py-2 text-white rounded-full font-medium shadow-md hover:scale-105 transition-transform"
                            style={{ backgroundColor: primaryColor }}
                        >
                            📍 Sí, agendar presencial
                        </button>
                        <button
                            onClick={() => handleFarewellResponse('CLOSE')}
                            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-full font-medium hover:bg-gray-300 transition"
                        >
                            Cerrar
                        </button>
                    </div>
                )}





                {/* NAME input */}
                {step === STEPS.NAME && (
                    <SimpleInput
                        placeholder="Escribe tu nombre completo..."
                        onSubmit={handleNameSubmit}
                        primaryColor={primaryColor}
                    />
                )}

                {/* DNI input */}
                {step === STEPS.DNI && (
                    <SimpleInput
                        placeholder="Ej: V-12345678"
                        onSubmit={handleDniSubmit}
                        primaryColor={primaryColor}
                    />
                )}

                {/* AGE input */}
                {step === STEPS.AGE && (
                    <SimpleInput
                        placeholder="Ej: 30"
                        onSubmit={handleAgeSubmit}
                        type="text"
                        numericOnly={true}
                        primaryColor={primaryColor}
                    />
                )}

                {/* RESIDENCE input */}
                {step === STEPS.RESIDENCE && (
                    <SimpleInput
                        placeholder="Ej: Centro, Norte..."
                        onSubmit={handleResidenceSubmit}
                        primaryColor={primaryColor}
                    />
                )}

                {/* REASON buttons */}
                {step === STEPS.REASON && (
                    <div className="flex flex-wrap gap-2">
                        {getOnlineReasonOptions().map(reason => (
                            <button
                                key={reason}
                                onClick={() => handleReasonSelect(reason)}
                                className="px-4 py-2 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-sm font-medium border border-gray-300 dark:border-gray-600 hover:bg-gray-100 transition"
                                style={{
                                    borderColor: primaryColor,
                                    color: primaryColor,
                                }}
                            >
                                {reason}
                            </button>
                        ))}
                    </div>
                )}

                {/* DATE_SUGGESTION buttons */}
                {step === STEPS.DATE_SUGGESTION && (
                    <div className="flex flex-wrap gap-2">
                        {suggestedDates.map((date, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSmartDateSelect(date)}
                                className="px-4 py-2 text-white rounded-full text-sm font-medium hover:opacity-90 transition shadow-md"
                                style={{ backgroundColor: primaryColor }}
                            >
                                {formatSmartDate(date)}
                            </button>
                        ))}
                        <button
                            onClick={handleManualDateTrigger}
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-full text-sm font-medium hover:bg-gray-300 transition"
                        >
                            📅 Elegir otra fecha...
                        </button>
                    </div>
                )}

                {/* DATE_MANUAL input */}
                {step === STEPS.DATE_MANUAL && (
                    <input
                        type="date"
                        onChange={(e) => e.target.value && handleManualDateSubmit(e.target.value)}
                        className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                )}

                {/* TIME_SUGGESTION buttons */}
                {step === STEPS.TIME_SUGGESTION && (
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <p className="text-xs text-gray-500 mb-2">Mañana:</p>
                            {suggestedTimes.slice(0, 2).map((time, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSmartTimeSelect(time)}
                                    className="w-full mb-2 px-4 py-2 text-white rounded-lg text-sm font-medium hover:opacity-90 transition shadow-md"
                                    style={{ backgroundColor: primaryColor }}
                                >
                                    {time}
                                </button>
                            ))}
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-2">Tarde:</p>
                            {suggestedTimes.slice(2, 4).map((time, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSmartTimeSelect(time)}
                                    className="w-full mb-2 px-4 py-2 text-white rounded-lg text-sm font-medium hover:opacity-90 transition shadow-md"
                                    style={{ backgroundColor: primaryColor }}
                                >
                                    {time}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={handleManualTimeTrigger}
                            className="col-span-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-full text-sm font-medium hover:bg-gray-300 transition"
                        >
                            🕐 Otra hora...
                        </button>
                    </div>
                )}

                {/* TIME_MANUAL input */}
                {step === STEPS.TIME_MANUAL && (
                    <input
                        type="time"
                        onChange={(e) => e.target.value && handleManualTimeSubmit(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-500 rounded-lg focus:outline-none focus:ring-2 dark:bg-gray-700 dark:text-white"
                        style={{
                            '--tw-ring-color': primaryColor,
                            borderColor: primaryColor
                        }}
                    />
                )}

                {/* PHONE input */}
                {step === STEPS.PHONE && (
                    <SimpleInput
                        placeholder="Ej: 04141234567"
                        onSubmit={handlePhoneSubmit}
                        primaryColor={primaryColor}
                    />
                )}

                {/* PAYMENT METHOD buttons */}
                {step === STEPS.PAYMENT_METHOD && (
                    <div className="flex flex-wrap gap-2 justify-center">
                        {['Zelle', 'PayPal', 'Transferencia bancaria', 'Pago móvil (Bs)'].map(method => (
                            <button
                                key={method}
                                onClick={() => handlePaymentMethodSubmit(method)}
                                className="px-4 py-2 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-sm font-medium border border-gray-300 dark:border-gray-600 hover:bg-gray-100 transition"
                                style={{
                                    borderColor: primaryColor,
                                    color: primaryColor,
                                }}
                            >
                                {method}
                            </button>
                        ))}
                    </div>
                )}

                {/* EMAIL input */}
                {step === STEPS.EMAIL && (
                    <SimpleInput
                        placeholder="ejemplo@email.com"
                        onSubmit={handleEmailSubmit}
                        type="email"
                        primaryColor={primaryColor}
                    />
                )}
            </div>
        </div>
    );
}

OnlineChatBooking.propTypes = {
    doctorId: PropTypes.number.isRequired,
    doctor: PropTypes.object,
    onClose: PropTypes.func.isRequired
};
