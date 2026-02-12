import { useState, useEffect } from 'react'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import Button from '../common/Button'
import { Textarea } from '../ui/textarea'
import { Save, Loader2, Calendar as CalendarIcon, ChevronDown, ChevronRight, Check } from 'lucide-react'
import cycleService from '../../services/cycleService'
import { useAuthStore } from '../../store/authStore'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import CustomCalendar from './CustomCalendar'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { cn } from '../../lib/utils'


// Helper component to handle hover/active states with dynamic theme color
const ThemeBadge = ({ item, isSelected, onClick, themeColor }) => {
    const [isHovered, setIsHovered] = useState(false)

    // Base styles: reduced font size (~5% less than text-sm/14px -> 13.5px), gray border
    let style = {}
    let className = "cursor-pointer transition-all py-1.5 px-3 flex items-center justify-center border border-gray-300 dark:border-gray-700"

    // Text colors - default to gray in dark mode as requested
    let textClass = "text-gray-700 dark:text-gray-400"

    if (isSelected) {
        // Selected State
        textClass = "text-white" // Always white on filled background
        if (themeColor) {
            style = {
                backgroundColor: themeColor,
                borderColor: themeColor,
                filter: isHovered ? 'brightness(0.95)' : 'none'
            }
        } else {
            // Fallback if no theme color
            className += " bg-primary text-primary-foreground hover:bg-primary/90 border-primary"
        }
    } else {
        // Unselected State
        className += " bg-transparent"
        if (isHovered && themeColor) {
            style = {
                borderColor: themeColor,
                color: themeColor,
                backgroundColor: `${themeColor}10` // 10% opacity hex
            }
            // Override text class on hover to use theme color
            textClass = ""
        } else {
            className += " hover:bg-accent hover:text-accent-foreground"
        }
    }

    return (
        <div
            className={cn("rounded-full text-[13.5px] font-medium", className, textClass)}
            style={style}
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <span className="mr-1.5 text-base leading-none">{item.icon}</span>
            {item.label}
            {isSelected && <Check className="w-3.5 h-3.5 ml-1.5 stroke-[3]" />}
        </div>
    )
}

export default function CycleSymptomsTab({ activePregnancy }) {
    const { user } = useAuthStore()
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [mood, setMood] = useState(null)
    const [flowIntensity, setFlowIntensity] = useState(null)
    const [painLevel, setPainLevel] = useState(0)
    const [selectedSymptoms, setSelectedSymptoms] = useState([])
    const [notes, setNotes] = useState('')
    const [isNotesOpen, setIsNotesOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [savedSymptoms, setSavedSymptoms] = useState([])
    const [loadingHistory, setLoadingHistory] = useState(true)

    // Fallback color if theme is missing (Guest Mode support)
    const themeColor = user?.theme_primary_color || localStorage.getItem('tenant_theme_primary')

    const moods = [
        { id: 'happy', label: 'Feliz', icon: '😄' },
        { id: 'calm', label: 'Tranquila', icon: '😌' },
        { id: 'sad', label: 'Triste', icon: '😢' },
        { id: 'anxious', label: 'Ansiosa', icon: '😰' },
        { id: 'irritable', label: 'Irritable', icon: '😠' }
    ]

    const flowIntensities = [
        { id: 'light', label: 'Ligero', icon: '💧' },
        { id: 'medium', label: 'Medio', icon: '💧' },
        { id: 'heavy', label: 'Abundante', icon: '🩸' }
    ]

    const cycleSymptoms = [
        { id: 'cramps', label: 'Colicos', icon: '💫' },
        { id: 'headache', label: 'Migraña', icon: '🤕' },
        { id: 'bloating', label: 'Hinchazon', icon: '🎈' },
        { id: 'fatigue', label: 'Fatiga', icon: '😴' },
        { id: 'nausea', label: 'Nauseas', icon: '🤢' },
        { id: 'tenderness', label: 'Sensibilidad', icon: '💔' }
    ]

    const pregnancySymptoms = [
        { id: 'nausea', label: 'Náuseas', icon: '🤢' },
        { id: 'heartburn', label: 'Acidez', icon: '🔥' },
        { id: 'backpain', label: 'Dolor espalda', icon: '🦴' },
        { id: 'swelling', label: 'Hinchazón', icon: '🦶' },
        { id: 'fatigue', label: 'Cansancio', icon: '😴' },
        { id: 'frequency', label: 'Orina frec.', icon: '🚽' },
        { id: 'dizziness', label: 'Mareos', icon: '😵' },
        { id: 'cravings', label: 'Antojos', icon: '🍫' }
    ]

    const alarmSigns = [
        { id: 'bleeding', label: 'Sangrado', icon: '🩸' },
        { id: 'fluid_loss', label: 'Pérdida líquido', icon: '💧' },
        { id: 'headache_severe', label: 'Dolor cabeza', icon: '🤯' },
        { id: 'contractions', label: 'Contracciones', icon: '⚡' }
    ]

    const currentSymptoms = activePregnancy ? pregnancySymptoms : cycleSymptoms

    useEffect(() => {
        loadSymptomsHistory()
    }, [])

    const loadSymptomsHistory = async () => {
        if (!isAuthenticated) return

        try {
            setLoadingHistory(true)
            const data = await cycleService.getSymptoms()
            setSavedSymptoms(data)
        } catch (error) {
            console.error('Error loading symptoms:', error)
        } finally {
            setLoadingHistory(false)
        }
    }

    const toggleSymptom = (symptomId) => {
        setSelectedSymptoms(prev =>
            prev.includes(symptomId)
                ? prev.filter(id => id !== symptomId)
                : [...prev, symptomId]
        )
    }

    const handleSave = async () => {
        if (!isAuthenticated) {
            toast.error('Inicia sesión para guardar tus síntomas', {
                action: {
                    label: 'Ingresar',
                    onClick: () => window.location.href = '/login'
                }
            })
            return
        }

        if (!mood && !flowIntensity && selectedSymptoms.length === 0 && painLevel === 0 && !notes) {
            toast.error('Por favor selecciona al menos un sintoma o estado')
            return
        }

        try {
            setLoading(true)
            const symptomData = {
                date: format(selectedDate, 'yyyy-MM-dd'),
                mood: mood || null,
                flow_intensity: flowIntensity || null,
                pain_level: painLevel > 0 ? painLevel : null,
                symptoms: selectedSymptoms,
                notes: notes || null
            }

            await cycleService.createSymptom(symptomData)
            toast.success('Sintomas guardados correctamente')

            setMood(null)
            setFlowIntensity(null)
            setPainLevel(0)
            setSelectedSymptoms([])
            setNotes('')

        } catch (error) {
            console.error('Error saving symptoms:', error)
            if (error.response) {
                console.error('Server Error Data:', error.response.data)
            }
            if (error.response?.status === 401) {
                toast.error('Debes iniciar sesion para guardar sintomas')
            } else {
                toast.error('Error al guardar sintomas: ' + (error.response?.data?.detail || error.message))
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <Card className="border-none shadow-sm bg-gray-50/50 dark:bg-gray-800/50">
                <CardContent className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <p className="text-lg font-semibold dark:text-gray-400">Registra como te sientes hoy</p>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    primaryColor={themeColor}
                                    className={cn(
                                        "w-auto justify-start text-left font-normal border rounded-md px-3 shadow-sm h-auto py-2",
                                        !selectedDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4 text-primary" style={{ color: themeColor }} />
                                    {selectedDate ? format(selectedDate, "PPP", { locale: es }) : "Selecciona una fecha"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                                <CustomCalendar
                                    selected={selectedDate}
                                    onSelect={setSelectedDate}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-[60%_40%] gap-6">
                        <div>
                            <h4 className="font-medium mb-3 dark:text-gray-400">Estado de Animo</h4>
                            <div className="flex gap-2 flex-wrap">
                                {moods.map((m) => (
                                    <ThemeBadge
                                        key={m.id}
                                        item={m}
                                        isSelected={mood === m.id}
                                        onClick={() => setMood(mood === m.id ? null : m.id)}
                                        themeColor={themeColor}
                                    />
                                ))}
                            </div>
                        </div>

                        <div>
                            {activePregnancy ? (
                                <>
                                    <h4 className="font-medium mb-3 dark:text-gray-400 text-red-500">Signos de Alarma</h4>
                                    <div className="flex gap-2 flex-wrap">
                                        {alarmSigns.map((sign) => (
                                            <ThemeBadge
                                                key={sign.id}
                                                item={sign}
                                                isSelected={selectedSymptoms.includes(sign.id)}
                                                onClick={() => toggleSymptom(sign.id)}
                                                themeColor={themeColor} // Or force red?
                                            />
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <h4 className="font-medium mb-3 dark:text-gray-400">Intensidad del Flujo</h4>
                                    <div className="flex gap-2 flex-wrap">
                                        {flowIntensities.map((flow) => (
                                            <ThemeBadge
                                                key={flow.id}
                                                item={flow}
                                                isSelected={flowIntensity === flow.id}
                                                onClick={() => setFlowIntensity(flowIntensity === flow.id ? null : flow.id)}
                                                themeColor={themeColor}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div>
                        <h4 className="font-medium mb-3 dark:text-gray-400">Sintomas</h4>
                        <div className="flex gap-2 flex-wrap">
                            {currentSymptoms.map((symptom) => (
                                <ThemeBadge
                                    key={symptom.id}
                                    item={symptom}
                                    isSelected={selectedSymptoms.includes(symptom.id)}
                                    onClick={() => toggleSymptom(symptom.id)}
                                    themeColor={themeColor}
                                />
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium dark:text-gray-400">Nivel de Dolor {activePregnancy ? '' : 'Menstrual'}</h4>
                            <span className={cn(
                                "text-sm font-medium px-2 py-0.5 rounded-full",
                                painLevel === 0 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                                    painLevel <= 3 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                                        painLevel <= 6 ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" :
                                            "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            )}>
                                {painLevel === 0 ? 'Sin dolor' :
                                    painLevel <= 3 ? 'Leve' :
                                        painLevel <= 6 ? 'Moderado' : 'Severo'} ({painLevel})
                            </span>
                        </div>
                        <div className="flex justify-between items-center gap-1 overflow-visible p-1">
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                                <button
                                    key={level}
                                    onClick={() => setPainLevel(level)}
                                    className={cn(
                                        "w-8 h-8 rounded-full text-xs font-medium flex items-center justify-center transition-all",
                                        painLevel === level
                                            ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary ring-offset-2 dark:ring-offset-background"
                                            : "bg-secondary text-secondary-foreground hover:bg-secondary/80 dark:text-gray-400"
                                    )}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="p-0 h-auto font-medium mb-2 hover:bg-transparent hover:text-primary dark:text-gray-400 dark:hover:text-primary"
                            onClick={() => setIsNotesOpen(!isNotesOpen)}
                        >
                            {isNotesOpen ? <ChevronDown className="w-4 h-4 mr-1" /> : <ChevronRight className="w-4 h-4 mr-1" />}
                            Notas (opcional)
                        </Button>

                        {isNotesOpen && (
                            <div className="space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                                <Textarea
                                    placeholder="Breve nota..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={2}
                                    maxLength={200}
                                    className="resize-none"
                                />
                                <p className="text-xs text-muted-foreground text-right">{notes.length}/200</p>
                            </div>
                        )}
                    </div>

                    <Button
                        onClick={handleSave}
                        disabled={loading}
                        className="w-full max-w-[250px] mx-auto block"
                        primaryColor={themeColor}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Guardar Sintomas
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
