import React from 'react';
import { isCapacitor } from '../../utils/platform';
import { useAuthStore } from '../../store/authStore';

/**
 * GynSysLoader - Spinner unificado para TODAS las pantallas de carga de GynSys.
 *
 * Estrategia anti-flash de color:
 * 1. Al montar, lee instantáneamente el color cacheado en localStorage
 *    (clave: 'gynsys_primary_color') para evitar el parpadeo de indigo→primario.
 * 2. Luego, si el store de auth ya tiene el usuario, actualiza al color del store.
 * 3. Si se pasa una prop `color` explícita, tiene máxima prioridad.
 *
 * Props:
 *   color       {string}  Color hex explícito (prioridad máxima). Opcional.
 *   fullScreen  {boolean} true = ocupa toda la pantalla. Default: true.
 *   text        {string}  Texto debajo del spinner. Default: "Cargando..."
 *   className   {string}  Clases extra para el contenedor.
 */
const GynSysLoader = ({ className = '', fullScreen = true, text = 'Cargando...', color }) => {
    const { user } = useAuthStore();

    // ── Derivar color sin flash ──────────────────────────────────────────────
    // Prioridad: prop color → store (usuario autenticado) → localStorage cache → fallback neutro
    const resolveColor = () => {
        if (color) return color;
        if (user?.theme_primary_color) return user.theme_primary_color;
        // Leer cache guardado en localStorage para evitar el flash indigo→primario
        const cached = localStorage.getItem('gynsys_primary_color');
        if (cached) return cached;
        // Fallback neutro gris, nunca indigo hardcodeado
        return '#6B7280';
    };

    const finalColor = resolveColor();

    // En la app nativa (Capacitor), el overlay nativo de Android ya muestra
    // la pantalla de carga. No mostramos nada desde React para evitar dualidad.
    if (isCapacitor() && fullScreen) {
        return null;
    }

    const containerClasses = fullScreen
        ? `min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-900 gap-4 ${className}`
        : `flex flex-col items-center justify-center py-10 gap-4 ${className}`;

    return (
        <div className={containerClasses}>
            <div
                className="w-8 h-8 rounded-full border-4 border-gray-200 dark:border-gray-700 animate-spin"
                style={{ borderTopColor: finalColor }}
            />
            {text && (
                <p className="text-sm font-medium text-gray-400 dark:text-gray-500 tracking-widest uppercase">
                    {text}
                </p>
            )}
        </div>
    );
};

export default GynSysLoader;
