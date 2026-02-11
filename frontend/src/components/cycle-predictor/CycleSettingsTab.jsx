import { useState, useEffect } from 'react'
import ToggleSwitch from '../common/ToggleSwitch'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { Label } from '../ui/label'
import Button from '../common/Button'
import {
    Bell, Baby, Pill, Calendar as CalendarIcon,
    BellOff, Loader2, Activity, FileText, Flag,
    Lightbulb, AlertTriangle, Heart, CloudRain, ShieldCheck,
    ThermometerSun
} from 'lucide-react'
import cycleService from '../../services/cycleService'
import { toast } from 'sonner'
import { Switch } from '../ui/switch'

export default function CycleSettingsTab({ onPregnancyChange }) {
    // Notification Settings
    const [settings, setSettings] = useState({
        // Cycle (Legacy & New Mapped)
        contraceptive_enabled: false,
        contraceptive_time: '20:00',
        contraceptive_frequency: 'daily',

        cycle_period_predictions: true,
        cycle_fertile_window: true,
        cycle_pms_symptoms: true,
        cycle_rhythm_method: false,

        // Prenatal
        prenatal_ultrasounds: true,
        prenatal_lab_results: true,
        prenatal_milestones: true,
        prenatal_daily_tips: true,
        prenatal_symptom_alerts: true,

        // Legacy/Compat keys (kept for backend compatibility if needed)
        period_confirmation_reminder: true,
        rhythm_method_enabled: false // Mapped to cycle_rhythm_method
    })

    const [loading, setLoading] = useState(false)
    const [isPregnant, setIsPregnant] = useState(false)

    useEffect(() => {
        loadSettings()
        checkPregnancyStatus()
    }, [])

    const loadSettings = async () => {
        try {
            const data = await cycleService.getSettings()
            if (data) {
                // Ensure defaults for new keys if backend returns null
                setSettings(prev => ({ ...prev, ...data }))
            }
        } catch (error) {
            console.error("Error loading settings", error)
        }
    }

    const checkPregnancyStatus = async () => {
        try {
            const pregnancy = await cycleService.getPregnancy()
            setIsPregnant(pregnancy && pregnancy.is_active)
        } catch (error) {
            setIsPregnant(false)
        }
    }

    // Handler to save notification settings
    const handleSave = async () => {
        try {
            setLoading(true)

            // Sync legacy keys with new master switches for backward compat
            const payload = {
                ...settings,
                rhythm_method_enabled: settings.cycle_rhythm_method,
                fertile_window_alerts: settings.cycle_fertile_window,
                ovulation_alert: settings.cycle_fertile_window // Sync both
            }

            await cycleService.updateSettings(payload)

            toast.success("Configuración guardada", { description: "Tus preferencias simplificadas han sido actualizadas." })
        } catch (error) {
            console.error(error)
            toast.error("Error", { description: "No se pudieron guardar los cambios." })
        } finally {
            setLoading(false)
        }
    }

    // Push notifications hook
    const { isSubscribed, subscribeToPush, unsubscribeFromPush, loading: pushLoading, error: pushError, permission } = usePushNotifications();

    const handlePushToggle = async (checked) => {
        try {
            if (checked) {
                await subscribeToPush();
            } else {
                await unsubscribeFromPush();
            }
        } catch (error) {
            console.error('Error toggling push notifications:', error);
        }
    };

    const SettingRow = ({ icon: Icon, colorClass, title, subtitle, checked, onChange, children }) => (
        <div className="py-4 flex items-start justify-between">
            <div className="flex items-start gap-3">
                <div className={`p-2 rounded-full ${colorClass} bg-opacity-10`}>
                    <Icon className={`w-5 h-5 ${colorClass.replace('bg-', 'text-')}`} />
                </div>
                <div>
                    <Label className="text-base font-medium dark:text-gray-200">{title}</Label>
                    {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
                    {children}
                </div>
            </div>
            <ToggleSwitch checked={checked} onChange={onChange} />
        </div>
    )

    return (
        <div className="max-w-xl mx-auto px-6 py-4 space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">

            {/* Push Notifications Master Switch */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${isSubscribed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                            {pushLoading ? <Loader2 className="w-5 h-5 animate-spin" /> :
                                isSubscribed ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
                        </div>
                        <div>
                            <h3 className="font-medium text-gray-900 dark:text-gray-100">Notificaciones Push</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {permission === 'denied' ? 'Bloqueadas por el navegador' :
                                    isSubscribed ? 'Activadas en este dispositivo' : 'Permite alertas en tu celular'}
                            </p>
                        </div>
                    </div>
                    <Switch
                        checked={isSubscribed}
                        onCheckedChange={handlePushToggle}
                        disabled={pushLoading || permission === 'denied'}
                    />
                </div>
                {pushError && <p className="text-xs text-red-500 mt-2 ml-12">{pushError}</p>}
            </div>

            {/* PRENATAL SECTION */}
            {isPregnant ? (
                <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-pink-500 uppercase tracking-wider mb-4 px-2">Modo Embarazo 🤱</h3>
                    <div className="bg-white dark:bg-gray-800 rounded-xl divide-y dark:divide-gray-700 shadow-sm border border-gray-100 dark:border-gray-700 px-4">

                        <SettingRow
                            icon={Activity}
                            colorClass="bg-blue-500 text-blue-600"
                            title="Ecografías"
                            subtitle="Recordatorios de Genética, Morfológica, Crecimiento..."
                            checked={settings.prenatal_ultrasounds}
                            onChange={(v) => setSettings({ ...settings, prenatal_ultrasounds: v })}
                        />

                        <SettingRow
                            icon={FileText}
                            colorClass="bg-indigo-500 text-indigo-600"
                            title="Estudios Médicos"
                            subtitle="Análisis de sangre, glucosa, vacunas importantes"
                            checked={settings.prenatal_lab_results}
                            onChange={(v) => setSettings({ ...settings, prenatal_lab_results: v })}
                        />

                        <SettingRow
                            icon={Flag}
                            colorClass="bg-purple-500 text-purple-600"
                            title="Hitos del Desarrollo"
                            subtitle="Descubre el tamaño de tu bebé semana a semana"
                            checked={settings.prenatal_milestones}
                            onChange={(v) => setSettings({ ...settings, prenatal_milestones: v })}
                        />

                        <SettingRow
                            icon={Lightbulb}
                            colorClass="bg-yellow-500 text-yellow-600"
                            title="Consejos Diarios"
                            subtitle="Tips de salud, nutrición y bienestar cada mañana"
                            checked={settings.prenatal_daily_tips}
                            onChange={(v) => setSettings({ ...settings, prenatal_daily_tips: v })}
                        />

                        <SettingRow
                            icon={AlertTriangle}
                            colorClass="bg-red-500 text-red-600"
                            title="Alertas de Síntomas"
                            subtitle="Avisos de seguridad si reportas síntomas peligrosos"
                            checked={settings.prenatal_symptom_alerts}
                            onChange={(v) => setSettings({ ...settings, prenatal_symptom_alerts: v })}
                        />

                    </div>
                </div>
            ) : (
                /* CYCLE SECTION */
                <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-pink-500 uppercase tracking-wider mb-4 px-2">Modo Ciclo 🩸</h3>
                    <div className="bg-white dark:bg-gray-800 rounded-xl divide-y dark:divide-gray-700 shadow-sm border border-gray-100 dark:border-gray-700 px-4">

                        <SettingRow
                            icon={CalendarIcon}
                            colorClass="bg-pink-500 text-pink-600"
                            title="Predicción de Periodo"
                            subtitle="Avisos de cuándo llegará tu próxima menstruación"
                            checked={settings.cycle_period_predictions}
                            onChange={(v) => setSettings({ ...settings, cycle_period_predictions: v })}
                        />

                        <SettingRow
                            icon={Heart}
                            colorClass="bg-rose-500 text-rose-600"
                            title="Ventana Fértil y Ovulación"
                            subtitle="Identifica tus días de mayor fertilidad"
                            checked={settings.cycle_fertile_window}
                            onChange={(v) => setSettings({ ...settings, cycle_fertile_window: v })}
                        />

                        <SettingRow
                            icon={CloudRain}
                            colorClass="bg-slate-500 text-slate-600"
                            title="Fase Lútea / SPM"
                            subtitle="Prepárate para cambios de humor o físicos"
                            checked={settings.cycle_pms_symptoms}
                            onChange={(v) => setSettings({ ...settings, cycle_pms_symptoms: v })}
                        />

                        {/* Contraceptives with Time Picker */}
                        <div className="py-4 flex items-start justify-between">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-full bg-teal-100 text-teal-600">
                                    <Pill className="w-5 h-5" />
                                </div>
                                <div className="space-y-2">
                                    <div>
                                        <Label className="text-base font-medium dark:text-gray-200">Anticonceptivos</Label>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Recordatorio diario de tu toma</p>
                                    </div>

                                    {/* Time Picker Visibility Check */}
                                    <div className={`transition-all duration-300 overflow-hidden ${settings.contraceptive_enabled ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}>
                                        <div className="flex items-center gap-1 mt-1 bg-gray-50 dark:bg-gray-900/50 p-1.5 rounded-lg w-fit border border-gray-200 dark:border-gray-700">
                                            <div className="relative">
                                                <select
                                                    className="bg-transparent text-sm font-medium focus:outline-none dark:text-gray-200 cursor-pointer pl-1"
                                                    value={(settings.contraceptive_time || "20:00").split(':')[0]}
                                                    onChange={(e) => {
                                                        const [_, m] = (settings.contraceptive_time || "20:00").split(':')
                                                        setSettings({ ...settings, contraceptive_time: `${e.target.value}:${m}` })
                                                    }}
                                                >
                                                    {Array.from({ length: 24 }).map((_, i) => {
                                                        const h = i.toString().padStart(2, '0')
                                                        return <option key={h} value={h}>{h}</option>
                                                    })}
                                                </select>
                                            </div>
                                            <span className="text-gray-400 text-sm">:</span>
                                            <div className="relative">
                                                <select
                                                    className="bg-transparent text-sm font-medium focus:outline-none dark:text-gray-200 cursor-pointer pr-1"
                                                    value={(settings.contraceptive_time || "20:00").split(':')[1]}
                                                    onChange={(e) => {
                                                        const [h, _] = (settings.contraceptive_time || "20:00").split(':')
                                                        setSettings({ ...settings, contraceptive_time: `${h}:${e.target.value}` })
                                                    }}
                                                >
                                                    <option value="00">00</option>
                                                    <option value="15">15</option>
                                                    <option value="30">30</option>
                                                    <option value="45">45</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <ToggleSwitch
                                checked={settings.contraceptive_enabled}
                                onChange={(v) => setSettings({ ...settings, contraceptive_enabled: v })}
                            />
                        </div>

                        <SettingRow
                            icon={ShieldCheck}
                            colorClass="bg-green-500 text-green-600"
                            title="Método del Ritmo"
                            subtitle="Alertas de seguridad para planificación natural"
                            checked={settings.cycle_rhythm_method}
                            onChange={(v) => setSettings({ ...settings, cycle_rhythm_method: v })}
                        />
                    </div>
                </div>
            )}

            <div className="pt-4 flex justify-end">
                <Button onClick={handleSave} disabled={loading} className="bg-pink-600 hover:bg-pink-700 text-white w-full sm:w-auto shadow-lg hover:shadow-xl transition-all">
                    {loading ? 'Guardando...' : 'Guardar Preferencias'}
                </Button>
            </div>
        </div >
    )
}
