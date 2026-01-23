import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Droplets, Calendar, Activity, TrendingUp, Loader2, Smile, Heart, Frown, Meh, FileText, Trash2 } from 'lucide-react'
import { format, parseISO, differenceInDays } from 'date-fns'
import { es } from 'date-fns/locale'
import cycleService from '../../services/cycleService'
import { cn } from '../../lib/utils'
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '../ui/dialog'
import Button from '../common/Button'

export default function CycleHistoryTab() {
    const [historyData, setHistoryData] = useState({ cycles: [], symptoms: [] })
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        total_cycles: 0,
        avg_cycle_length: 0,
        avg_period_length: 0,
        cycle_range_min: 0,
        cycle_range_max: 0
    })

    // Delete Confirmation State
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [itemToDelete, setItemToDelete] = useState(null)
    const [isDeletingAll, setIsDeletingAll] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)

    const moods = {
        happy: { label: 'Feliz', icon: Smile },
        calm: { label: 'Tranquila', icon: Heart },
        sad: { label: 'Triste', icon: Frown },
        anxious: { label: 'Ansiosa', icon: Meh },
        irritable: { label: 'Irritable', icon: Frown }
    }

    const symptomTranslations = {
        cramps: 'Cólicos',
        headache: 'Migraña',
        bloating: 'Hinchazón',
        fatigue: 'Fatiga',
        nausea: 'Náuseas',
        backache: 'Dolor de espalda',
        tenderness: 'Sensibilidad',
        acne: 'Acné'
    }

    const symptomIcons = {
        cramps: '💫',
        headache: '🤕',
        bloating: '🎈',
        fatigue: '😴',
        nausea: '🤢',
        backache: '🔆',
        tenderness: '💔',
        acne: '🔴'
    }

    useEffect(() => {
        loadHistory()
    }, [])

    const loadHistory = async () => {
        try {
            setLoading(true)
            const [cyclesData, symptomsData, statsData] = await Promise.all([
                cycleService.getCycles().catch(() => []),
                cycleService.getSymptoms().catch(() => []),
                cycleService.getStats().catch(() => null)
            ])

            if (statsData) {
                setStats(statsData)
            }

            setHistoryData({
                cycles: cyclesData.sort((a, b) => new Date(b.start_date) - new Date(a.start_date)),
                symptoms: symptomsData.sort((a, b) => new Date(b.date) - new Date(a.date))
            })

        } catch (error) {
            console.error('Error loading history:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteClick = (id) => {
        setItemToDelete(id)
        setIsDeletingAll(false)
        setDeleteDialogOpen(true)
    }

    const handleDeleteAllClick = () => {
        setIsDeletingAll(true)
        setDeleteDialogOpen(true)
    }

    const confirmDelete = async () => {
        try {
            setActionLoading(true)
            if (isDeletingAll) {
                await cycleService.deleteAllData()
                toast.success("Historial eliminado completamente")
            } else {
                await cycleService.deleteCycle(itemToDelete)
                toast.success("Ciclo eliminado")
            }
            loadHistory()
            setDeleteDialogOpen(false)
        } catch (error) {
            console.error("Error deleting:", error)
            toast.error("Error al eliminar")
        } finally {
            setActionLoading(false)
        }
    }

    // Merge and sort all items for timeline
    const timelineItems = [
        ...historyData.cycles.map(c => ({ ...c, type: 'cycle', date: c.start_date })),
        ...historyData.symptoms.map(s => ({ ...s, type: 'symptom', date: s.date }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date))

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12 min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold">Historial Completo</h3>
                    <p className="text-sm text-muted-foreground">Resumen de tus ciclos y síntomas registrados</p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Clear History Button */}
                    {historyData.cycles.length > 0 && (
                        <button
                            onClick={handleDeleteAllClick}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-full hover:bg-red-50 text-sm font-medium transition-colors dark:bg-gray-800 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-900/20 shadow-sm"
                            title="Borrar todos los datos"
                        >
                            <Trash2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Limpiar Historial</span>
                        </button>
                    )}

                    <button
                        onClick={() => window.open('/cycle-report', '_blank')}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-pink-200 text-pink-700 rounded-full hover:bg-pink-50 text-sm font-medium transition-colors dark:bg-gray-800 dark:border-pink-900 dark:text-pink-400 dark:hover:bg-pink-900/20 shadow-sm"
                    >
                        <FileText className="w-4 h-4" />
                        <span>Imprimir Historial</span>
                    </button>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-gray-200 dark:border-gray-700">
                    <CardContent className="p-4 text-center">
                        <p className="text-3xl font-bold text-primary dark:text-gray-400">{stats.total_cycles}</p>
                        <p className="text-sm text-muted-foreground">Ciclos registrados</p>
                    </CardContent>
                </Card>
                <Card className="border-gray-200 dark:border-gray-700">
                    <CardContent className="p-4 text-center">
                        <p className="text-3xl font-bold text-primary dark:text-gray-400">{stats.avg_period_length}</p>
                        <p className="text-sm text-muted-foreground">Días de periodo (prom)</p>
                    </CardContent>
                </Card>
                <Card className="border-gray-200 dark:border-gray-700">
                    <CardContent className="p-4 text-center">
                        <p className="text-3xl font-bold text-primary dark:text-gray-400">{stats.avg_cycle_length}</p>
                        <p className="text-sm text-muted-foreground">Duración ciclo (prom)</p>
                    </CardContent>
                </Card>
                <Card className="border-gray-200 dark:border-gray-700">
                    <CardContent className="p-4 text-center">
                        <p className="text-3xl font-bold text-primary dark:text-gray-400">
                            {stats.cycle_range_min === 0 ? '0' : `${stats.cycle_range_min}-${stats.cycle_range_max}`}
                        </p>
                        <p className="text-sm text-muted-foreground">Rango (días)</p>
                    </CardContent>
                </Card>
            </div>

            {/* Timeline */}
            <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Cronología</h4>

                {timelineItems.length === 0 ? (
                    <Card className="p-8 text-center text-muted-foreground border-dashed border-0 shadow-none bg-transparent">
                        No hay registros disponibles aún.
                    </Card>
                ) : (
                    timelineItems.map((item, index) => {
                        const isCycle = item.type === 'cycle'
                        if (!item.date) return null
                        const date = parseISO(item.date)

                        return (
                            <Card key={`${item.type}-${item.id || index}`} className={cn("overflow-hidden border-gray-200 dark:border-gray-700", isCycle ? "border-l-4 border-l-primary" : "border-l-4 border-l-orange-400")}>
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex gap-4 flex-1">
                                            <div className={cn("mt-1 p-2 rounded-full flex items-center justify-center shrink-0", isCycle ? "bg-primary/10 text-primary" : "bg-orange-100 text-orange-600")}>
                                                {isCycle ? <Droplets className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                                            </div>

                                            <div className="space-y-1 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-base">
                                                        {format(date, "d 'de' MMMM", { locale: es })}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground font-normal">
                                                        {format(date, "yyyy")}
                                                    </span>
                                                    <Badge variant={isCycle ? "default" : "secondary"} className="text-[10px] h-5">
                                                        {isCycle ? 'Inicio Periodo' : 'Síntomas'}
                                                    </Badge>
                                                </div>

                                                {isCycle ? (
                                                    <div className="text-sm text-muted-foreground">
                                                        <p>Fin: {item.end_date ? format(parseISO(item.end_date), "d 'de' MMMM", { locale: es }) : "En curso"}</p>
                                                        {item.end_date && (
                                                            <p>Duración: {differenceInDays(parseISO(item.end_date), date) + 1} días</p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2 mt-1">
                                                        <div className="flex flex-wrap gap-2 items-center">
                                                            {item.pain_level > 0 && (
                                                                <Badge variant="outline" className="text-xs border-red-200 text-red-700 bg-red-50">
                                                                    Dolor: {item.pain_level}/10
                                                                </Badge>
                                                            )}
                                                            {item.flow_intensity && (
                                                                <Badge variant="outline" className="text-xs border-blue-200 text-blue-700 bg-blue-50">
                                                                    Flujo: {item.flow_intensity === 'heavy' ? 'Abundante' : item.flow_intensity === 'medium' ? 'Medio' : 'Ligero'}
                                                                </Badge>
                                                            )}
                                                            {item.mood && moods[item.mood] && (() => {
                                                                const MoodIcon = moods[item.mood].icon
                                                                return (
                                                                    <Badge variant="outline" className="text-xs border-purple-200 text-purple-700 bg-purple-50 flex items-center gap-1">
                                                                        {MoodIcon && <MoodIcon className="w-3 h-3" />}
                                                                        {moods[item.mood].label}
                                                                    </Badge>
                                                                )
                                                            })()}
                                                        </div>

                                                        {item.symptoms && item.symptoms.length > 0 && (
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {item.symptoms.map((s, idx) => (
                                                                    <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-[#525252] dark:text-white border border-gray-200 dark:border-transparent">
                                                                        <span className="mr-1">{symptomIcons[s] || '•'}</span>
                                                                        {symptomTranslations[s] || s}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {item.notes && (
                                                            <div className="text-sm text-muted-foreground italic bg-muted/30 p-2 rounded-md border-l-2 border-muted">
                                                                "{item.notes}"
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        {isCycle && (
                                            <button
                                                onClick={() => handleDeleteClick(item.id)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors"
                                                title="Eliminar registro"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })
                )}
            </div>

            {/* Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmar eliminación</DialogTitle>
                        <DialogDescription>
                            {isDeletingAll
                                ? "Se eliminarán TODOS los registros de ciclos, síntomas y datos predictivos permanentemente. Esta acción no se puede deshacer."
                                : "¿Estás segura de que deseas eliminar este registro de periodo? Esto podría afectar las predicciones futuras."
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                            disabled={actionLoading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="danger"
                            onClick={confirmDelete}
                            isLoading={actionLoading}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {isDeletingAll ? 'Eliminar Todo' : 'Eliminar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
