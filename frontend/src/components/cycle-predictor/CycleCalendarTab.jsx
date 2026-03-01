
import { useState, useEffect } from 'react'
import { Card, CardContent } from '../ui/card'
import Button from '../common/Button'

import { es } from 'date-fns/locale'
import { format, isSameDay, differenceInCalendarDays, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths, eachDayOfInterval } from 'date-fns'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Droplets, Heart, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Pill, Baby } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import cycleService from '../../services/cycleService'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'

const isValidDate = (d) => d instanceof Date && !isNaN(d)

// Custom Calendar Component - Pure CSS Grid
export function CustomCalendar({ selected, onSelect, onDoubleClick, isPeriodDay, isFertileDay, isOvulationDay, isMilestoneDay }) {
    const [currentMonth, setCurrentMonth] = useState(selected || new Date())

    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const startDate = startOfWeek(monthStart, { locale: es })
    const endDate = endOfWeek(monthEnd, { locale: es })

    const days = eachDayOfInterval({ start: startDate, end: endDate })
    const weekDays = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']

    const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
    const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

    const isToday = (date) => isSameDay(date, new Date())
    const isCurrentMonth = (date) => date.getMonth() === currentMonth.getMonth()
    const isSelected = (date) => selected && isSameDay(date, selected)

    return (
        <div className="w-full max-w-sm mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 px-2">
                <button
                    onClick={handlePrevMonth}
                    className="h-8 w-8 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
                >
                    <ChevronLeft className="h-4 w-4 text-gray-800 dark:text-white" />
                </button>

                <h2 className="text-base font-semibold uppercase tracking-wider text-gray-900 dark:text-white">
                    {format(currentMonth, 'MMMM yyyy', { locale: es })}
                </h2>

                <button
                    onClick={handleNextMonth}
                    className="h-8 w-8 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
                >
                    <ChevronRight className="h-4 w-4 text-gray-800 dark:text-white" />
                </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
                {/* Week Day Headers */}
                {weekDays.map((day, idx) => (
                    <div
                        key={idx}
                        className="h-9 flex items-center justify-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                        {day}
                    </div>
                ))}

                {/* Day Cells */}
                {days.map((day, idx) => {
                    const isPeriod = isPeriodDay && isPeriodDay(day)
                    const isFertile = isFertileDay && isFertileDay(day)
                    const isOvulation = isOvulationDay && isOvulationDay(day)
                    const isMilestone = isMilestoneDay && isMilestoneDay(day)
                    const todayClass = isToday(day) ? 'bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-100 font-bold border border-pink-200 dark:border-pink-800' : ''
                    const selectedClass = isSelected(day) ? 'bg-pink-500 text-white hover:bg-pink-600' : ''
                    const outsideClass = !isCurrentMonth(day) ? 'text-gray-400 dark:text-gray-600 opacity-50' : 'text-gray-900 dark:text-white'

                    let markerClass = ''
                    if (isMilestone) markerClass = 'bg-purple-100 dark:bg-purple-900/60 ring-2 ring-purple-400 ring-inset font-bold text-purple-700 dark:text-purple-300'
                    else if (isPeriod) markerClass = 'ring-2 ring-pink-400 ring-inset'
                    else if (isFertile) markerClass = 'ring-2 ring-teal-600 ring-inset'
                    else if (isOvulation) markerClass = 'ring-2 ring-teal-200 ring-inset'

                    return (
                        <button
                            key={idx}
                            onClick={() => onSelect && onSelect(day)}
                            onDoubleClick={() => onDoubleClick && onDoubleClick(day)}
                            className={`h-9 w-9 rounded-full flex items-center justify-center text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 ${outsideClass} ${todayClass} ${selectedClass} ${markerClass}`}
                        >
                            {format(day, 'd')}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

export default function CycleCalendarTab({ onPregnancyChange, activePregnancy }) {
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [activeCycle, setActiveCycle] = useState(null)
    const [showStartDialog, setShowStartDialog] = useState(false)
    const [isPregnancyStart, setIsPregnancyStart] = useState(false) // New state
    const [notes, setNotes] = useState('')
    const [predictions, setPredictions] = useState(null)
    const [cycleHistory, setCycleHistory] = useState([])
    const [settings, setSettings] = useState(null)

    // Pregnancy calculation
    const [pregWeeks, setPregWeeks] = useState(0)
    const [pregDays, setPregDays] = useState(0)

    useEffect(() => {
        if (activePregnancy?.last_period_date) {
            const lmp = parseISO(activePregnancy.last_period_date)
            const today = new Date()
            const diffDays = differenceInCalendarDays(today, lmp)
            if (diffDays >= 0) {
                setPregWeeks(Math.floor(diffDays / 7))
                setPregDays(diffDays % 7)
            }
        }
    }, [activePregnancy])

    // Config inputs for the modal
    const [cycleConfig, setCycleConfig] = useState({
        cycle_avg_length: 28,
        period_avg_length: 5
    })

    // Auth & Registration
    const { isAuthenticated, user, updateCycleUser } = useAuthStore()
    const params = useParams()
    // Fallback to 'mariel-herrera' if no slug provided (for /cycles route testing)
    const slug = params.slug || 'mariel-herrera'

    // Sync only on mount/auth change to fetch data
    useEffect(() => {
        const fetchCycleData = async () => {
            if (isAuthenticated) {
                try {

                    const [cyclesData, predictionsData, settingsData] = await Promise.all([
                        cycleService.getCycles(),
                        cycleService.getPredictions().catch(() => null),
                        cycleService.getSettings().catch(() => null)
                    ])

                    if (settingsData) setSettings(settingsData)


                    if (cyclesData && cyclesData.length > 0) {
                        const mappedHistory = cyclesData.map(c => ({
                            id: c.id,
                            startDate: new Date(c.start_date + 'T12:00:00'),
                            endDate: c.end_date ? new Date(c.end_date + 'T12:00:00') : null,
                            status: c.end_date ? 'completed' : 'active'
                        }))

                        setCycleHistory(mappedHistory)

                        const current = mappedHistory.find(c => c.status === 'active')
                        if (current) {
                            setActiveCycle(current)
                            // Only set selected date if it's not already set by user interaction
                            // setSelectedDate(current.startDate) 
                        } else {
                            setActiveCycle(null)
                        }
                    } else {
                        setCycleHistory([])
                        setActiveCycle(null)
                    }

                    if (predictionsData) {
                        setPredictions({
                            nextPeriod: new Date(predictionsData.next_period_start + 'T12:00:00'),
                            nextPeriodEnd: new Date(predictionsData.next_period_end + 'T12:00:00'),
                            ovulation: new Date(predictionsData.ovulation_date + 'T12:00:00'),
                            fertileWindow: {
                                start: new Date(predictionsData.fertile_window_start + 'T12:00:00'),
                                end: new Date(predictionsData.fertile_window_end + 'T12:00:00')
                            }
                        })
                    }

                } catch (err) {
                    console.error("Error fetching data:", err)
                    toast.error("Error al cargar datos del ciclo")
                }
            }
        }
        fetchCycleData()
    }, [isAuthenticated])

    // Fill config when dialog opens if user is logged in
    const handleStartPeriod = () => {
        if (user) {
            setCycleConfig({
                cycle_avg_length: user.cycle_avg_length || 28,
                period_avg_length: user.period_avg_length || 5
            })
        }
        setShowStartDialog(true)
    }

    const handleConfirmStart = async (dateOverride = null) => {
        const dateToUse = dateOverride instanceof Date ? dateOverride : selectedDate
        if (!isValidDate(dateToUse)) return

        try {
            if (!isAuthenticated) {
                toast.error('Inicia sesión para guardar tu ciclo', {
                    action: {
                        label: 'Ingresar',
                        onClick: () => window.location.href = '/login'
                    }
                })
                return
            }

            // 1. Save config if user is logged in (only if not a quick action from double click)
            if (isAuthenticated && user && !dateOverride) {
                await updateCycleUser(cycleConfig).catch(console.error)
            }

            // CHECK: Is pregnancy start?
            if (isPregnancyStart) {
                await cycleService.startPregnancy({
                    last_period_date: format(dateToUse, 'yyyy-MM-dd'),
                    notifications_enabled: true
                })
                toast.success("¡Felicidades! Modo embarazo activado")

                // Refresh parent state
                if (onPregnancyChange) onPregnancyChange()

                // Close dialog
                setShowStartDialog(false)
                setNotes('')
                setIsPregnancyStart(false)
                return
            }

            // 2. Create Cycle in Backend
            const newCycleData = {
                start_date: format(dateToUse, 'yyyy-MM-dd'),
                notes: notes || undefined
            }

            const createdCycle = await cycleService.createCycle(newCycleData)
            toast.success("Período iniciado correctamente")

            // 3. Update Frontend State
            const newCycle = {
                id: createdCycle.id,
                startDate: dateToUse,
                status: 'active'
            }

            setActiveCycle(newCycle)
            setCycleHistory(prev => [newCycle, ...prev])

            // 4. Update predictions (fetch fresh ones or calculate locally)
            // For now, let's fetch fresh predictions to be safe and leverage backend logic
            const predictionsData = await cycleService.getPredictions().catch(() => null)
            if (predictionsData) {
                setPredictions({
                    nextPeriod: new Date(predictionsData.next_period_start + 'T12:00:00'),
                    ovulation: new Date(predictionsData.ovulation_date + 'T12:00:00'),
                    fertileWindow: {
                        start: new Date(predictionsData.fertile_window_start + 'T12:00:00'),
                        end: new Date(predictionsData.fertile_window_end + 'T12:00:00')
                    }
                })
            }

            setShowStartDialog(false)
            setNotes('')

        } catch (err) {
            console.error("Error starting period/pregnancy:", err)
            // Error handling specific for pregnancy
            if (isPregnancyStart && err.response?.status === 400) {
                toast.error(err.response.data.detail || "Error al iniciar embarazo")
            } else {
                toast.error("Error al registrar fecha. Intenta nuevamente.")
            }
        }
    }

    // Helper to calculate cycle status for ANY date
    const getCycleDayStatus = (date) => {
        if (!activeCycle || !activeCycle.startDate || !cycleConfig) return null

        let cycleLen = cycleConfig.cycle_avg_length || 28
        let periodLen = cycleConfig.period_avg_length || 5

        // Safety check adjusted for medical variability (Polymenorrhea support)
        // We only force default if it looks like a data loading error (< 10 days)
        if (!cycleLen || cycleLen < 10) cycleLen = 28

        // Logical consistency: Period cannot be longer than the cycle itself
        if (periodLen >= cycleLen) periodLen = cycleLen - 1

        const startDate = new Date(activeCycle.startDate)
        const diff = differenceInCalendarDays(date, startDate)

        if (diff < 0) return null

        const dayInCycle = diff % cycleLen

        // 1. Period Days
        if (dayInCycle < periodLen) return 'period'

        // 2. Ovulation Day
        const ovulationDayIndex = cycleLen - 14
        if (dayInCycle === ovulationDayIndex) return 'ovulation'

        // 3. Fertile Window
        if (dayInCycle >= (ovulationDayIndex - 5) && dayInCycle <= (ovulationDayIndex + 1)) return 'fertile'

        return null
    }

    const handleEndPeriod = async () => {
        if (!activeCycle || !activeCycle.id) {
            toast.error("No hay un ciclo activo para finalizar")
            return
        }

        try {
            if (!isAuthenticated) {
                toast.error('Inicia sesión para gestionar tus ciclos', {
                    action: {
                        label: 'Ingresar',
                        onClick: () => window.location.href = '/login'
                    }
                })
                return
            }

            // Assume end date is today for simplicity, usually called "Finish Period". 
            // Or we could use selectedDate if logic dictates. 
            // For "Finish Period" button, implies "Today is the last day" or "Yesterday was".
            // Let's use today's date formatted.
            const today = new Date()

            await cycleService.updateCycle(activeCycle.id, {
                end_date: format(today, 'yyyy-MM-dd')
            })

            toast.success("Período finalizado")

            // Refresh Data to move to 'completed' status
            // Or manually update local state
            setActiveCycle(null)

            // Update history item
            setCycleHistory(prev => prev.map(c =>
                c.id === activeCycle.id
                    ? { ...c, endDate: today, status: 'completed' }
                    : c
            ))

        } catch (err) {
            console.error("Error ending period:", err)
            toast.error("Error al finalizar el período")
        }
    }

    // Helper para detectar días especiales de fertilidad/menstruación
    const isPeriodDay = (date) => getCycleDayStatus(date) === 'period'
    const isFertileDay = (date) => getCycleDayStatus(date) === 'fertile'
    const isOvulationDay = (date) => getCycleDayStatus(date) === 'ovulation'

    // Helper para detectar hitos importantes de embarazo en el calendario
    const isPregnancyMilestoneDay = (date) => {
        if (!activePregnancy?.last_period_date) return false;

        // Sumamos las semanas correspondientes a cada hito desde la FUR (Fecha de Última Regla)
        // Hitos: 11, 12, 20, 24, 28, 32, 35
        const lmp = parseISO(activePregnancy.last_period_date);
        const diff = differenceInCalendarDays(date, lmp);

        // Check if the difference in days corresponds exactly to the start of a milestone week
        // Ex: 11 weeks = 11 * 7 = 77 days
        const milestoneDays = [11 * 7, 12 * 7, 20 * 7, 24 * 7, 28 * 7, 32 * 7, 35 * 7];
        return milestoneDays.includes(diff);
    };

    return (
        <div className="space-y-6">
            {/* Two Column Layout: Cards Left, Calendar Right */}
            <div className="grid grid-cols-1 lg:grid-cols-[300px,1fr] gap-6">
                {/* Left Column: Info Cards Stacked */}
                <div className="space-y-4 flex flex-col justify-center h-full">
                    {activePregnancy ? (
                        <>
                            {/* Prenatal Card 1: Día de Gestación */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700 flex flex-col items-center justify-center text-center">
                                <span className="text-xs font-medium text-muted-foreground dark:text-gray-400 mb-1">TIEMPO DE GESTACIÓN</span>
                                <div className="flex items-center gap-2 mb-1">
                                    <Baby className="w-5 h-5 text-purple-500" />
                                    <span className="text-xl font-bold text-gray-900 dark:text-white">
                                        Semana {pregWeeks} + {pregDays}
                                    </span>
                                </div>
                                <span className="text-xs font-medium text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded-full mt-1">
                                    {activePregnancy?.due_date ? `FPP: ${format(parseISO(activePregnancy.due_date), "d MMM yyyy", { locale: es })}` : "--"}
                                </span>
                            </div>

                            {/* Prenatal Card 2: Trimestre Actual */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700 flex flex-col items-center justify-center text-center">
                                <span className="text-xs font-medium text-muted-foreground dark:text-gray-400 mb-1">MOMENTO ACTUAL</span>
                                <div className="flex items-center gap-2 mb-1">
                                    <Heart className="w-5 h-5 text-pink-500" />
                                    <span className="text-xl font-bold text-gray-900 dark:text-white">
                                        {pregWeeks < 13 ? '1er' : pregWeeks < 27 ? '2do' : '3er'} Trimestre
                                    </span>
                                </div>
                            </div>

                            {/* Prenatal Card 3: Cronograma General */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700 flex flex-col items-center text-center">
                                <span className="text-xs font-medium text-muted-foreground dark:text-gray-400 mb-2">CRONOLOGÍA MÉDICA</span>
                                <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1.5 w-full">
                                    <div className="flex justify-between border-b pb-1 dark:border-gray-700"><span>11-14 sem:</span> <b>Eco Genética</b></div>
                                    <div className="flex justify-between border-b pb-1 dark:border-gray-700"><span>20-24 sem:</span> <b>Morfológica</b></div>
                                    <div className="flex justify-between border-b pb-1 dark:border-gray-700"><span>24-28 sem:</span> <b>Glucosa</b></div>
                                    <div className="flex justify-between border-b pb-1 dark:border-gray-700"><span>28-32 sem:</span> <b>Vacuna Tdap</b></div>
                                    <div className="flex justify-between"><span>35-37 sem:</span> <b>Estreptococo</b></div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Card 1: Estado Actual */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700 flex flex-col items-center justify-center text-center">
                                <span className="text-xs font-medium text-muted-foreground dark:text-gray-400 mb-1">DÍA DEL CICLO</span>

                                {activeCycle ? (
                                    <>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Droplets className="w-4 h-4 text-pink-500" />
                                            <span className="text-xl font-bold text-gray-900 dark:text-white">
                                                {isValidDate(activeCycle.startDate)
                                                    ? `Día ${differenceInCalendarDays(new Date(), activeCycle.startDate instanceof Date ? activeCycle.startDate : parseISO(activeCycle.startDate)) + 1}`
                                                    : "--"}
                                            </span>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-6 text-xs rounded-full border-pink-200 text-pink-700 hover:bg-pink-50 dark:border-pink-900 dark:text-pink-400 dark:hover:bg-pink-900/40"
                                            onClick={handleEndPeriod}
                                        >
                                            Finalizar Período
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xl font-bold text-gray-400">Inactivo</span>
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={handleStartPeriod}
                                            className="h-7 text-xs rounded-full bg-pink-600 hover:bg-pink-700 text-white"
                                        >
                                            Iniciar Período
                                        </Button>
                                    </>
                                )}
                            </div>

                            {/* Card 2: Próximo Período */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700 flex flex-col items-center justify-center text-center">
                                <span className="text-xs font-medium text-muted-foreground dark:text-gray-400 mb-1">PRÓXIMO PERÍODO</span>
                                <div className="flex items-center gap-2 mb-1">
                                    <CalendarIcon className="w-4 h-4 text-purple-500" />
                                    <span className="text-xl font-bold text-gray-900 dark:text-white">
                                        {predictions && isValidDate(predictions.nextPeriod)
                                            ? format(predictions.nextPeriod, "d MMM", { locale: es })
                                            : "--"}
                                    </span>
                                </div>
                                <span className="text-xs text-muted-foreground dark:text-gray-500">
                                    {predictions && isValidDate(predictions.nextPeriod)
                                        ? `En ${differenceInCalendarDays(predictions.nextPeriod, new Date())} días`
                                        : "Sin datos"}
                                </span>
                            </div>

                            {/* Card 3: Ventana Fértil */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700 flex flex-col items-center justify-center text-center">
                                <span className="text-xs font-medium text-muted-foreground dark:text-gray-400 mb-1">VENTANA FÉRTIL</span>
                                <div className="flex items-center gap-2 mb-1">
                                    <Heart className="w-4 h-4 text-teal-500" />
                                    <span className="text-xl font-bold text-gray-900 dark:text-white">
                                        {predictions && isValidDate(predictions.fertileWindow.start)
                                            ? `${format(predictions.fertileWindow.start, "d")} - ${format(predictions.fertileWindow.end, "d MMM", { locale: es })}`
                                            : "--"}
                                    </span>
                                </div>
                                <span className="text-xs text-teal-600 dark:text-teal-400 font-medium">
                                    {predictions ? "Probabilidad Alta" : "Sin datos"}
                                </span>
                            </div>

                            {/* Card 4: Último Período (Explicit) */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700 flex flex-col items-center justify-center text-center">
                                <span className="text-xs font-medium text-muted-foreground dark:text-gray-400 mb-1">ÚLTIMO PERÍODO</span>
                                <div className="flex items-center gap-2 mb-1">
                                    <Droplets className="w-4 h-4 text-pink-400" />
                                    <span className="text-xl font-bold text-gray-900 dark:text-white">
                                        {activeCycle && isValidDate(activeCycle.startDate)
                                            ? format(activeCycle.startDate, "d 'de' MMMM", { locale: es })
                                            : "No registrado"}
                                    </span>
                                </div>
                            </div>

                            {/* Card 5: Anticonceptivos removed per user request */}
                        </>
                    )}
                </div>

                {/* Right Column: Calendar */}
                <Card className="border-0 shadow-none bg-transparent">
                    <CardContent className="p-0 mt-12">
                        <div className="flex flex-col items-center justify-center gap-6">
                            {/* Contenedor Externo Centrado */}
                            <div className="rounded-xl w-full max-w-md mx-auto bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-sm p-6 flex flex-col items-center">


                                {/* Custom Calendar - Pure CSS Grid */}
                                <CustomCalendar
                                    selected={selectedDate}
                                    onSelect={setSelectedDate}
                                    onDoubleClick={(date) => {
                                        if (!activePregnancy) {
                                            setSelectedDate(date)
                                            handleConfirmStart(date)
                                        }
                                    }}
                                    isPeriodDay={activePregnancy ? undefined : isPeriodDay}
                                    isFertileDay={activePregnancy ? undefined : isFertileDay}
                                    isOvulationDay={activePregnancy ? undefined : isOvulationDay}
                                    isMilestoneDay={activePregnancy ? isPregnancyMilestoneDay : undefined}
                                />

                                {/* Center Legend */}
                                {activePregnancy ? (
                                    <div className="flex flex-wrap justify-center gap-6 mt-6 pt-4 border-t dark:border-gray-700">
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 rounded-full bg-purple-100 ring-2 ring-purple-400 ring-inset"></div>
                                            <span className="text-xs text-muted-foreground dark:text-gray-400">Examen o Hito Médico</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap justify-center gap-6 mt-6 pt-4 border-t dark:border-gray-700">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-pink-400"></div>
                                            <span className="text-xs text-muted-foreground dark:text-gray-400">Período</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-teal-600"></div>
                                            <span className="text-xs text-muted-foreground dark:text-gray-400">Días fértiles</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-teal-200"></div>
                                            <span className="text-xs text-muted-foreground dark:text-gray-400">Ovulación</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {!activePregnancy && (
                                <p className="text-center text-lg font-medium text-muted-foreground animate-in fade-in slide-in-from-top-4">
                                    ¿Tu período llegó en otra fecha? Presiona doble click en la fecha para registrarlo
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Dialog para iniciar período (con Configuración) */}
            <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
                <DialogContent className="sm:max-w-md dark:bg-gray-900 dark:border-gray-700">
                    <DialogHeader>
                        <DialogTitle className="dark:text-white">
                            Iniciar Período
                        </DialogTitle>
                        <DialogDescription className="dark:text-gray-400">
                            Verifica la fecha y ajusta tu configuración si es necesario.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="flex items-center justify-center p-4 rounded-xl bg-muted/50 dark:bg-gray-800">
                            <div className="text-center">
                                <p className="text-sm text-muted-foreground dark:text-gray-400 mb-1">Fecha de inicio</p>
                                <p className="text-xl font-semibold dark:text-white">
                                    {isValidDate(selectedDate)
                                        ? format(selectedDate, "d 'de' MMMM, yyyy", { locale: es })
                                        : "Fecha inválida"}
                                </p>
                            </div>
                        </div>

                        {/* Config Inputs */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="cycle_avg_length" className="text-xs dark:text-gray-300">Duración Ciclo (días)</Label>
                                <Input
                                    id="cycle_avg_length"
                                    type="number"
                                    min="20"
                                    max="45"
                                    value={cycleConfig.cycle_avg_length}
                                    onChange={(e) => setCycleConfig({ ...cycleConfig, cycle_avg_length: parseInt(e.target.value) || 28 })}
                                    className="h-9 bg-white dark:bg-gray-800 dark:text-white dark:border-gray-700"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="period_avg_length" className="text-xs dark:text-gray-300">Duración Período (días)</Label>
                                <Input
                                    id="period_avg_length"
                                    type="number"
                                    min="3"
                                    max="10"
                                    value={cycleConfig.period_avg_length}
                                    onChange={(e) => setCycleConfig({ ...cycleConfig, period_avg_length: parseInt(e.target.value) || 5 })}
                                    className="h-9 bg-white dark:bg-gray-800 dark:text-white dark:border-gray-700"
                                />
                            </div>
                        </div>

                        {/* Pregnancy Option */}
                        <div className="flex items-center space-x-2 bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-100 dark:border-purple-900">
                            <Baby className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            <div className="flex-1">
                                <label htmlFor="preg-mode" className="text-sm font-medium text-purple-900 dark:text-purple-300 cursor-pointer select-none">
                                    ¿Es el inicio de tu embarazo?
                                </label>
                                <p className="text-xs text-purple-700 dark:text-purple-400">
                                    Marca esta fecha como tu última regla (FUR)
                                </p>
                            </div>
                            <input
                                type="checkbox"
                                id="preg-mode"
                                checked={isPregnancyStart}
                                onChange={(e) => setIsPregnancyStart(e.target.checked)}
                                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 border-gray-300"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes" className="dark:text-gray-300">Notas (opcional)</Label>
                            <Textarea
                                id="notes"
                                placeholder="Síntomas, flujo, estado de ánimo..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="rounded-xl bg-muted/50 border-0 resize-none text-sm dark:bg-gray-800 dark:text-white"
                                rows={2}
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setShowStartDialog(false)}
                            className="rounded-full dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleConfirmStart}
                            className="rounded-full bg-pink-500 hover:bg-pink-600 text-white border-0"
                        >
                            Confirmar Inicio
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    )
}
