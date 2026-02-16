// Force rebuild: 2026-02-15T21:12 - Notification system refactor
import { useEffect, useState } from 'react'
import { Plus, Trash2, Send, Pencil, AlertTriangle, Megaphone } from 'lucide-react'
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
    }
]

export default function NotificationManagerPage() {
    const { rules, loading, fetchRules, updateRule } = useNotificationStore()
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



    // Form State
    const [formData, setFormData] = useState({
        name: '',
        title: '',
        message: '',
        channel: 'push',
        trigger_info: ''
    })

    // Fetch rules on mount (will use cache if available)
    useEffect(() => {
        console.log('[NotificationManagerPage] 🔵 Component mounted, calling fetchRules');
        fetchRules()
    }, [fetchRules])

    // Debug: Log when rules change
    useEffect(() => {
        console.log('[NotificationManagerPage] 📊 Rules state changed:', {
            count: rules.length,
            loading,
            firstRule: rules[0]?.notification_type || 'N/A'
        });
    }, [rules, loading])

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

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/push-test/send-test`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: testEmail,
                    notification_type: selectedRule.notification_type,
                    subject: selectedRule.title_template || 'Test Notification',
                    message: selectedRule.message_template || 'Test message'
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
                message_template: formData.message,
                channel: formData.channel
                // is_active is no longer edited here as requested
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
        const tab = TABS.find(t => t.id === tabId)
        return rules.filter(r => tab.filter(r)).length
    }

    return (
        <div className="space-y-6 max-w-[900px] mx-auto">
            {/* Header Blueprint */}
            <div className="flex items-center justify-between mb-8 px-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Notificaciones</h1>
                <div className="flex gap-2">
                    {/* Actions if any */}
                </div>
            </div>

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
                    {loading && rules.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            Cargando notificaciones...
                        </div>
                    ) : (
                        <div className="w-full">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-b border-gray-100 dark:border-gray-700 hover:bg-transparent">
                                        <TableHead className="text-gray-500 dark:text-gray-400 pl-6 h-12">Nombre / Disparador</TableHead>
                                        <TableHead className="text-gray-500 dark:text-gray-400 h-12">Canal</TableHead>
                                        <TableHead className="text-right text-gray-500 dark:text-gray-400 pr-6 h-12">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {/* Info banner for contraceptive notifications */}
                                    {activeTab === 'cycle' && (
                                        <TableRow className="bg-blue-50 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-800">
                                            <TableCell colSpan={3} className="pl-6 py-3">
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
                                                            Las notificaciones de anticonceptivos se configuran individualmente en la pestaña "Configuración" de cada usuaria, no como reglas globales.
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
                                                    <span className="text-xs text-gray-400 mt-1 uppercase tracking-wider">{rule.notification_type.replace('_', ' ')}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${rule.channel === 'push' || rule.channel === 'dual'
                                                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                                    }`}>
                                                    {rule.channel.toUpperCase()}
                                                </span>
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
                            <Label className="text-sm font-medium">Canal de Envío</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
                                value={formData.channel}
                                onChange={e => setFormData({ ...formData, channel: e.target.value })}
                            >
                                <option value="push">📱 Solo Push (Notificación Celular)</option>
                                <option value="email">📧 Solo Email (Correo Electrónico)</option>
                                <option value="dual">🔄 Dual (Push + Email)</option>
                            </select>
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
        </div >
    )
}
