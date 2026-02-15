import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import cycleService from '../services/cycleService'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function CycleReportPage() {
    const { user, isAuthenticated } = useAuthStore()
    const [history, setHistory] = useState([])
    const [symptoms, setSymptoms] = useState([])
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadData = async () => {
            if (!isAuthenticated) return
            try {
                // Fetch with individual error handling to prevent one failure from blocking others
                const [cyclesData, statsData, symptomsData] = await Promise.all([
                    cycleService.getCycles().catch(err => {
                        console.error("Cycles fetch error:", err);
                        return [];
                    }),
                    cycleService.getStats().catch(err => {
                        console.error("Stats fetch error:", err);
                        return null;
                    }),
                    cycleService.getSymptoms().catch(err => {
                        console.error("Symptoms fetch error:", err);
                        return [];
                    })
                ])

                const uniqueCycles = cyclesData && Array.isArray(cyclesData)
                    ? Object.values(cyclesData.reduce((acc, current) => {
                        if (!current.start_date) return acc;
                        const dateKey = current.start_date.split('T')[0];
                        if (!acc[dateKey] || (!acc[dateKey].end_date && current.end_date)) {
                            acc[dateKey] = current;
                        }
                        return acc;
                    }, {})).sort((a, b) => new Date(b.start_date) - new Date(a.start_date))
                    : [];

                setHistory(uniqueCycles)
                setStats(statsData)
                setSymptoms(symptomsData || [])
            } catch (e) {
                console.error("Critical error in CycleReportPage loadData:", e)
            } finally {
                // Always clear loading regardless of what happened
                setLoading(false)
            }
        }
        loadData()
    }, [isAuthenticated])

    if (loading) return (
        <div className="p-12 text-center flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600 font-medium">Generando reporte ginecológico...</p>
        </div>
    )

    // Helper for safe formatting
    const safeFormat = (dateStr, fmt = 'dd/MM/yyyy') => {
        if (!dateStr) return '-';
        try {
            return format(new Date(dateStr), fmt, { locale: es });
        } catch (e) {
            return dateStr;
        }
    }

    return (
        <div className="bg-white min-h-screen text-black p-8 max-w-4xl mx-auto print:max-w-none print:p-0">
            {/* Header */}
            <div className="border-b-2 border-black pb-4 mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold uppercase tracking-wide mb-1">Reporte de Control Ginecológico</h1>
                    <p className="text-sm text-gray-600">Generado el: {safeFormat(new Date(), "d 'de' MMMM, yyyy")}</p>
                </div>
                <div className="text-right">
                    <p className="font-bold text-lg">{user?.nombre_completo || 'Paciente'}</p>
                    <p className="text-sm">{user?.email}</p>
                </div>
            </div>

            {/* Stats Overview */}
            {stats && (
                <div className="mb-8 p-4 bg-gray-50 border border-gray-200 rounded-lg print:border-none print:bg-transparent print:p-0">
                    <h2 className="text-lg font-bold mb-4 border-b border-gray-300 pb-1">Resumen Estadístico</h2>
                    <div className="grid grid-cols-4 gap-4 text-center">
                        <div className="bg-white p-2 rounded shadow-sm border border-gray-100 print:shadow-none print:border-none">
                            <p className="text-[10px] text-gray-500 uppercase font-semibold">Ciclo Promedio</p>
                            <p className="text-xl font-bold text-pink-600">{stats.avg_cycle_length || 28} días</p>
                        </div>
                        <div className="bg-white p-2 rounded shadow-sm border border-gray-100 print:shadow-none print:border-none">
                            <p className="text-[10px] text-gray-500 uppercase font-semibold">Periodo Promedio</p>
                            <p className="text-xl font-bold text-pink-600">{stats.avg_period_length || 5} días</p>
                        </div>
                        <div className="bg-white p-2 rounded shadow-sm border border-gray-100 print:shadow-none print:border-none">
                            <p className="text-[10px] text-gray-500 uppercase font-semibold">Ciclos Totales</p>
                            <p className="text-xl font-bold text-pink-600">{stats.total_cycles || 0}</p>
                        </div>
                        <div className="bg-white p-2 rounded shadow-sm border border-gray-100 print:shadow-none print:border-none">
                            <p className="text-[10px] text-gray-500 uppercase font-semibold">Variación</p>
                            <p className="text-xl font-bold text-pink-600">{(stats.cycle_range_max - stats.cycle_range_min) || 0} d</p>
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
                        {history.length > 0 ? history.map((cycle, i) => (
                            <tr key={i} className="hover:bg-gray-50/50">
                                <td className="py-2 px-2">{safeFormat(cycle.start_date)}</td>
                                <td className="py-2 px-2">{cycle.end_date ? safeFormat(cycle.end_date) : 'En curso'}</td>
                                <td className="py-2 px-2">{cycle.cycle_length || '-'} días</td>
                                <td className="py-2 px-2 text-gray-600 italic max-w-xs">{cycle.notes || '-'}</td>
                            </tr>
                        )) : (
                            <tr><td colSpan="4" className="py-4 text-center text-gray-400 italic">No hay ciclos registrados.</td></tr>
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
                        {symptoms.length > 0 ? (
                            [...symptoms].sort((a, b) => new Date(b.date) - new Date(a.date)).map((item, i) => (
                                <tr key={i} className="hover:bg-gray-50/50">
                                    <td className="py-2 px-2 w-24 align-top">{safeFormat(item.date)}</td>
                                    <td className="py-2 px-2 align-top">
                                        <div className="flex flex-col gap-0.5 text-[10px] text-gray-600">
                                            {item.pain_level > 0 && <span>Dolor: {item.pain_level}/10</span>}
                                            {item.flow_intensity && <span>Flujo: {item.flow_intensity === 'heavy' ? 'Abundante' : item.flow_intensity === 'medium' ? 'Medio' : 'Ligero'}</span>}
                                            {item.mood && <span className="capitalize">Ánimo: {item.mood}</span>}
                                        </div>
                                    </td>
                                    <td className="py-2 px-2 align-top text-xs">
                                        {item.symptoms && item.symptoms.length > 0 ? item.symptoms.join(', ') : '-'}
                                    </td>
                                    <td className="py-2 px-2 text-gray-600 italic max-w-xs align-top text-xs">{item.notes || '-'}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="py-4 text-center text-gray-500 italic">No hay síntomas registrados recientes.</td>
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
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
                    </svg>
                    Imprimir / Guardar PDF
                </button>
            </div>
        </div>
    )
}
