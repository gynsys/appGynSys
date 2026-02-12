import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import { useDarkMode } from '../../hooks/useDarkMode'
import { testService } from '../../services/testService'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'

export default function EndometriosisStatsModal({ isOpen, onClose }) {
    const [isDarkMode] = useDarkMode()
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [mounted, setMounted] = useState(false)

    // Colors for "Nivel de Coincidencia"
    const COLORS = {
        "ALTA COINCIDENCIA": "#DC2626", // Red-600
        "MODERADA COINCIDENCIA": "#F97316", // Orange-500
        "BAJA COINCIDENCIA": "#16A34A" // Green-600
    }

    useEffect(() => {
        setMounted(true)
        return () => setMounted(false)
    }, [])

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
            fetchStats()
        } else {
            document.body.style.overflow = ''
        }
        return () => { document.body.style.overflow = '' }
    }, [isOpen])

    const fetchStats = async () => {
        setLoading(true)
        setError(null)
        try {
            const data = await testService.getEndometriosisStats()
            setStats(data)
        } catch (err) {
            console.error("Error fetching stats:", err)
            setError("No se pudieron cargar las estadísticas.")
        } finally {
            setLoading(false)
        }
    }

    const bgClass = isDarkMode ? "bg-gray-800" : "bg-white"
    const textClass = isDarkMode ? "text-white" : "text-gray-900"
    const subTextClass = isDarkMode ? "text-gray-300" : "text-gray-600"

    if (!mounted) return null

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[10000] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-center justify-center min-h-screen text-center p-4 sm:p-0">

                        {/* Overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity backdrop-blur-sm"
                            onClick={onClose}
                            aria-hidden="true"
                        />

                        {/* Modal Panel */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className={`relative inline-block align-bottom ${bgClass} rounded-2xl text-left shadow-xl transform transition-all w-full sm:max-w-2xl sm:my-8 sm:align-middle`}

                        >
                            <div className="absolute top-4 right-4 z-10">
                                <button
                                    onClick={onClose}
                                    className={`rounded-full p-2 ${isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'} transition-colors`}
                                >
                                    <XMarkIcon className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="p-6 sm:p-8">
                                <div className="text-center mb-8">
                                    <h3 className={`text-2xl font-bold ${textClass} mb-2`}>
                                        Estadísticas Globales
                                    </h3>
                                    <p className={`${subTextClass}`}>
                                        Resultados anónimos de nuestra comunidad
                                    </p>
                                </div>

                                {loading ? (
                                    <div className="flex justify-center items-center h-64">
                                        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${isDarkMode ? 'border-white' : 'border-indigo-600'}`}></div>
                                    </div>
                                ) : error ? (
                                    <div className="text-center py-10 text-red-500">
                                        {error}
                                    </div>
                                ) : stats ? (
                                    <div className="space-y-10">

                                        {/* Total Count */}
                                        <div className={`text-center p-4 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-indigo-50'}`}>
                                            <span className={`block text-sm font-medium ${subTextClass} uppercase tracking-wider mb-1`}>
                                                Total de Tests Realizados
                                            </span>
                                            <span className={`text-4xl font-black ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                                {stats.total}
                                            </span>
                                        </div>

                                        {/* Chart 1: Pie Chart (Levels) */}
                                        <div>
                                            <h4 className={`text-lg font-semibold ${textClass} mb-4 text-center`}>
                                                Distribución de Resultados
                                            </h4>
                                            <div className="h-64 mb-4">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={stats.level_distribution}
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={60}
                                                            outerRadius={80}
                                                            paddingAngle={5}
                                                            dataKey="value"
                                                        >
                                                            {stats.level_distribution.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={COLORS[entry.name] || "#8884d8"} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip
                                                            contentStyle={{
                                                                backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
                                                                borderColor: isDarkMode ? '#374151' : '#E5E7EB',
                                                                color: isDarkMode ? '#F3F4F6' : '#111827',
                                                                borderRadius: '0.5rem'
                                                            }}
                                                        />
                                                        <Legend />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>

                                            {/* Custom Legend/Summary */}
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center text-sm">
                                                {stats.level_distribution.map((item) => {
                                                    const percentage = stats.total > 0 ? ((item.value / stats.total) * 100).toFixed(1) : 0;
                                                    return (
                                                        <div key={item.name} className={`p-2 rounded-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                                                            <div className="w-3 h-3 rounded-full mx-auto mb-1" style={{ backgroundColor: COLORS[item.name] }}></div>
                                                            <div className={`font-bold ${textClass}`}>{percentage}%</div>
                                                            <div className={`text-xs ${subTextClass}`}>{item.name.replace(" COINCIDENCIA", "")}</div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>

                                        {/* Chart 2: Bar Chart (Score Frequency) */}
                                        <div>
                                            <h4 className={`text-lg font-semibold ${textClass} mb-4 text-center`}>
                                                Frecuencia de Síntomas Reportados
                                            </h4>
                                            <p className={`text-xs text-center mb-4 ${subTextClass}`}>
                                                (Número de síntomas positivos por persona)
                                            </p>
                                            <div className="h-64">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={stats.score_distribution}>
                                                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                                        <XAxis
                                                            dataKey="score"
                                                            label={{ value: 'Síntomas (0-10)', position: 'insideBottom', offset: -5, fill: isDarkMode ? '#9CA3AF' : '#4B5563', fontSize: 12 }}
                                                            tick={{ fill: isDarkMode ? '#9CA3AF' : '#4B5563' }}
                                                        />
                                                        <YAxis
                                                            tick={{ fill: isDarkMode ? '#9CA3AF' : '#4B5563' }}
                                                            allowDecimals={false}
                                                        />
                                                        <Tooltip
                                                            cursor={{ fill: isDarkMode ? '#374151' : '#F3F4F6', opacity: 0.4 }}
                                                            contentStyle={{
                                                                backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
                                                                borderColor: isDarkMode ? '#374151' : '#E5E7EB',
                                                                color: isDarkMode ? '#F3F4F6' : '#111827',
                                                                borderRadius: '0.5rem'
                                                            }}
                                                        />
                                                        <Bar dataKey="count" name="Personas" fill="#6366F1" radius={[4, 4, 0, 0]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                    </div>
                                ) : (
                                    <div className="text-center py-10">No hay datos disponibles.</div>
                                )}

                                <div className="mt-8">
                                    <button
                                        onClick={onClose}
                                        className={`w-full py-3 rounded-xl font-medium transition-colors ${isDarkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}
                                    >
                                        Cerrar
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    )
}
