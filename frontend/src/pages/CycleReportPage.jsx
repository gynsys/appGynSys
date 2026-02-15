import { useEffect, useState, useMemo, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import cycleService from '../services/cycleService';
import { format, isValid, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// --- Helpers seguros para fechas ---
const safeParseDate = (dateStr) => {
    if (!dateStr) return null;
    try {
        const parsed = parseISO(dateStr);
        return isValid(parsed) ? parsed : null;
    } catch {
        return null;
    }
};

const safeFormat = (dateInput, fmt = 'dd/MM/yyyy') => {
    if (!dateInput) return '-';

    const date = typeof dateInput === 'string' ? safeParseDate(dateInput) : dateInput;
    if (!date || !isValid(date)) {
        // Si no podemos parsear, devolvemos el string original (como último recurso)
        return typeof dateInput === 'string' ? dateInput : '-';
    }

    try {
        return format(date, fmt, { locale: es });
    } catch {
        return '-';
    }
};

export default function CycleReportPage() {
    const { user, isAuthenticated, loading: isAuthLoading } = useAuthStore();
    const [history, setHistory] = useState([]);
    const [symptoms, setSymptoms] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Control de componente montado y timeout
    const isMounted = useRef(true);
    const timeoutRef = useRef(null);

    // Limpieza al desmontar
    useEffect(() => {
        return () => {
            isMounted.current = false;
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };
    }, []);

    // Memoizar síntomas ordenados (de más reciente a más antiguo)
    const sortedSymptoms = useMemo(() => {
        if (!Array.isArray(symptoms) || symptoms.length === 0) return [];

        return [...symptoms].sort((a, b) => {
            const dateA = safeParseDate(a.date);
            const dateB = safeParseDate(b.date);

            // Fechas inválidas al final
            if (!dateA && !dateB) return 0;
            if (!dateA) return 1;
            if (!dateB) return -1;

            return dateB - dateA; // descendente
        });
    }, [symptoms]);

    useEffect(() => {
        // Reiniciar error cuando cambia la autenticación
        setError(null);

        // Esperar a que el store de autenticación termine de inicializar
        if (isAuthLoading) return;

        // Si no está autenticado, mostrar estado vacío (no loading infinito)
        if (!isAuthenticated) {
            setLoading(false);
            setError('Usuario no autenticado');
            return;
        }

        // Configurar timeout de seguridad (10s)
        timeoutRef.current = setTimeout(() => {
            if (isMounted.current && loading) {
                console.warn('CycleReportPage: Timeout de carga alcanzado');
                setLoading(false);
                setError('Tiempo de espera agotado. Intente recargar.');
            }
        }, 10000);

        const loadData = async () => {
            if (!isMounted.current) return;

            setLoading(true);
            setError(null);

            try {
                // Usar Promise.allSettled para no fallar completamente si una petición falla
                const results = await Promise.allSettled([
                    cycleService.getCycles(),
                    cycleService.getStats(),
                    cycleService.getSymptoms(),
                ]);

                const [cyclesResult, statsResult, symptomsResult] = results;

                // --- Procesar ciclos ---
                let cyclesData = [];
                if (cyclesResult.status === 'fulfilled') {
                    cyclesData = Array.isArray(cyclesResult.value) ? cyclesResult.value : [];
                } else {
                    console.error('Error cargando ciclos:', cyclesResult.reason);
                    setError((prev) => prev || 'Error al cargar el historial de ciclos');
                }

                // Deduplicación inteligente: usar ID si existe, fecha como fallback, y elegir el más completo
                const cyclesMap = new Map();
                cyclesData.forEach((cycle) => {
                    if (!cycle || !cycle.start_date) return;

                    // Clave única: priorizar ID, si no, usar los primeros 10 caracteres de start_date (formato YYYY-MM-DD)
                    const idKey = cycle.id || String(cycle.start_date).substring(0, 10);
                    const existing = cyclesMap.get(idKey);

                    // Puntuación para decidir cuál es "mejor": presencia de end_date + número de campos
                    const score = (cycle.end_date ? 10 : 0) + Object.keys(cycle).length;

                    if (!existing || score > (existing.score || 0)) {
                        cyclesMap.set(idKey, { ...cycle, score }); // guardamos la puntuación internamente
                    }
                });

                const uniqueCycles = Array.from(cyclesMap.values())
                    .map(({ score, ...cycle }) => cycle) // quitamos la propiedad temporal 'score'
                    .sort((a, b) => {
                        const dateA = safeParseDate(a.start_date);
                        const dateB = safeParseDate(b.start_date);

                        // Fechas inválidas al final
                        if (!dateA && !dateB) return 0;
                        if (!dateA) return 1;
                        if (!dateB) return -1;

                        return dateB - dateA; // más reciente primero
                    });

                // --- Procesar estadísticas ---
                let statsData = null;
                if (statsResult.status === 'fulfilled') {
                    statsData = statsResult.value;
                } else {
                    console.error('Error cargando estadísticas:', statsResult.reason);
                }

                // --- Procesar síntomas ---
                let symptomsData = [];
                if (symptomsResult.status === 'fulfilled') {
                    symptomsData = Array.isArray(symptomsResult.value) ? symptomsResult.value : [];
                } else {
                    console.error('Error cargando síntomas:', symptomsResult.reason);
                }

                if (isMounted.current) {
                    setHistory(uniqueCycles);
                    setStats(statsData);
                    setSymptoms(symptomsData);
                }
            } catch (err) {
                // Este catch solo atraparía errores inesperados en el bloque try (no los de allSettled)
                console.error('Error crítico en loadData:', err);
                if (isMounted.current) {
                    setError('Error inesperado al cargar los datos');
                }
            } finally {
                if (isMounted.current) {
                    setLoading(false);
                    if (timeoutRef.current) {
                        clearTimeout(timeoutRef.current);
                        timeoutRef.current = null;
                    }
                }
            }
        };

        loadData();

        // Dependencias: se ejecuta cuando cambia el estado de autenticación
    }, [isAuthenticated, isAuthLoading]);

    // --- Renderizado condicional ---
    if (isAuthLoading || loading) {
        return (
            <div className="p-12 text-center flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-600 font-medium">Generando reporte ginecológico...</p>
                <p className="text-xs text-gray-400">Si esto tarda demasiado, verifica tu conexión.</p>
            </div>
        );
    }

    // Si hay error y no hay datos mostrados (para no ocultar datos parciales)
    if (error && !stats && history.length === 0 && symptoms.length === 0) {
        return (
            <div className="p-12 text-center">
                <p className="text-red-600 font-medium mb-2">Error al cargar el reporte</p>
                <p className="text-gray-600 text-sm mb-4">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="bg-pink-500 text-white px-4 py-2 rounded hover:bg-pink-600"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen text-black p-8 max-w-4xl mx-auto print:max-w-none print:p-0">
            {/* Header */}
            <div className="border-b-2 border-black pb-4 mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold uppercase tracking-wide mb-1">Reporte de Control Ginecológico</h1>
                    <p className="text-sm text-gray-600">
                        Generado el: {safeFormat(new Date(), "d 'de' MMMM, yyyy")}
                    </p>
                </div>
                <div className="text-right">
                    <p className="font-bold text-lg">{user?.nombre_completo || 'Paciente'}</p>
                    <p className="text-sm">{user?.email || ''}</p>
                </div>
            </div>

            {/* Stats Overview */}
            {stats && (
                <div className="mb-8 p-4 bg-gray-50 border border-gray-200 rounded-lg print:border-none print:bg-transparent print:p-0">
                    <h2 className="text-lg font-bold mb-4 border-b border-gray-300 pb-1">Resumen Estadístico</h2>
                    <div className="grid grid-cols-4 gap-4 text-center">
                        <div className="bg-white p-2 rounded shadow-sm border border-gray-100 print:shadow-none print:border-none">
                            <p className="text-[10px] text-gray-500 uppercase font-semibold">Ciclo Promedio</p>
                            <p className="text-xl font-bold text-pink-600">
                                {stats.avg_cycle_length != null ? `${stats.avg_cycle_length} días` : '—'}
                            </p>
                        </div>
                        <div className="bg-white p-2 rounded shadow-sm border border-gray-100 print:shadow-none print:border-none">
                            <p className="text-[10px] text-gray-500 uppercase font-semibold">Periodo Promedio</p>
                            <p className="text-xl font-bold text-pink-600">
                                {stats.avg_period_length != null ? `${stats.avg_period_length} días` : '—'}
                            </p>
                        </div>
                        <div className="bg-white p-2 rounded shadow-sm border border-gray-100 print:shadow-none print:border-none">
                            <p className="text-[10px] text-gray-500 uppercase font-semibold">Ciclos Totales</p>
                            <p className="text-xl font-bold text-pink-600">{stats.total_cycles ?? 0}</p>
                        </div>
                        <div className="bg-white p-2 rounded shadow-sm border border-gray-100 print:shadow-none print:border-none">
                            <p className="text-[10px] text-gray-500 uppercase font-semibold">Variación</p>
                            <p className="text-xl font-bold text-pink-600">
                                {stats.cycle_range_max != null && stats.cycle_range_min != null
                                    ? `${stats.cycle_range_max - stats.cycle_range_min} d`
                                    : '—'}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Cycle History Table */}
            <div className="mb-8">
                <h2 className="text-lg font-bold mb-4 border-b border-gray-300 pb-1">Historial de Ciclos</h2>
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr className="border-b border-black bg-gray-50">
                            <th className="py-2 px-2">Inicio</th>
                            <th className="py-2 px-2">Fin</th>
                            <th className="py-2 px-2">Duración</th>
                            <th className="py-2 px-2">Notas</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {history.length > 0 ? (
                            history.map((cycle) => {
                                // Usamos un key único: primero el id, si no, la fecha de inicio (con hora para evitar colisiones)
                                const key = cycle.id || `${cycle.start_date}-${Math.random()}`;
                                return (
                                    <tr key={key} className="hover:bg-gray-50/50">
                                        <td className="py-2 px-2">{safeFormat(cycle.start_date)}</td>
                                        <td className="py-2 px-2">
                                            {cycle.end_date ? safeFormat(cycle.end_date) : 'En curso'}
                                        </td>
                                        <td className="py-2 px-2">{cycle.cycle_length ?? '-'} días</td>
                                        <td className="py-2 px-2 text-gray-600 italic max-w-xs">
                                            {cycle.notes || '-'}
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="4" className="py-4 text-center text-gray-400 italic">
                                    No hay ciclos registrados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Symptoms History Table */}
            <div className="mb-8">
                <h2 className="text-lg font-bold mb-4 border-b border-gray-300 pb-1">Registro de Síntomas</h2>
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr className="border-b border-black bg-gray-50">
                            <th className="py-2 px-2">Fecha</th>
                            <th className="py-2 px-2 w-32">Estado</th>
                            <th className="py-2 px-2">Síntomas</th>
                            <th className="py-2 px-2">Notas</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {sortedSymptoms.length > 0 ? (
                            sortedSymptoms.map((item) => {
                                // Key estable: usar id, o una combinación de fecha y síntomas si no hay id
                                const key =
                                    item.id ||
                                    `${item.date}-${item.symptoms ? item.symptoms.join('-') : 'nosymptoms'}`;
                                return (
                                    <tr key={key} className="hover:bg-gray-50/50">
                                        <td className="py-2 px-2 w-24 align-top">{safeFormat(item.date)}</td>
                                        <td className="py-2 px-2 align-top">
                                            <div className="flex flex-col gap-0.5 text-[10px] text-gray-600">
                                                {item.pain_level > 0 && <span>Dolor: {item.pain_level}/10</span>}
                                                {item.flow_intensity && (
                                                    <span>
                                                        Flujo:{' '}
                                                        {item.flow_intensity === 'heavy'
                                                            ? 'Abundante'
                                                            : item.flow_intensity === 'medium'
                                                                ? 'Medio'
                                                                : item.flow_intensity === 'light'
                                                                    ? 'Ligero'
                                                                    : item.flow_intensity}
                                                    </span>
                                                )}
                                                {item.mood && <span className="capitalize">Ánimo: {item.mood}</span>}
                                            </div>
                                        </td>
                                        <td className="py-2 px-2 align-top text-xs">
                                            {item.symptoms && item.symptoms.length > 0
                                                ? item.symptoms.join(', ')
                                                : '-'}
                                        </td>
                                        <td className="py-2 px-2 text-gray-600 italic max-w-xs align-top text-xs">
                                            {item.notes || '-'}
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="4" className="py-4 text-center text-gray-500 italic">
                                    No hay síntomas registrados recientes.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Disclaimer */}
            <div className="mt-12 text-xs text-gray-400 text-center border-t pt-2">
                <p>Este reporte es informativo y no constituye un diagnóstico médico. Por favor consulte a su especialista.</p>
                <p>AppGynSys - Salud Integral Femenina</p>
            </div>

            {/* Print Button - Hidden when printing */}
            <div className="fixed bottom-8 right-8 print:hidden">
                <button
                    onClick={() => window.print()}
                    className="bg-black text-white px-6 py-3 rounded-full shadow-lg hover:bg-gray-800 font-bold flex items-center gap-2"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path
                            fillRule="evenodd"
                            d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z"
                            clipRule="evenodd"
                        />
                    </svg>
                    Imprimir / Guardar PDF
                </button>
            </div>
        </div>
    );
}
