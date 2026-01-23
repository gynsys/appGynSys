
import React, { useEffect, useRef, useState, Fragment } from 'react';
import { Transition, Dialog } from '@headlessui/react';
import { MdClose, MdCheckCircle, MdLockClock } from 'react-icons/md';
import { FiClock, FiCalendar, FiArrowRight, FiCpu, FiUser, FiEdit2 } from 'react-icons/fi';
import { usePreconsultaEngine } from '../hooks/usePreconsultaEngine';
import { preconsultaTexts } from '../data/texts';
import { PRECONSULTA_OPTIONS } from '../data/options';
import { TextInput } from '../components/inputs/TextInput';
import { NumericInput } from '../components/inputs/NumericInput';
import { YesNoInput } from '../components/inputs/YesNoInput';
import { ButtonSelection } from '../components/inputs/ButtonSelection';
import { ChecklistInput } from '../components/inputs/ChecklistInput';
import { ScaleInput } from '../components/inputs/ScaleInput';
import { CustomDatePicker } from '../components/inputs/CustomDatePicker';
import { CustomMonthYearPicker } from '../components/inputs/CustomMonthYearPicker';
import { ObstetricTable } from '../components/inputs/ObstetricTable';
import { MonthYearPicker } from '../components/inputs/MonthYearPicker';
import { YearInput } from '../components/inputs/YearInput';
import { SelectInput } from '../components/inputs/SelectInput';
import ModernLoader from '../../../components/common/ModernLoader';

// Shared Sub-components
const BotMessage = ({ text, primaryColor = '#4F46E5' }) => (
    <div className="flex items-end gap-2 mb-4 animate-fade-in">
        <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${primaryColor}1a`, color: primaryColor }}
        >
            <FiCpu size={18} />
        </div>
        <div
            className="border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm max-w-[85%] text-sm"
            style={{ backgroundColor: `${primaryColor}33` }}
        >
            <p className="text-gray-800 dark:text-gray-200 leading-relaxed">{text}</p>
        </div>
    </div>
);

const UserMessage = ({ text, onEdit, primaryColor = '#4F46E5' }) => (
    <div className="flex items-end justify-end gap-2 mb-4 animate-fade-in">
        <div
            className="rounded-2xl rounded-br-none px-4 py-2 shadow-md max-w-[85%] group relative text-sm"
            style={{ backgroundColor: primaryColor }}
        >
            <p className="text-white leading-relaxed whitespace-pre-wrap">{text}</p>
            {onEdit && (
                <button
                    onClick={onEdit}
                    className="absolute -left-8 top-1/2 -translate-y-1/2 text-gray-400 opacity-0 group-hover:opacity-100 transition-all p-1"
                    style={{ color: '#9CA3AF' }}
                    title="Editar respuesta"
                >
                    <FiEdit2 size={14} />
                </button>
            )}
        </div>
        <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white"
            style={{ backgroundColor: primaryColor }}
        >
            <FiUser size={18} />
        </div>
    </div>
);

export default function PreconsultaUI({
    isOpen,
    onClose,
    flowData,
    doctorConfig = {},
    initialAnswers = {},
    onSubmit,
    loading = false,
    primaryColor = '#4F46E5',
    expirationData = null,
    startNodeIdOverride = null,
    forceViewMode = null // 'chat' to skip welcome
}) {
    const [viewMode, setViewMode] = useState('loading'); // loading | welcome | reminder | chat
    const [inputsReady, setInputsReady] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [submitError, setSubmitError] = useState(null);

    // Engine Hook
    const { currentNode, isFinished, goToNext, answers, history, rewindTo, loopState, setAnswers, jumpTo } = usePreconsultaEngine(flowData, doctorConfig);
    const bottomRef = useRef(null);

    // Initialization Effect
    useEffect(() => {
        if (!isOpen) return;

        if (loading) {
            setViewMode('loading');
            return;
        }

        // Initialize Answers if provided
        if (Object.keys(initialAnswers).length > 0 && Object.keys(answers).length === 0) {
            setAnswers(initialAnswers);
        }

        // Determine Start View
        if (forceViewMode) {
            setViewMode(forceViewMode);
            setInputsReady(true);
        } else if (!expirationData) {
            setViewMode('welcome');
            setInputsReady(true);
        }

        // Start Node Override (for when engine defaults don't match)
        if (startNodeIdOverride) {
            jumpTo(startNodeIdOverride);
        }

    }, [isOpen, loading, forceViewMode, startNodeIdOverride]);


    // Auto-Skip based on "show_if" logic
    useEffect(() => {
        if (!currentNode || !currentNode.show_if) return;
        const { key, value } = currentNode.show_if;
        const actualAnswer = answers[key];
        if (actualAnswer === value) return;
        console.log(`[AutoSkip] Skipping ${currentNode.id} because ${key} is ${actualAnswer}`);
        goToNext();
    }, [currentNode, answers]);

    // Scroll effect
    useEffect(() => {
        if (viewMode === 'chat') {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [history.length, currentNode, viewMode]);

    // Auto-Close on Success
    useEffect(() => {
        if (submitted) {
            const timer = setTimeout(() => {
                onClose();
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [submitted, onClose]);


    const handleSubmit = async () => {
        setSubmitting(true);
        setSubmitError(null);
        try {
            await onSubmit(answers);
            setSubmitted(true);
        } catch (error) {
            console.error(error);
            setSubmitError(error.message || "Error al guardar. Intenta de nuevo.");
        } finally {
            setSubmitting(false);
        }
    };

    const formatAnswer = (answer) => {
        if (answer === null || answer === undefined) return '';
        if (typeof answer === 'boolean') return answer ? 'Sí' : 'No';
        if (Array.isArray(answer)) return answer.join(', ');
        if (typeof answer === 'object' && answer !== null) {
            if (answer.summary && answer.gestas !== undefined) return answer.summary;
            return JSON.stringify(answer);
        }
        return answer.toString();
    };

    const getLabel = (node) => {
        if (!node) return 'Cargando...';
        if (node.text) return node.text;
        if (node.text_raw) return node.text_raw;
        let label = node.text_key ? preconsultaTexts[node.text_key] : 'Pregunta sin texto';
        const isLoopNode = node.type?.startsWith('loop_') || node.type === 'year_picker';
        if (isLoopNode && node.text_template && loopState) {
            label = node.text_template.replace('#{ordinal}', (loopState.currentIndex + 1).toString());
        } else if (isLoopNode && loopState && loopState.active) {
            label = `Bebé #${loopState.currentIndex + 1}: ${label}`;
        }
        return label;
    };

    const renderInput = () => {
        if (!currentNode) return null;
        const label = "";
        const commonProps = { label, onNext: goToNext, primaryColor };
        const key = currentNode.id;
        switch (currentNode.type) {
            case 'text_input': return <TextInput key={key} {...commonProps} />;
            case 'numeric_input': case 'loop_numeric_input': case 'number_grid': case 'sexarche_picker': return <NumericInput key={key} {...commonProps} />;
            case 'yes_no': return <YesNoInput key={key} {...commonProps} />;
            case 'buttons': case 'loop_buttons': return <ButtonSelection key={key} {...commonProps} options={currentNode.options || []} />;
            case 'dropdown': return <SelectInput key={key} {...commonProps} options={currentNode.options || []} />;
            case 'checklist': case 'loop_checklist':
                const opts = currentNode.options || (currentNode.keyboard_type ? PRECONSULTA_OPTIONS[currentNode.keyboard_type] : []);
                return <ChecklistInput key={key} {...commonProps} keyboardType={currentNode.keyboard_type} options={opts} otherPrompt={currentNode.other_prompt_key ? preconsultaTexts[currentNode.other_prompt_key] : undefined} />;
            case 'scale': return <ScaleInput key={key} {...commonProps} />;
            case 'date': case 'calendar': return <CustomDatePicker key={key} {...commonProps} />;
            case 'month_year_picker': case 'month_picker': return <MonthYearPicker key={key} {...commonProps} allowNever={currentNode.allow_text === 'Nunca'} />;
            case 'year_picker': return <YearInput key={key} {...commonProps} />;
            case 'ho_table': return <ObstetricTable key={key} {...commonProps} />;
            default: return <div key={key} className="text-red-400 text-xs">Tipo no soportado: {currentNode.type} <button onClick={() => goToNext('skipped')} className="underline">Saltar</button></div>;
        }
    };

    if (!isOpen) return null;

    return (
        <Transition show={isOpen} as={Fragment}>
            <div className="relative z-50">
                <Transition.Child
                    as={Fragment}
                    enter="transform transition duration-300 ease-in-out"
                    enterFrom="translate-y-full opacity-0 sm:translate-y-10 sm:scale-95"
                    enterTo="translate-y-0 opacity-100 sm:scale-100"
                    leave="transform transition duration-200 ease-in-out"
                    leaveFrom="translate-y-0 opacity-100 sm:scale-100"
                    leaveTo="translate-y-full opacity-0 sm:translate-y-10 sm:scale-95"
                >
                    <div
                        className="fixed bottom-0 left-0 right-0 w-full md:w-[400px] md:bottom-24 md:right-8 md:left-auto bg-white dark:bg-gray-800 rounded-t-2xl rounded-b-none md:rounded-2xl shadow-2xl border-t-2 md:border-2 border-x-0 border-b-0 md:border-x-2 md:border-b-2 overflow-hidden flex flex-col h-[600px] max-h-[85vh]"
                        style={{ borderColor: `${primaryColor}33` }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-gray-800 dark:text-white text-sm">
                                    {viewMode === 'welcome' ? 'Hola!' : viewMode === 'reminder' ? 'Recordatorio' : 'Preconsulta Medica'}
                                </h3>
                            </div>
                            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                                <MdClose className="text-gray-500" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
                            <ModernLoader isOpen={loading || submitting} text={submitting ? "Guardando..." : "Cargando..."} />

                            {expirationData && (
                                <div className="flex flex-col h-full items-center justify-center p-8 text-center animate-fade-in bg-white dark:bg-gray-800 rounded-2xl">
                                    <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-full mb-6">
                                        <MdLockClock size={48} className="text-gray-500 dark:text-gray-300" />
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Enlace de Preconsulta Expirado</h2>
                                    <button onClick={onClose} className="mt-4 px-6 py-2 rounded-full text-sm font-medium bg-gray-200">Cerrar</button>
                                </div>
                            )}

                            {/* ------------ WELCOME VIEW ------------ */}
                            {!loading && !expirationData && viewMode === 'welcome' && (
                                <div className="flex flex-col h-full items-center justify-center p-2 text-center animate-fade-in">
                                    <div
                                        className="w-16 h-16 rounded-full flex items-center justify-center mb-4 text-white text-2xl font-bold"
                                        style={{ backgroundColor: primaryColor }}
                                    >
                                        {doctorConfig.doctor_name ? doctorConfig.doctor_name.charAt(0) : "D"}
                                    </div>

                                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                                        Hola, {doctorConfig.patient_name || 'Paciente'}
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-8 max-w-[250px]">
                                        Ayuda a {doctorConfig.doctor_name || 'tu doctor'} a preparar tu consulta.
                                        ¿Quieres llenar esto ahora?
                                    </p>

                                    <div className="w-full space-y-3">
                                        <button
                                            onClick={() => setViewMode('chat')}
                                            className="w-full py-3 px-4 text-white font-semibold rounded-xl transition shadow-md flex items-center justify-center gap-2"
                                            style={{ backgroundColor: primaryColor }}
                                        >
                                            Sí, comenzar <FiArrowRight />
                                        </button>

                                        <button
                                            onClick={() => setViewMode('reminder')}
                                            className="w-full py-3 px-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                                        >
                                            No, más tarde
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ------------ REMINDER VIEW ------------ */}
                            {!loading && !expirationData && viewMode === 'reminder' && (
                                <div className="flex flex-col h-full items-center justify-center p-2 text-center animate-fade-in">
                                    <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4 text-amber-500">
                                        <FiClock size={32} />
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Entendido</h2>
                                    <p className="text-gray-600 dark:text-gray-300 max-w-xs mx-auto mb-6 text-sm">
                                        Recuerda completarlo antes de tu cita:
                                    </p>

                                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-xl mb-8 shadow-sm">
                                        <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Tu Cita</p>
                                        <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                                            {doctorConfig.appointment_date
                                                ? new Date(doctorConfig.appointment_date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
                                                : "Fecha por confirmar"}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {doctorConfig.appointment_date
                                                ? new Date(doctorConfig.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                : ""}
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => setViewMode('chat')}
                                        className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline text-sm mb-4"
                                    >
                                        Cambie de opinión, completar ahora
                                    </button>

                                    <button
                                        onClick={onClose}
                                        className="flex items-center justify-center gap-2 border py-3 px-8 rounded-full font-bold transition-all shadow-md hover:scale-105 w-full mt-4 text-white"
                                        style={{
                                            backgroundColor: primaryColor,
                                            borderColor: primaryColor
                                        }}
                                    >
                                        Cerrar / Entendido
                                    </button>
                                </div>
                            )}

                            {/* ------------ CHAT VIEW ------------ */}
                            {!loading && !expirationData && viewMode === 'chat' && !submitted && (
                                <>
                                    {/* Intro Message */}
                                    {inputsReady && history.length === 0 && (
                                        <div className="mb-4">
                                            <BotMessage text={`Hola. Soy el asistente de ${doctorConfig.doctor_name || 'tu doctor'}. Por favor responde estas preguntas para agilizar tu consulta.`} primaryColor={primaryColor} />
                                        </div>
                                    )}

                                    {/* History */}
                                    {history.map((item, index) => {
                                        if (item.answer === null) return null;
                                        return (
                                            <div key={index}>
                                                <BotMessage text={getLabel(item.node)} primaryColor={primaryColor} />
                                                <UserMessage
                                                    text={formatAnswer(item.answer)}
                                                    onEdit={() => rewindTo(index)}
                                                    primaryColor={primaryColor}
                                                />
                                            </div>
                                        );
                                    })}

                                    {/* Inputs */}
                                    {!isFinished && inputsReady && (
                                        <div ref={bottomRef} className="pb-2">
                                            <BotMessage text={getLabel(currentNode)} primaryColor={primaryColor} />
                                            <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700 shadow-sm mt-2">
                                                {renderInput()}
                                            </div>
                                        </div>
                                    )}

                                    {/* Finished */}
                                    {isFinished && (
                                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm text-center">
                                            <h3 className="font-bold text-gray-800 dark:text-white mb-2">Resumen Completado</h3>
                                            <p className="text-xs text-gray-500 mb-4">Ya hemos recopilado toda la información necesaria.</p>
                                            <button
                                                onClick={handleSubmit}
                                                className="w-full py-3 text-white rounded-lg font-bold shadow-md hover:opacity-90 transition"
                                                style={{ backgroundColor: primaryColor }}
                                            >
                                                Enviar Respuestas
                                            </button>
                                            {submitError && <p className="text-red-500 text-xs mt-2">{submitError}</p>}
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Success View */}
                            {submitted && (
                                <div className="flex flex-col h-full items-center justify-center p-8 text-center animate-fade-in bg-white dark:bg-gray-800 rounded-2xl">
                                    <MdCheckCircle size={80} style={{ color: primaryColor }} className="mb-6 drop-shadow-md animate-bounce" />
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">¡Solicitud Enviada!</h2>
                                    <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-xs mx-auto">
                                        Tus antecedentes han sido guardados correctamente.
                                    </p>
                                    <p className="text-sm text-gray-400">Cerrando en unos segundos...</p>
                                </div>
                            )}

                        </div>
                    </div>
                </Transition.Child>
            </div>
        </Transition>
    );
}
