import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiChevronRight, FiCheckCircle } from 'react-icons/fi';

// Helper for transparency
const hexToRgba = (hex, alpha) => {
  try {
    if (!hex || hex === 'transparent') return 'transparent';
    let r, g, b;
    const cleanHex = hex.replace('#', '');
    if (cleanHex.length === 3) {
      r = parseInt(cleanHex.slice(0, 1).repeat(2), 16);
      g = parseInt(cleanHex.slice(1, 2).repeat(2), 16);
      b = parseInt(cleanHex.slice(2, 3).repeat(2), 16);
    } else {
      r = parseInt(cleanHex.slice(0, 2), 16);
      g = parseInt(cleanHex.slice(2, 4), 16);
      b = parseInt(cleanHex.slice(4, 6), 16);
    }
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } catch (e) {
    return hex;
  }
};

export default function AppointmentRequestsWidget({ pendingCount = 0, primaryColor = '#4F46E5' }) {
  const navigate = useNavigate();

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border dark:border-gray-700 p-5 transition-all duration-300 active:scale-[0.99] mb-4"
      style={{ 
        borderColor: hexToRgba(primaryColor, 0.1),
        boxShadow: `0 20px 25px -5px ${hexToRgba(primaryColor, 0.05)}, 0 10px 10px -5px ${hexToRgba(primaryColor, 0.02)}`
      }}
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl transition-all duration-500 ${pendingCount > 0 ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'bg-gray-50 dark:bg-gray-700'}`}>
            {pendingCount > 0 ? (
              <div className="relative">
                <FiBell className="w-6 h-6 text-indigo-600 dark:text-indigo-400 animate-bounce-slow" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black h-4 w-4 flex items-center justify-center rounded-full">
                  {pendingCount}
                </span>
                <style>{`
                  @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-3px); }
                  }
                  .animate-bounce-slow {
                    animation: bounce-slow 2s infinite;
                  }
                `}</style>
              </div>
            ) : (
              <FiCheckCircle className="w-6 h-6 text-green-500" />
            )}
          </div>
          <div className="text-center sm:text-left">
            <h4 className="text-base font-bold text-gray-900 dark:text-white mb-0.5">
              Solicitudes de Cita
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-[280px]">
              {pendingCount > 0 
                ? `Tienes ${pendingCount} ${pendingCount === 1 ? 'solicitud nueva' : 'solicitudes nuevas'} esperando confirmación.`
                : 'No tienes nuevas solicitudes pendientes por ahora.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/dashboard/requests')}
          className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold transition-all transform active:scale-95 flex items-center justify-center gap-2 min-w-[160px] text-white shadow-lg shadow-indigo-200 dark:shadow-none"
          style={{ 
            background: pendingCount > 0 
              ? `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`
              : '#f3f4f6',
            color: pendingCount > 0 ? 'white' : '#6b7280'
          }}
        >
          {pendingCount > 0 ? 'Gestionar Solicitudes' : 'Ver Historial'}
          <FiChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
