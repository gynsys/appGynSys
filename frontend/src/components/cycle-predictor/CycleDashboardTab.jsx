import { useState } from 'react'
import { Calendar, Heart, History, Settings, User, Baby, Stethoscope } from 'lucide-react'
import { Card, CardContent } from '../ui/card'
import { useAuthStore } from '../../store/authStore'
import { cn } from '../../lib/utils'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import Button from '../common/Button'
import { CustomCalendar } from './CycleCalendarTab' // Reusing CustomCalendar
import cycleService from '../../services/cycleService'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function CycleDashboardTab({ onPregnancyChange }) {
    const { isAuthenticated, user } = useAuthStore()
    const [mode, setMode] = useState(() => localStorage.getItem('cycle_dashboard_mode') || 'calculator')
    const [showStartDialog, setShowStartDialog] = useState(false) // For pregnancy start

    const handleModeChange = (newMode) => {
        setMode(newMode)
        localStorage.setItem('cycle_dashboard_mode', newMode)
    }

    return (
        <div className="space-y-3 py-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Intro */}
            <div className="text-center space-y-1 mb-3">
                <h3 className="text-xl font-bold dark:text-white px-4">
                    Bienvenida a tu Calculadora Menstrual y tu Asistente de Control Prenatal
                </h3>
                <p className="text-xs text-muted-foreground dark:text-gray-400 max-w-lg mx-auto leading-tight">
                    Aquí podrás llevar un control detallado de tu salud femenina. Explora las funciones que hemos diseñado para ti:
                </p>

                {/* Mode Selector - Only for Authenticated Users */}
                {isAuthenticated && (
                    <div className="flex justify-center mt-2">
                        <div className="inline-flex p-1 bg-gray-100 dark:bg-gray-800 rounded-full border dark:border-gray-700">
                            <button
                                onClick={() => handleModeChange('calculator')}
                                title="Calculadora Menstrual: Predicciones de ciclo, días fértiles y control diario."
                                className={cn(
                                    "px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
                                    mode === 'calculator'
                                        ? "bg-white dark:bg-gray-700 text-pink-600 dark:text-pink-400 shadow-sm"
                                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                )}
                            >
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5" />
                                    Calculadora
                                </span>
                            </button>
                            <button
                                onClick={() => handleModeChange('prenatal')}
                                title="Control Prenatal: Seguimiento semana a semana, controles médicos y modo embarazo."
                                className={cn(
                                    "px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
                                    mode === 'prenatal'
                                        ? "bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm"
                                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                )}
                            >
                                <span className="flex items-center gap-1.5">
                                    <Baby className="w-3.5 h-3.5" />
                                    Control Prenatal
                                </span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {mode === 'calculator' ? (
                    <>
                        <FeatureCard
                            icon={<Calendar className="w-5 h-5 text-pink-500" />}
                            title="Calendario Menstrual"
                            description="Visualiza tus días fértiles, predicciones de periodo y ovulación de manera clara."
                        />
                        <FeatureCard
                            icon={<Heart className="w-5 h-5 text-red-500" />}
                            title="Registro de Síntomas"
                            description="Lleva un diario de cómo te sientes física y emocionalmente cada día."
                        />
                        <FeatureCard
                            icon={<History className="w-5 h-5 text-purple-500" />}
                            title="Historial Médico"
                            description="Analiza tus ciclos pasados y detecta patrones importantes para tu salud."
                        />
                        <FeatureCard
                            icon={<Settings className="w-5 h-5 text-blue-500" />}
                            title="Ajustes"
                            description="Personaliza tus recordatorios de anticonceptivos y alertas del ciclo. Debes registrarte e iniciar sesión."
                        />
                    </>
                ) : (
                    <>
                        {/* Intro Text / Call to Action for Pregnancy */}
                        <div className="col-span-1 sm:col-span-2 text-center mb-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-900">
                            <h4 className="font-semibold text-sm text-purple-900 dark:text-purple-300 mb-1">¿Estás embarazada?</h4>
                            <p className="text-xs text-purple-700 dark:text-purple-400 mb-2">
                                Activa el modo embarazo para acceder al seguimiento semanal, hitos médicos y más.
                            </p>
                            <button
                                onClick={() => setShowStartDialog(true)}
                                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-full transition-colors"
                            >
                                Iniciar Seguimiento de Embarazo
                            </button>
                        </div>

                        <FeatureCard
                            icon={<Baby className="w-5 h-5 text-purple-500" />}
                            title="Seguimiento Semanal"
                            description="Monitorea el crecimiento de tu bebé semana a semana con información detallada."
                        />
                        <FeatureCard
                            icon={<Stethoscope className="w-5 h-5 text-blue-500" />}
                            title="Controles Médicos"
                            description="Agenda y recordatorios para tus ecografías, exámenes y visitas prenatales."
                        />
                        <FeatureCard
                            icon={<Calendar className="w-5 h-5 text-green-500" />}
                            title="Fecha Probable de Parto"
                            description="Calcula y ajusta tu fecha probable de parto según tus ecografías."
                        />
                        <FeatureCard
                            icon={<Settings className="w-5 h-5 text-orange-500" />}
                            title="Ajustes de Embarazo"
                            description="Configura notificaciones específicas para cada etapa de tu gestación."
                        />
                    </>
                )}
            </div>

            <StartPregnancyDialog
                open={showStartDialog}
                onOpenChange={setShowStartDialog}
                onSuccess={onPregnancyChange}
            />

        </div>
    )
}


function StartPregnancyDialog({ open, onOpenChange, onSuccess }) {
    const [date, setDate] = useState(new Date())
    const [loading, setLoading] = useState(false)

    const handleConfirm = async () => {
        try {
            setLoading(true)
            await cycleService.startPregnancy({
                last_period_date: format(date, 'yyyy-MM-dd')
            })
            toast.success("¡Embarazo activado!", { description: "Calculando semanas y fecha de parto..." })
            onOpenChange(false)
            if (onSuccess) onSuccess()
        } catch (error) {
            console.error(error)
            toast.error("Error al activar embarazo")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Configurar Embarazo</DialogTitle>
                    <DialogDescription>
                        Ingresa la fecha de tu última menstruación (FUR) para calcular las semanas de gestación.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 flex flex-col items-center gap-4">
                    <p className="text-sm font-medium">Fecha de Última Regla (FUR)</p>
                    <div className="border rounded-md p-2">
                        <CustomCalendar
                            mode="single"
                            selected={date}
                            onSelect={(d) => d && setDate(d)}
                            disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                            initialFocus
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={loading}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                        {loading ? 'Guardando...' : 'Confirmar y Activar'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function FeatureCard({ icon, title, description }) {
    return (
        <Card className="border-none shadow-sm bg-gray-50/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 transition-colors">
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
