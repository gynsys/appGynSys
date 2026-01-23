import React from 'react';
import { FiClock, FiCalendar, FiArrowRight } from 'react-icons/fi';

export const WelcomeOverlay = ({ patientName, doctorName, onStart, onLater, appointmentDate }) => {
    return (
        <div className="fixed inset-0 z-50 bg-white flex flex-col animate-fade-in">
            {/* Header Splash */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-indigo-50 to-white">

                <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-6 text-indigo-600 shadow-sm">
                    <span className="text-3xl font-bold">{doctorName ? doctorName.charAt(0) : "G"}</span>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Hola, {patientName || 'Paciente'}
                </h1>
                <p className="text-gray-600 max-w-xs mx-auto mb-8">
                    Soy el asistente virtual de <span className="font-semibold text-indigo-700">{doctorName}</span>.
                </p>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 max-w-sm w-full">
                    <p className="text-gray-700 mb-4 font-medium">
                        ¿Quieres completar tu preconsulta ahora?
                    </p>
                    <p className="text-sm text-gray-500 mb-6">
                        Ayuda a la doctora a estudiar tu caso antes de la cita.
                    </p>

                    <div className="space-y-3">
                        <button
                            onClick={onStart}
                            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition shadow-md flex items-center justify-center gap-2"
                        >
                            Sí, completar ahora <FiArrowRight />
                        </button>

                        <button
                            onClick={onLater}
                            className="w-full py-3 px-4 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-xl border border-gray-200 transition"
                        >
                            No, más tarde
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ReminderScreen = ({ appointmentDate, onStart }) => {
    // Parse date if available, otherwise generic
    const dateStr = appointmentDate
        ? new Date(appointmentDate).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
        : "la fecha de tu cita";

    return (
        <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6 text-amber-500">
                <FiClock size={32} />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Está bien, no hay problema</h2>

            <p className="text-gray-600 max-w-xs mx-auto mb-8 leading-relaxed">
                Recuerda que debes completarla antes de: <br />
                <span className="font-bold text-indigo-600 block mt-2 text-lg capitalize">{dateStr}</span>
            </p>

            <p className="text-sm text-gray-400 mb-12">
                Te enviaremos un recordatorio.
            </p>

            <button
                onClick={onStart}
                className="text-indigo-600 font-medium hover:underline"
            >
                Cambie de opinión, completar ahora
            </button>
        </div>
    );
};
