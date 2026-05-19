import React from 'react';
import { isCapacitor } from '../../utils/platform';
import { useAuthStore } from '../../store/authStore';

const GynSysLoader = ({ className = "", fullScreen = true, text = "Cargando...", color }) => {
    const { user } = useAuthStore();
    const finalColor = color || user?.theme_primary_color || '#4F46E5';

    // En la app nativa (Capacitor), el overlay nativo de Android
    // ya muestra la pantalla de carga. No mostramos nada desde React
    // para evitar la dualidad de indicadores en pantalla completa.
    if (isCapacitor() && fullScreen) {
        return null;
    }

    const containerClasses = fullScreen 
        ? `min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-900 gap-4 ${className}`
        : `flex flex-col items-center justify-center py-10 gap-4 ${className}`;

    return (
        <div className={containerClasses}>
            <div 
                className="w-8 h-8 rounded-full border-4 border-gray-200 dark:border-gray-800 animate-spin"
                style={{ borderTopColor: finalColor }}
            ></div>
            {text && (
                <p className="text-sm font-medium text-gray-400 dark:text-gray-500 tracking-widest uppercase">
                    {text}
                </p>
            )}
        </div>
    );
};

export default GynSysLoader;
