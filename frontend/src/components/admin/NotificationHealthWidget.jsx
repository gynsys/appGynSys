import { useState, useEffect, useCallback } from 'react'
import notificationService from '../../services/notificationService'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_CONFIG = {
    healthy: { label: 'Saludable', dot: 'bg-green-400', badge: 'bg-green-100 text-green-800', icon: '✅' },
    degraded: { label: 'Degradado', dot: 'bg-yellow-400', badge: 'bg-yellow-100 text-yellow-800', icon: '⚠️' },
    critical: { label: 'Crítico', dot: 'bg-red-400', badge: 'bg-red-100 text-red-800', icon: '🚨' },
    unhealthy: { label: 'Error', dot: 'bg-red-500', badge: 'bg-red-100 text-red-800', icon: '❌' },
    loading: { label: 'Cargando…', dot: 'bg-gray-300', badge: 'bg-gray-100 text-gray-600', icon: '⏳' },
}

const CB_STATE_LABEL = {
    closed: { label: 'Cerrado (OK)', cls: 'text-green-600' },
    open: { label: 'Abierto (bloq.)', cls: 'text-red-600' },
    half: { label: 'Semiabierto', cls: 'text-yellow-600' },
}

function StatCard({ label, value, sub, accentClass = 'text-gray-900' }) {
    return (
        <div className="bg-gray-50 rounded-lg p-4 flex flex-col gap-1">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
            <p className={`text-2xl font-bold ${accentClass}`}>{value ?? '—'}</p>
            {sub && <p className="text-xs text-gray-400">{sub}</p>}
        </div>
    )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function NotificationHealthWidget() {
    const [health, setHealth] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [refreshing, setRefreshing] = useState(false)
    const [lastRefresh, setLastRefresh] = useState(null)

    const fetchHealth = useCallback(async (isManual = false) => {
        if (isManual) setRefreshing(true)
        else setLoading(true)
        setError(null)
        try {
            const data = await notificationService.getHealth()
            setHealth(data)
            setLastRefresh(new Date())
        } catch (err) {
            setError(err?.response?.data?.detail || err.message || 'Error de red')
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [])

    // Carga inicial + auto-refresh cada 60 s
    useEffect(() => {
        fetchHealth()
        const timer = setInterval(() => fetchHealth(), 60_000)
        return () => clearInterval(timer)
    }, [fetchHealth])

    const status = health?.status ?? 'loading'
    const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.loading
    const cb = health?.circuit_breaker
    const cbState = CB_STATE_LABEL[cb?.state] ?? { label: cb?.state ?? '—', cls: 'text-gray-600' }

    const formatTime = (iso) => {
        if (!iso) return '—'
        return new Date(iso).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-lg">🔔</span>
                    <h3 className="text-lg font-medium text-gray-900">Salud del Sistema de Notificaciones</h3>
                    {!loading && (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${status === 'loading' ? '' : 'animate-pulse'}`} />
                            {cfg.label}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {lastRefresh && (
                        <span className="text-xs text-gray-400">
                            Act. {formatTime(lastRefresh)}
                        </span>
                    )}
                    <button
                        id="btn-refresh-notif-health"
                        onClick={() => fetchHealth(true)}
                        disabled={refreshing || loading}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-indigo-600
                       border border-indigo-200 rounded-md hover:bg-indigo-50 disabled:opacity-50
                       transition-colors"
                    >
                        <svg
                            className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`}
                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Actualizar
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="p-6">
                {(loading && !health) ? (
                    <div className="flex items-center justify-center py-8 text-gray-400">
                        <svg className="w-5 h-5 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Cargando métricas…
                    </div>
                ) : error ? (
                    <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 border border-red-200">
                        <p className="font-semibold mb-1">No se pudo obtener el estado del sistema</p>
                        <p className="text-xs text-red-600">{error}</p>
                    </div>
                ) : health ? (
                    <div className="space-y-5">
                        {/* Stat grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                            <StatCard
                                label="En cola"
                                value={health.pending_queue}
                                sub="pending"
                                accentClass={health.pending_queue > 50 ? 'text-yellow-600' : 'text-gray-900'}
                            />
                            <StatCard
                                label="Procesando"
                                value={health.processing}
                                sub="processing"
                                accentClass={health.processing > 10 ? 'text-orange-600' : 'text-gray-900'}
                            />
                            <StatCard
                                label="Reintentando"
                                value={health.retrying}
                                sub="retrying"
                                accentClass={health.retrying > 20 ? 'text-yellow-600' : 'text-gray-900'}
                            />
                            <StatCard
                                label="Fallidas"
                                value={health.failed_total}
                                sub="acumulado"
                                accentClass={health.failed_total > 100 ? 'text-red-600' : 'text-gray-900'}
                            />
                            <StatCard
                                label="Enviadas 24h"
                                value={health.sent_last_24h}
                                sub="últimas 24h"
                                accentClass="text-green-700"
                            />
                            <StatCard
                                label="Fallidas 24h"
                                value={health.failed_last_24h}
                                sub="últimas 24h"
                                accentClass={health.failed_last_24h > 50 ? 'text-red-600' : 'text-gray-900'}
                            />
                        </div>

                        {/* Circuit Breaker */}
                        {cb && (
                            <div className="rounded-md bg-gray-50 border border-gray-200 px-4 py-3 flex flex-wrap items-center gap-4 text-sm">
                                <span className="font-medium text-gray-700">Circuit Breaker (Push):</span>
                                <span className={`font-semibold ${cbState.cls}`}>
                                    {cbState.label}
                                </span>
                                <span className="text-gray-500">
                                    Fallos: <strong className="text-gray-700">{cb.failures}</strong> / {cb.threshold}
                                </span>
                                {cb.state === 'open' && (
                                    <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium">
                                        ⚠️ Push notifications bloqueadas temporalmente
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Timestamp */}
                        <p className="text-xs text-gray-400 text-right">
                            Datos del servidor: {formatTime(health.timestamp)}
                        </p>
                    </div>
                ) : null}
            </div>
        </div>
    )
}
