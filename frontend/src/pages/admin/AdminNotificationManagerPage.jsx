import { useEffect, useState } from 'react'
import { Plus, Trash2, Send, Pencil, AlertTriangle, Megaphone } from 'lucide-react'
import AdminLayout from '../../components/layout/AdminLayout'
import Button from '../../components/common/Button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { toast } from 'sonner'
import useNotificationStore from '../../stores/notificationStore'

const TABS = [
    {
        id: 'cycle',
        label: 'Calculadora Menstrual',
        filter: (rule) => rule.notification_type.startsWith('cycle_') ||
            rule.notification_type.startsWith('contraceptive_') ||
            rule.notification_type.startsWith('day_') ||
            rule.notification_type.startsWith('period_')
    },
    {
        id: 'prenatal',
        label: 'Prenatal',
        filter: (rule) => rule.notification_type.startsWith('prenatal_')
    },
    {
        id: 'system',
        label: 'Sistema',
        filter: (rule) => rule.notification_type.startsWith('system_') || rule.notification_type.startsWith('symptom_')
    },
    {
        id: 'devices',
        label: 'Usuarios / Dispositivos',
        filter: () => false // Special tab, not for rules
    }
]

export default function NotificationManagerPage() {
    const {
        rules, loading, fetchRules, updateRule,
        health, loadingHealth, fetchHealth,
        resetCircuit, triggerEvaluation, triggerDelivery, cleanupSubscriptions
    } = useNotificationStore()
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [editingType, setEditingType] = useState(null)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [ruleToDelete, setRuleToDelete] = useState(null)
    const [activeTab, setActiveTab] = useState('cycle')
    const [testEmail, setTestEmail] = useState('')
    const [selectedRule, setSelectedRule] = useState(null)
    const [isTestModalOpen, setIsTestModalOpen] = useState(false)
    const [availableUsers, setAvailableUsers] = useState([])
    const [loadingUsers, setLoadingUsers] = useState(false)
    const [isSendingTest, setIsSendingTest] = useState(false)
    const [isOperating, setIsOperating] = useState(false)

    // Audit State
    const [auditData, setAuditData] = useState([])
    const [loadingAudit, setLoadingAudit] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        title: '',
        message: '',
        channel: 'push',
        trigger_info: ''
    })

    useEffect(() => {
        fetchRules()
        fetchHealth()

        if (activeTab === 'devices') {
            fetchAuditData()
        }

        // Refresh health every minute
        const interval = setInterval(fetchHealth, 60000)
        return () => clearInterval(interval)
    }, [fetchRules, fetchHealth, activeTab])

    const fetchAuditData = async () => {
        try {
            setLoadingAudit(true)
            const token = localStorage.getItem('access_token')
            if (!token) return

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/push-test/detailed-users-devices`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (response.ok) {
                const data = await response.json()
                setAuditData(data.users || [])
            }
        } catch (error) {
            console.error('Failed to load audit data:', error)
            toast.error('Error al cargar auditoría de dispositivos')
        } finally {
            setLoadingAudit(false)
        }
    }

    const handleOperation = async (action, name) => {
        try {
            setIsOperating(true)
            await action()
            toast.success(`${name} ejecutado con éxito`)
        } catch (error) {
            console.error(`Error in ${name}:`, error)
            toast.error(`Fallo al ejecutar ${name}`)
        } finally {
            setIsOperating(false)
        }
    }

    const handleDeleteClick = (rule) => {
        setRuleToDelete(rule)
        setIsDeleteOpen(true)
    }

    const handleConfirmDelete = async () => {
        // Delete is no longer supported - rules are read-only
        toast.error("No se pueden eliminar notificaciones predefinidas")
        setIsDeleteOpen(false)
        setRuleToDelete(null)
    }

    const handleSendTest = async (rule) => {
        setSelectedRule(rule)
        setIsTestModalOpen(true)

        // Load users with push enabled
        await fetchUsersWithPush()
    }

    const fetchUsersWithPush = async () => {
        try {
            setLoadingUsers(true)
            const token = localStorage.getItem('access_token')
            if (!token) return

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/push-test/users-with-push`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (response.ok) {
                const data = await response.json()
                setAvailableUsers(data.users || [])
            }
        } catch (error) {
            console.error('Failed to load users:', error)
            toast.error('Error al cargar usuarios')
        } finally {
            setLoadingUsers(false)
        }
    }

    const handleConfirmSendTest = async () => {
        if (!testEmail || !selectedRule) return

        try {
            setIsSendingTest(true)

            // Get admin token from localStorage
            const token = localStorage.getItem('access_token')
            if (!token) {
                toast.error('No autenticado')
                return
            }

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/push-test/test-push`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_email: testEmail,
                    title: selectedRule.title_template || 'Notificación de Prueba',
                    body: selectedRule.message_text_template || selectedRule.message_template || 'Mensaje de prueba'
                })
            })

            const result = await response.json()

            if (response.ok) {
                toast.success(result.message || 'Notificación de prueba enviada')
                setTestEmail('')
                setIsTestModalOpen(false)
            } else {
                toast.error(result.detail || 'Error al enviar notificación de prueba')
            }

        } catch (error) {
            console.error('Error sending test:', error)
            toast.error('Error al enviar notificación de prueba')
        } finally {
            setIsSendingTest(false)
        }
    }

    const handleEdit = (rule) => {
        setFormData({
            name: rule.name, // Display only
            type: rule.notification_type, // Display only
            title: rule.title_template || '',
            message: rule.message_template,
            channel: rule.channel,
            trigger_info: getTriggerDescription(rule.trigger_condition, rule.notification_type)
        })
        setEditingType(rule.notification_type) // We use type as ID now
        setIsCreateOpen(true)
    }

    const getTriggerDescription = (trigger, type) => {
        if (trigger.cycle_day) return `Se envía en el día ${trigger.cycle_day} del ciclo.`
        if (trigger.days_before_period) return `Se envía ${trigger.days_before_period} días antes del periodo.`
        if (trigger.is_ovulation_day) return `Se envía el día estimado de ovulación.`
        if (trigger.is_fertile_start) return `Se envía al iniciar la ventana fértil.`

        // Match by type prefix if trigger is complex or empty
        if (type.startsWith('prenatal_week_')) {
            const week = type.split('_').pop()
            return `Se envía al iniciar la semana ${week} de embarazo.`
        }
        if (type.startsWith('system_')) return "Se envía por eventos del sistema."

        return "Se envía automáticamente según la programación del sistema."
    }

    const handleSave = async () => {
        try {
            const rulePayload = {
                title_template: formData.title,
                message_template: formData.message
                // is_active and channel are no longer edited here
            }

            await updateRule(editingType, rulePayload)
            toast.success("Notificación actualizada con éxito")
            setIsCreateOpen(false)
            setEditingType(null)
        } catch (e) {
            console.error('Error saving rule:', e)
            toast.error("Error al actualizar la notificación")
        }
    }

    // Get filtered rules for active tab
    const currentTab = TABS.find(t => t.id === activeTab)
    const filteredRules = rules.filter(rule => currentTab.filter(rule))

    // Count by category
    const getCategoryCount = (tabId) => {
        if (tabId === 'devices') return auditData.length
        const tab = TABS.find(t => t.id === tabId)
        return rules.filter(r => tab.filter(r)).length
    }

    const translateType = (type) => {
        const translations = {
            'cycle_phase': 'Fase de Ciclo',
            'contraceptive_daily': 'Anticonceptivo Diario',
            'contraceptive_rest_start': 'Inicio de Descanso',
            'contraceptive_rest_end': 'Fin de Descanso',
            'contraceptive_missed': 'Olvido de Pastilla',
            'period_prediction': 'Predicción de Periodo',
            'period_start': 'Inicio de Periodo',
            'period_confirmation_0': 'Confirmación (Día 1)',
            'period_confirmation_1': 'Confirmación (Día 2)',
            'period_confirmation_2': 'Confirmación (Día 3)',
            'period_irregular': 'Retraso Importante',
            'fertile_window_start': 'Ventana Fértil',
            'fertility_peak': 'Pico de Fertilidad',
            'ovulation_day': 'Día de Ovulación',
            'fertile_window_end': 'Fin Ventana Fértil',
            'prenatal_weekly': 'Seguimiento Semanal',
            'prenatal_milestone': 'Hito Gestacional',
            'prenatal_daily_tip': 'Recomendación Diaria',
            'prenatal_alert': 'Alerta de Riesgo',
            'annual_checkup': 'Chequeo Anual',
            'system_welcome': 'Bienvenida',
            'system_update': 'Actualización del Sistema',
            'symptom_alert': 'Alerta de Síntoma',
            'custom': 'Notificación Especial'
        }

        if (translations[type]) return translations[type]

        // Dynamic mapping for day_X and week_X
        if (type.startsWith('day_')) return `Día ${type.split('_')[1]} del Ciclo`
        if (type.startsWith('prenatal_week_')) return `Semana ${type.split('_')[2]} de Gestación`
        if (type.startsWith('prenatal_')) return `Prenatal: ${type.split('_').slice(1).join(' ').toUpperCase()}`
        if (type.startsWith('system_')) return `Sistema: ${type.split('_').slice(1).join(' ').toUpperCase()}`

        return type.replace(/_/g, ' ').toUpperCase()
    }

    const renderHealthStats = () => {
        if (!health) return null

        const statusColors = {
            healthy: 'text-green-600 bg-green-50 dark:bg-green-900/20',
            degraded: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20',
            critical: 'text-red-600 bg-red-50 dark:bg-red-900/20',
            unhealthy: 'text-red-600 bg-red-50 dark:bg-red-900/20'
        }

        const circuitStateColors = {
            closed: 'text-green-600 font-bold',
            open: 'text-red-600 font-bold',
            half_open: 'text-yellow-600 font-bold'
        }

        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden mb-8 transition-all duration-300">
                <div className="px-6 py-4 border-b border-gray-50 dark:border-gray-700 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-3">
                                Salud del Sistema de Notificaciones
                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${statusColors[health.status] || 'text-gray-600 bg-gray-100'}`}>
                                    ● {health.status === 'healthy' ? 'Saludable' : health.status.toUpperCase()}
                                </span>
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Métricas en tiempo real del pipeline de entrega</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400 font-medium hidden sm:inline">
                            Act. {new Date(health.timestamp).toLocaleTimeString()}
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={fetchHealth}
                            disabled={loadingHealth}
                            className="h-8 text-primary hover:bg-primary/5"
                        >
                            <svg className={`w-3.5 h-3.5 mr-1.5 ${loadingHealth ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            {loadingHealth ? 'Actualizando...' : 'Actualizar'}
                        </Button>
                    </div>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                        {[
                            { label: 'EN COLA', value: health.pending_queue, sub: 'pending', color: 'blue' },
                            { label: 'PROCESANDO', value: health.processing, sub: 'processing', color: 'amber' },
                            { label: 'REINTENTANDO', value: health.retrying, sub: 'retrying', color: 'indigo' },
                            { label: 'FALLIDAS', value: health.failed_total, sub: 'acumulado', color: 'red' },
                            { label: 'ENVIADAS 24H', value: health.sent_last_24h, sub: 'últimas 24h', color: 'green' },
                            { label: 'FALLIDAS 24H', value: health.failed_last_24h, sub: 'últimas 24h', color: 'red' }
                        ].map((stat, idx) => (
                            <div key={idx} className="bg-gray-50 dark:bg-gray-900/40 rounded-xl p-4 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all group">
                                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                                    {stat.label}
                                </p>
                                <p className={`text-2xl font-black text-${stat.color}-600 dark:text-${stat.color}-400`}>
                                    {stat.value}
                                </p>
                                <p className="text-[9px] font-medium text-gray-400 mt-1 uppercase">
                                    {stat.sub}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-6 p-4 bg-gray-50/50 dark:bg-gray-900/30 rounded-xl border border-gray-100 dark:border-gray-800">
                        <div className="flex flex-wrap items-center gap-6">
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tight">Circuit Breaker (Push):</span>
                                <span className={`text-sm ${circuitStateColors[health.circuit_breaker.state] || 'text-gray-400'}`}>
                                    {health.circuit_breaker.state === 'closed' ? 'Cerrado (OK)' : health.circuit_breaker.state.toUpperCase()}
                                </span>
                                <span className="text-[10px] text-gray-400 ml-1">Fallos: {health.circuit_breaker.failures} / {health.circuit_breaker.threshold}</span>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-[11px] font-bold border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-900/10"
                                onClick={() => handleOperation(resetCircuit, 'Reiniciar Circuito')}
                                disabled={isOperating}
                            >
                                Reiniciar Circuito
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-[11px] font-bold"
                                onClick={() => handleOperation(triggerEvaluation, 'Evaluar Sistema')}
                                disabled={isOperating}
                            >
                                Evaluar Sistema
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-[11px] font-bold"
                                onClick={() => handleOperation(triggerDelivery, 'Procesar Cola')}
                                disabled={isOperating}
                            >
                                Procesar Cola
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-[11px] font-bold border-amber-200 text-amber-600 hover:bg-amber-50"
                                onClick={async () => {
                                    if (window.confirm('¿Deseas limpiar suscripciones con error 403? Esto forzará una re-suscripción automática de las usuarias.')) {
                                        const res = await handleOperation(cleanupSubscriptions, 'Limpieza de Suscripciones')
                                        if (res?.deleted_count) toast.info(`Se eliminaron ${res.deleted_count} suscripciones inválidas`)
                                    }
                                }}
                                disabled={isOperating}
                            >
                                Limpiar de Suscripciones
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    const renderUserDevicesTable = () => {
        const filteredAudit = auditData.filter(user =>
            user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.name.toLowerCase().includes(searchQuery.toLowerCase())
        )

        return (
            <div className="w-full">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-900/30 flex items-center gap-4">
                    <div className="relative flex-1">
                        <Input
                            placeholder="Buscar por nombre o email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-10 w-full max-w-md bg-white dark:bg-gray-800"
                        />
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={fetchAuditData}
                        disabled={loadingAudit}
                        className="text-primary"
                    >
                        <svg className={`w-3.5 h-3.5 mr-1.5 ${loadingAudit ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refrescar
                    </Button>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow className="border-b border-gray-100 dark:border-gray-700 hover:bg-transparent">
                            <TableHead className="text-gray-500 dark:text-gray-400 pl-6 h-12">Usuaria</TableHead>
                            <TableHead className="text-gray-500 dark:text-gray-400 h-12">Dispositivos</TableHead>
                            <TableHead className="text-gray-500 dark:text-gray-400 h-12">Registro</TableHead>
                            <TableHead className="text-right text-gray-500 dark:text-gray-400 pr-6 h-12">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loadingAudit ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-12 text-gray-400 italic">
                                    Cargando datos de auditoría...
                                </TableCell>
                            </TableRow>
                        ) : filteredAudit.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-12 text-gray-400 italic">
                                    No se encontraron usuarias con los criterios de búsqueda.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredAudit.map(user => (
                                <TableRow key={user.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                                    <TableCell className="pl-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-900 dark:text-gray-100">{user.name}</span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">{user.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block w-fit ${user.devices_count > 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600'}`}>
                                                {user.devices_count} {user.devices_count === 1 ? 'dispositivo' : 'dispositivos'}
                                            </span>
                                            {user.devices.map((dev, idx) => (
                                                <span key={idx} className="text-[10px] text-gray-400 font-mono truncate max-w-[200px]" title={dev.endpoint_short}>
                                                    {dev.endpoint_short}
                                                </span>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-xs text-gray-500">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setTestEmail(user.email)
                                                setSelectedRule({ name: 'Prueba de Sistema (Directa)', title_template: '🔔 Test de Vinculación', message_template: 'Tu dispositivo está correctamente vinculado al sistema.' })
                                                setIsTestModalOpen(true)
                                            }}
                                            className="h-8 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                            disabled={user.devices_count === 0}
                                        >
                                            <Send className="w-3.5 h-3.5 mr-1" />
                                            Probar
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        )
    }

    return (
        <AdminLayout>
            <div className="px-4 py-8 sm:px-6 lg:px-8">
                {/* Header section as blueprint */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Gestión de Notificaciones</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Configuración y monitoreo centralizado del sistema SaaS</p>
                    </div>
                </div>

                {/* Metrics Dashboard */}
                {renderHealthStats()}

                {/* Card Blueprint */}
                <div className="bg-white rounded-lg shadow-lg dark:bg-gray-800 dark:border-gray-700 transition-colors duration-200 overflow-hidden">

                    {/* Tabs / Header Bar (Card Header) */}
                    <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                        <div className="flex">
                            {TABS.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                    relative px-6 py-4 text-sm font-medium transition-colors focus:outline-none
                                    ${activeTab === tab.id
                                            ? 'text-primary border-b-2 border-primary bg-white dark:bg-gray-800'
                                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-gray-800/50'
                                        }
                                `}
                                >
                                    <span className="flex items-center gap-2">
                                        {tab.label}
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${activeTab === tab.id
                                            ? 'bg-primary/10 text-primary'
                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                            }`}>
                                            {getCategoryCount(tab.id)}
                                        </span>
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content Area (Card Body) */}
                    <div className="p-0">
                        {activeTab === 'devices' ? (
                            renderUserDevicesTable()
                        ) : loading && rules.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                Cargando notificaciones...
                            </div>
                        ) : (
                            <div className="w-full">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-b border-gray-100 dark:border-gray-700 hover:bg-transparent">
                                            <TableHead className="text-gray-500 dark:text-gray-400 pl-6 h-12">Nombre / Propósito</TableHead>
                                            <TableHead className="text-right text-gray-500 dark:text-gray-400 pr-6 h-12">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {/* Info banner for contraceptive notifications */}
                                        {activeTab === 'cycle' && (
                                            <TableRow className="bg-blue-50 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-800">
                                                <TableCell colSpan={2} className="pl-6 py-3">
                                                    <div className="flex items-start gap-3">
                                                        <div className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30">
                                                            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                            </svg>
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                                                💊 Notificaciones de Anticonceptivos
                                                            </p>
                                                            <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                                                                Las notificaciones de anticonceptivos se configuran individualmente en la pestaña "Configuración" de cada usuaria.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        {filteredRules.map(rule => (
                                            <TableRow key={rule.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                                                <TableCell className="font-medium text-gray-900 dark:text-gray-200 pl-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span>{rule.name}</span>
                                                        <span className="text-xs text-blue-500 dark:text-blue-400 mt-1 font-medium">{translateType(rule.notification_type)}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right pr-6">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleSendTest(rule)}
                                                            className="h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                                            title="Enviar notificación de prueba"
                                                        >
                                                            <Send className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleEdit(rule)}
                                                            className="h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                                            title="Editar notificación"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDeleteClick(rule)}
                                                            className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                            title="Eliminar notificación"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {filteredRules.length === 0 && !loading && (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center py-12 text-gray-400 italic">
                                                    No hay notificaciones en esta sección.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Simple Edit Modal */}
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogContent className="sm:max-w-[550px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <Megaphone className="h-4 w-4 text-blue-600" />
                                </div>
                                Editar Notificación
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-5 py-4">
                            {/* Info Read Only Section */}
                            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-800 space-y-3">
                                <div>
                                    <Label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Notificación</Label>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formData.name || formData.type}</p>
                                </div>
                                <div>
                                    <Label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Programación (Automática)</Label>
                                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">{formData.trigger_info}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Título de la Notificación (Asunto)</Label>
                                <Input
                                    placeholder="Ej: ¡Recordatorio de Salud!"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label className="text-sm font-medium">Cuerpo del Mensaje</Label>
                                    <span className="text-[10px] font-medium text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">
                                        Variable: &#123;patient_name&#125;
                                    </span>
                                </div>
                                <textarea
                                    className="flex min-h-[120px] w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-gray-400 leading-relaxed"
                                    value={formData.message}
                                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                                    placeholder="Escribe el mensaje que recibirá la paciente..."
                                />
                            </div>
                        </div>

                        <DialogFooter className="gap-2">
                            <Button variant="ghost" onClick={() => {
                                setIsCreateOpen(false)
                                setEditingType(null)
                            }}>
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleSave}
                                className="bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 px-6"
                            >
                                Guardar Cambios
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Test Send Modal */}
                <Dialog open={isTestModalOpen} onOpenChange={setIsTestModalOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>📨 Enviar Notificación de Prueba</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Notificación</Label>
                                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                        {selectedRule?.name}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {selectedRule?.notification_type?.replace('_', ' ').toUpperCase()}
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="test-user" className="text-sm font-medium">
                                    Usuario con Push Activado
                                </Label>
                                {loadingUsers ? (
                                    <div className="text-sm text-gray-500 dark:text-gray-400 py-2">
                                        Cargando usuarios...
                                    </div>
                                ) : availableUsers.length === 0 ? (
                                    <div className="text-sm text-orange-600 dark:text-orange-400 py-2">
                                        ⚠️ No hay usuarios con push activado
                                    </div>
                                ) : (
                                    <select
                                        id="test-user"
                                        value={testEmail}
                                        onChange={(e) => setTestEmail(e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        <option value="">Selecciona un usuario...</option>
                                        {availableUsers.map(user => (
                                            <option key={user.id} value={user.email}>
                                                {user.name} ({user.email})
                                            </option>
                                        ))}
                                    </select>
                                )}
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {availableUsers.length} usuario(s) con notificaciones activas
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsTestModalOpen(false)
                                    setTestEmail('')
                                    setSelectedRule(null)
                                }}
                                disabled={isSendingTest}
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleConfirmSendTest}
                                disabled={!testEmail || isSendingTest}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                {isSendingTest ? 'Enviando...' : 'Enviar Prueba'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>


                {/* Delete Confirmation Dialog */}
                <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                                <AlertTriangle className="h-5 w-5" />
                                Confirmar Eliminación
                            </DialogTitle>
                        </DialogHeader>
                        <div className="py-2">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                ¿Estás seguro de que deseas eliminar la notificación <strong>"{ruleToDelete?.name}"</strong>?
                                Esta acción no se puede deshacer.
                            </p>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleConfirmDelete}
                                className="bg-red-600 hover:bg-red-700 text-white focus:ring-red-600"
                            >
                                Eliminar
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    )
}
