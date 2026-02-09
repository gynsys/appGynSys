import { useState, useEffect } from 'react'
import ToggleSwitch from '../common/ToggleSwitch'
import { Label } from '../ui/label'
import Button from '../common/Button'
import { Input } from '../ui/input'
import { Baby, Pill, Calendar as CalendarIcon, Clock, ChevronRight, Settings2 } from 'lucide-react'
import cycleService from '../../services/cycleService'
import { toast } from 'sonner'

export default function CycleSettingsTab({ onPregnancyChange }) {
    // Notification Settings
    const [settings, setSettings] = useState({
        contraceptive_enabled: false,
        contraceptive_time: '20:00',
        contraceptive_frequency: 'daily',
        rhythm_method_enabled: false,
        fertile_window_alerts: false,
        ovulation_alert: false,
        gyn_checkup_alert: false,
        // Phase 1 Enhancements
        rhythm_abstinence_alerts: false,
        period_confirmation_reminder: true
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
            if (data) setSettings(data)
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

            // Update Notification Settings
            await cycleService.updateSettings(settings)

            toast.success("Configuración guardada", { description: "Tus preferencias de notificaciones han sido actualizadas." })
        } catch (error) {
            console.error(error)
            toast.error("Error", { description: "No se pudieron guardar los cambios." })
        } finally {
            setLoading(false)
        }
    }



    return (
        <div className="max-w-xl mx-auto px-6 py-4 space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">



            {/* Contraceptives - Only show if NOT pregnant */}
            {!isPregnant && (
                <div className="space-y-2 border-b pb-3 dark:border-gray-800">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-full text-pink-600 dark:text-pink-400">
                                <Pill className="w-4 h-4" />
                            </div>
                            <Label className="text-base font-medium dark:text-gray-200">Anticonceptivos</Label>
                        </div>

                        {/* Time Selector - Only visible when enabled */}
                        {settings.contraceptive_enabled ? (
                            <div className="flex items-center gap-2">
                                <div className="relative w-16">
                                    <select
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-800 dark:border-gray-700 appearance-none text-center"
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
                                <span className="text-gray-500 font-semibold text-sm">:</span>
                                <div className="relative w-16">
                                    <select
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-800 dark:border-gray-700 appearance-none text-center"
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
                                <ToggleSwitch
                                    checked={settings.contraceptive_enabled}
                                    onChange={(v) => setSettings({ ...settings, contraceptive_enabled: v })}
                                />
                            </div>
                        ) : (
                            <ToggleSwitch
                                checked={settings.contraceptive_enabled}
                                onChange={(v) => setSettings({ ...settings, contraceptive_enabled: v })}
                            />
                        )}
                    </div>
                </div>
            )}

            {/* Cycle Alerts - Only show if NOT pregnant */}
            {
                !isPregnant && (
                    <div className="space-y-2 border-b pb-3 dark:border-gray-800">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CalendarIcon className="w-4 h-4 text-gray-500" />
                                <Label className="font-normal dark:text-gray-300">Método del Ritmo</Label>
                            </div>
                            <ToggleSwitch
                                checked={settings.rhythm_method_enabled}
                                onChange={(v) => setSettings({ ...settings, rhythm_method_enabled: v })}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <HeartIcon className="w-4 h-4 text-red-400" />
                                <Label className="font-normal dark:text-gray-300">Ventana Fértil</Label>
                            </div>
                            <ToggleSwitch
                                checked={settings.fertile_window_alerts}
                                onChange={(v) => setSettings({ ...settings, fertile_window_alerts: v })}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full border-2 border-primary" />
                                <Label className="font-normal dark:text-gray-300">Ovulación (Día pico)</Label>
                            </div>
                            <ToggleSwitch
                                checked={settings.ovulation_alert}
                                onChange={(v) => setSettings({ ...settings, ovulation_alert: v })}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 text-orange-500">🔴</div>
                                <Label className="font-normal dark:text-gray-300">Método del Ritmo</Label>
                            </div>
                            <ToggleSwitch
                                checked={settings.rhythm_abstinence_alerts}
                                onChange={(v) => setSettings({ ...settings, rhythm_abstinence_alerts: v })}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 text-blue-500">📅</div>
                                <Label className="font-normal dark:text-gray-300">Confirmación de Periodo</Label>
                            </div>
                            <ToggleSwitch
                                checked={settings.period_confirmation_reminder}
                                onChange={(v) => setSettings({ ...settings, period_confirmation_reminder: v })}
                            />
                        </div>
                    </div>
                )
            }

            {/* Pregnancy Notifications - Only show if pregnant */}
            {
                isPregnant && (
                    <div className="space-y-2 border-b pb-3 dark:border-gray-800">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Baby className="w-4 h-4 text-pink-500" />
                                <Label className="font-normal dark:text-gray-300">Ecografía Genética (11-14 sem)</Label>
                            </div>
                            <ToggleSwitch
                                checked={true}
                                onChange={(v) => { }}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CalendarIcon className="w-4 h-4 text-blue-500" />
                                <Label className="font-normal dark:text-gray-300">Perfil Prenatal I</Label>
                            </div>
                            <ToggleSwitch
                                checked={true}
                                onChange={(v) => { }}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Baby className="w-4 h-4 text-purple-500" />
                                <Label className="font-normal dark:text-gray-300">Ecografía Morfológica (18-24 sem)</Label>
                            </div>
                            <ToggleSwitch
                                checked={true}
                                onChange={(v) => { }}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CalendarIcon className="w-4 h-4 text-yellow-500" />
                                <Label className="font-normal dark:text-gray-300">Test de Tolerancia a la Glucosa</Label>
                            </div>
                            <ToggleSwitch
                                checked={true}
                                onChange={(v) => { }}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Bell className="w-4 h-4 text-orange-500" />
                                <Label className="font-normal dark:text-gray-300">Vacunación Tdap</Label>
                            </div>
                            <ToggleSwitch
                                checked={true}
                                onChange={(v) => { }}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Baby className="w-4 h-4 text-green-500" />
                                <Label className="font-normal dark:text-gray-300">Ecografía Crecimiento</Label>
                            </div>
                            <ToggleSwitch
                                checked={true}
                                onChange={(v) => { }}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CalendarIcon className="w-4 h-4 text-teal-500" />
                                <Label className="font-normal dark:text-gray-300">Cultivo Estreptococo B</Label>
                            </div>
                            <ToggleSwitch
                                checked={true}
                                onChange={(v) => { }}
                            />
                        </div>
                    </div>
                )
            }

            <div className="pt-2 flex justify-end">
                <Button onClick={handleSave} disabled={loading} className="bg-pink-600 hover:bg-pink-700 text-white w-full sm:w-auto">
                    {loading ? 'Guardando...' : 'Guardar Cambios y Configuración'}
                </Button>
            </div>
        </div >
    )
}

function HeartIcon({ className }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
    )
}
