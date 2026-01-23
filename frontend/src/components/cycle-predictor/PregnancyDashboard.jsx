import { useState, useEffect } from 'react'
import { Card, CardContent } from '../ui/card'
import Button from '../common/Button'
import { differenceInDays, addDays, format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar, AlertCircle, Baby, Stethoscope, FileText, Heart, Settings, ChevronRight } from 'lucide-react'
import cycleService from '../../services/cycleService'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'

export default function PregnancyDashboard({ activePregnancy, onStatusChange }) {
    const [weeks, setWeeks] = useState(0)
    const [days, setDays] = useState(0)

    const [showEndDialog, setShowEndDialog] = useState(false)
    const [endLoading, setEndLoading] = useState(false)

    useEffect(() => {
        if (activePregnancy?.last_period_date) {
            const lmp = parseISO(activePregnancy.last_period_date)
            const today = new Date()
            const diffDays = differenceInDays(today, lmp)

            const w = Math.floor(diffDays / 7)
            const d = diffDays % 7
            setWeeks(w)
            setDays(d)
        }
    }, [activePregnancy])

    const handleConfirmEndPregnancy = async () => {
        try {
            setEndLoading(true)
            await cycleService.endPregnancy()
            if (onStatusChange) onStatusChange()
            setShowEndDialog(false)
        } catch (error) {
            console.error(error)
        } finally {
            setEndLoading(false)
        }
    }

    const milestones = [
        { week: 11, label: 'Ecografía Genética', range: '11-14 sem', icon: Baby },
        { week: 12, label: 'Perfil Prenatal I', range: '12 sem', icon: FileText },
        { week: 20, label: 'Ecografía Morfológica', range: '18-24 sem', icon: Stethoscope },
        { week: 24, label: 'Test Glucosa', range: '24-28 sem', icon: FileText },
        { week: 28, label: 'Vacunación Tdap', range: '28-32 sem', icon: AlertCircle },
        { week: 32, label: 'Eco Crecimiento', range: '32-34 sem', icon: Baby },
        { week: 35, label: 'Cultivo Estreptococo', range: '35-37 sem', icon: FileText }
    ]

    const nextMilestone = milestones.find(m => m.week >= weeks) || milestones[milestones.length - 1]

    return (
        <div className="space-y-3 py-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="relative text-center space-y-1 mb-4">
                {/* End Pregnancy Button - Top Right */}
                <div className="absolute top-0 right-0">
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-[10px] h-7 px-2 text-red-500 hover:text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-900/40"
                        onClick={() => setShowEndDialog(true)}
                    >
                        Finalizar Embarazo
                    </Button>
                </div>

                <div className="inline-flex items-center justify-center p-2 bg-purple-100 dark:bg-purple-900/40 rounded-full mb-1">
                    <Baby className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-bold dark:text-white px-4">
                    ¡Estás en la semana {weeks}!
                </h3>
                <p className="text-sm text-muted-foreground dark:text-gray-400 max-w-lg mx-auto leading-tight">
                    Tu bebé tiene el tamaño aproximado de una fruta esta semana.
                    <br />
                    <span className="text-[10px] font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full mt-1 inline-block">
                        FPP: {activePregnancy?.due_date ? format(parseISO(activePregnancy.due_date), "d 'de' MMM, yyyy", { locale: es }) : '--'}
                    </span>
                </p>
            </div>

            {/* 4 Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Card 1: Semana / Progreso */}
                <PregnancyCard
                    icon={<Baby className="w-5 h-5 text-purple-500" />}
                    title={`Semana ${weeks} + ${days}`}
                    description="Sigue el crecimiento y desarrollo de tu bebé día a día."
                    color="bg-purple-500"
                />

                {/* Card 2: Síntomas (Placeholder link) */}
                <PregnancyCard
                    icon={<Heart className="w-5 h-5 text-red-500" />}
                    title="Registro de Síntomas"
                    description="Náuseas, antojos o fatiga. Lleva un control de tu salud."
                    color="bg-red-500"
                />

                {/* Card 3: Próximo Hito */}
                <PregnancyCard
                    icon={<Calendar className="w-5 h-5 text-blue-500" />}
                    title="Próximo Control"
                    description={nextMilestone ? `${nextMilestone.label} (${nextMilestone.range})` : "Controles completados"}
                    color="bg-blue-500"
                />

                {/* Card 4: Notificaciones */}
                <PregnancyCard
                    icon={<Settings className="w-5 h-5 text-gray-500" />}
                    title="Notificaciones"
                    description="Gestiona tus alertas de citas, semanas y consejos."
                    color="bg-gray-500"
                // Removed direct end pregnancy action
                />
            </div>

            {/* Confirmation Dialog */}
            <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Finalizar Embarazo</DialogTitle>
                        <DialogDescription>
                            ¿Estás segura de que deseas finalizar el modo embarazo?
                            <br />
                            Esto te devolverá al seguimiento de tu ciclo menstrual regular.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEndDialog(false)} disabled={endLoading}>
                            Cancelar
                        </Button>
                        <Button
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={handleConfirmEndPregnancy}
                            disabled={endLoading}
                        >
                            {endLoading ? 'Finalizando...' : 'Sí, finalizar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function PregnancyCard({ icon, title, description, onClick }) {
    return (
        <Card
            className={`border-none shadow-sm bg-gray-50/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 transition-colors ${onClick ? 'cursor-pointer hover:shadow-md' : ''}`}
            onClick={onClick}
        >
            <CardContent className="flex flex-col items-center text-center p-3 space-y-1">
                <div className="p-1.5 bg-white dark:bg-gray-700 rounded-full shadow-sm mb-1">
                    {icon}
                </div>
                <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">{title}</h4>
                <p className="text-xs text-muted-foreground dark:text-gray-400 leading-snug">
                    {description}
                </p>
            </CardContent>
        </Card>
    )
}
