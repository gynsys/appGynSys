import { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import Button from '../../components/common/Button'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import notificationService from '../../services/notificationService'
import { toast } from 'sonner'
import { Switch } from '../../components/ui/switch'

export default function NotificationManagerPage() {
    const [rules, setRules] = useState([])
    const [loading, setLoading] = useState(true)
    const [isCreateOpen, setIsCreateOpen] = useState(false)

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        type: 'cycle_phase',
        trigger_days: 0,
        trigger_event: 'days_before_period', // days_before_period, is_ovulation_day, is_fertile_start
        message: 'Hola {patient_name}, ...',
        channel: 'email'
    })

    useEffect(() => {
        loadRules()
    }, [])

    const loadRules = async () => {
        try {
            setLoading(true)
            const data = await notificationService.getRules()
            setRules(data)
        } catch (e) {
            toast.error("Error al cargar reglas")
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm("¿Eliminar esta notificación?")) return
        try {
            await notificationService.deleteRule(id)
            setRules(rules.filter(r => r.id !== id))
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

            await notificationService.createRule(rulePayload)
            toast.success("Notificación creada")
            setIsCreateOpen(false)
            loadRules()
        } catch (e) {
            toast.error("Error al crear notificación")
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Notificaciones</h1>
                    <p className="text-muted-foreground">Gestiona los avisos automáticos para tus pacientes.</p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Nueva Notificación
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Reglas Activas</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Canal</TableHead>
                                <TableHead>Disparador</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rules.map(rule => (
                                <TableRow key={rule.id}>
                                    <TableCell className="font-medium">{rule.name}</TableCell>
                                    <TableCell>{rule.notification_type}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${rule.channel === 'push' || rule.channel === 'dual' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100'}`}>
                                            {rule.channel.toUpperCase()}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-xs font-mono text-gray-500">
                                        {JSON.stringify(rule.trigger_condition)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(rule.id)} className="text-red-500 hover:text-red-700">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {rules.length === 0 && !loading && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No hay notificaciones configuradas.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Create Modal */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
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
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Evento (Trigger)</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                                    />
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Canal de Envío</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
