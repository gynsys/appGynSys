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
            if (!isAuthenticated) return // Protected by logic or redirect
            try {
                const [cyclesData, statsData, symptomsData] = await Promise.all([
                    cycleService.getCycles(),
                    cycleService.getStats().catch(() => null),
                    cycleService.getSymptoms().catch(() => [])
                ])
                // Dedup cycles by start_date to clean up potential DB garbage
                // This keeps the last occurrence found, so we rely on sorting or just unique dates
                const uniqueCycles = cyclesData
                    ? Object.values(cyclesData.reduce((acc, current) => {
                        const dateKey = current.start_date.split('T')[0];
                        // If we already have one, prefer the one that is COMPLETED (has end_date) over "En curso"
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
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [isAuthenticated])

    if (loading) return <div className="p-8 text-center">Generando reporte...</div>

    return (
        <div className="bg-white min-h-screen text-black p-8 max-w-4xl mx-auto print:max-w-none print:p-0">
            {/* Header */}
            <div className="border-b-2 border-black pb-4 mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold uppercase tracking-wide mb-1">Reporte de Control Ginecológico</h1>
                    <p className="text-sm text-gray-600">Generado el: {format(new Date(), "d 'de' MMMM, yyyy", { locale: es })}</p>
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
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Ciclo Promedio</p>
                            <p className="text-xl font-bold">{stats.avg_cycle_length} días</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Periodo Promedio</p>
                            <p className="text-xl font-bold">{stats.avg_period_length} días</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Ciclos Registrados</p>
                            <p className="text-xl font-bold">{stats.total_cycles}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Variabilidad</p>
                            <p className="text-xl font-bold">{stats.cycle_range_max - stats.cycle_range_min} días</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Cycle History Table */}
            <div className="mb-8">
                <h2 className="text-lg font-bold mb-4 border-b border-gray-300 pb-1">Historial de Ciclos</h2>
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr className="border-b border-black">
                            <th className="py-2">Inicio</th>
                            <th className="py-2">Fin</th>
                            <th className="py-2">Duración Total</th>
                            <th className="py-2">Notas</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {history.map((cycle, i) => (
                            <tr key={i}>
                                <td className="py-2">{format(new Date(cycle.start_date), 'dd/MM/yyyy')}</td>
                                <td className="py-2">{cycle.end_date ? format(new Date(cycle.end_date), 'dd/MM/yyyy') : 'En curso'}</td>
                                <td className="py-2">{cycle.cycle_length || '-'} días</td>
                                <td className="py-2 text-gray-600 italic max-w-xs truncate">{cycle.notes || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Symptoms History Table */}
            <div className="mb-8">
                <h2 className="text-lg font-bold mb-4 border-b border-gray-300 pb-1">Registro de Síntomas</h2>
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr className="border-b border-black">
                            <th className="py-2">Fecha</th>
                            <th className="py-2 w-32">Estado</th>
                            <th className="py-2">Síntomas</th>
                            <th className="py-2">Notas</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {symptoms.length > 0 ? (
                            symptoms.sort((a, b) => new Date(b.date) - new Date(a.date)).map((item, i) => (
                                <tr key={i}>
                                    <td className="py-2 w-24 align-top">{format(new Date(item.date), 'dd/MM/yyyy')}</td>
                                    <td className="py-2 align-top">
                                        <div className="flex flex-col gap-0.5 text-xs text-gray-600">
                                            {item.pain_level > 0 && <span>Dolor: {item.pain_level}/10</span>}
                                            {item.flow_intensity && <span>Flujo: {item.flow_intensity === 'heavy' ? 'Abundante' : item.flow_intensity === 'medium' ? 'Medio' : 'Ligero'}</span>}
                                            {item.mood && <span>Ánimo: {item.mood}</span>}
                                        </div>
                                    </td>
                                    <td className="py-2 align-top">
                                        {item.symptoms && item.symptoms.length > 0 ? item.symptoms.join(', ') : '-'}
                                    </td>
                                    <td className="py-2 text-gray-600 italic max-w-xs truncate align-top">{item.notes || '-'}</td>
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
