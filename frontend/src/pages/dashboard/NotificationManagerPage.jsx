import { useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import Button from '../../components/common/Button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { toast } from 'sonner'
import useNotificationStore from '../../stores/notificationStore'
import { useState } from 'react'

const TABS = [
    { id: 'cycle', label: 'Calculadora Menstrual', types: ['cycle_phase'] },
    { id: 'prenatal', label: 'Prenatal', types: ['prenatal_weekly', 'prenatal_milestone'] },
    { id: 'system', label: 'Sistema', types: ['system', 'custom', 'symptom_alert'] }
]

export default function NotificationManagerPage() {
    const { rules, loading, fetchRules, createRule, deleteRule } = useNotificationStore()
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [activeTab, setActiveTab] = useState('cycle')

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        type: 'cycle_phase',
        trigger_days: 0,
        trigger_event: 'days_before_period',
        message: 'Hola {patient_name}, ...',
        channel: 'dual'
    })

    // Fetch rules on mount (will use cache if available)
    useEffect(() => {
        fetchRules()
    }, [fetchRules])

    const handleDelete = async (id) => {
        if (!confirm("¿Eliminar esta notificación?")) return
        try {
            await deleteRule(id)
            toast.success("Notificación eliminada")
        } catch (e) {
            toast.error("Error al eliminar")
        }
    }

    const handleCreate = async () => {
        try {
            // Build trigger JSON based on simplified UI
            let trigger = {}
            if (formData.trigger_event === 'days_before_period') {
                trigger = { days_before_period: parseInt(formData.trigger_days) }
            } else if (formData.trigger_event === 'is_ovulation_day') {
                trigger = { is_ovulation_day: true }
            } else if (formData.trigger_event === 'is_fertile_start') {
                trigger = { is_fertile_start: true }
            }

            const rulePayload = {
                name: formData.name,
                notification_type: formData.type,
                trigger_condition: trigger,
                channel: formData.channel,
                message_template: formData.message,
                is_active: true
            }

            await createRule(rulePayload)
            toast.success("Notificación creada")
            setIsCreateOpen(false)
            // Reset form
            setFormData({
                name: '',
                type: 'cycle_phase',
                trigger_days: 0,
                trigger_event: 'days_before_period',
                message: 'Hola {patient_name}, ...',
                channel: 'dual'
            })
        } catch (e) {
            toast.error("Error al crear notificación")
        }
    }

    // Get filtered rules for active tab
    const currentTab = TABS.find(t => t.id === activeTab)
    const filteredRules = rules.filter(rule =>
        currentTab.types.includes(rule.notification_type)
    )

    // Count by category
    const getCategoryCount = (tabId) => {
        const tab = TABS.find(t => t.id === tabId)
        return rules.filter(r => tab.types.includes(r.notification_type)).length
    }

    return (
        <div className="space-y-6 max-w-[900px] mx-auto">
            {/* Header Blueprint */}
            <div className="flex items-center justify-between mb-8 px-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Notificaciones</h1>
                <button
                    onClick={() => setIsCreateOpen(true)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Nueva Notificación
                </button>
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
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(rule.id)}
                                                    className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
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

            {/* Create Modal (Unchanged) */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Nueva Notificación Automática</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Nombre Interno</Label>
                            <Input
                                placeholder="Ej: Recordatorio de Periodo"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Categoría</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                            >
                                <option value="cycle_phase">Calculadora Menstrual</option>
                                <option value="prenatal_weekly">Prenatal Semanal</option>
                                <option value="prenatal_milestone">Prenatal Hito</option>
                                <option value="system">Sistema</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Evento (Trigger)</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={formData.trigger_event}
                                    onChange={e => setFormData({ ...formData, trigger_event: e.target.value })}
                                >
                                    <option value="days_before_period">Días antes del periodo</option>
                                    <option value="is_ovulation_day">Día de Ovulación</option>
                                    <option value="is_fertile_start">Inicio Ventana Fértil</option>
                                </select>
                            </div>

                            {formData.trigger_event === 'days_before_period' && (
                                <div className="space-y-2">
                                    <Label>Días de anticipación</Label>
                                    <Input
                                        type="number"
                                        value={formData.trigger_days}
                                        onChange={e => setFormData({ ...formData, trigger_days: e.target.value })}
                                        className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Canal de Envío</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                value={formData.channel}
                                onChange={e => setFormData({ ...formData, channel: e.target.value })}
                            >
                                <option value="email">Solo Email</option>
                                <option value="push">Solo Push (PWA)</option>
                                <option value="dual">Dual (Push + Email)</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label>Mensaje (HTML o Texto)</Label>
                            <textarea
                                className="flex min-h-[100px] w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-gray-400"
                                value={formData.message}
                                onChange={e => setFormData({ ...formData, message: e.target.value })}
                                placeholder="Hola {patient_name}, ..."
                            />
                            <p className="text-xs text-muted-foreground">Variables disponibles: &#123;patient_name&#125;</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                        <Button onClick={handleCreate}>Crear Regla</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
