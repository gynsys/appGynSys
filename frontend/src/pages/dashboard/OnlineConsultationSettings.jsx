import { useState, useEffect } from 'react'
import { onlineConsultationService } from '../../services/onlineConsultationService'
import { useToastStore } from '../../store/toastStore'
import { useAuthStore } from '../../store/authStore'
import Button from '../../components/common/Button'
import Spinner from '../../components/common/Spinner'
import DragDropUpload from '../../components/features/DragDropUpload'
import { FiDollarSign, FiCreditCard, FiClock, FiCalendar, FiVideo } from 'react-icons/fi'

export default function OnlineConsultationSettings() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const { showToast } = useToastStore()
    const { user } = useAuthStore()
    const primaryColor = user?.theme_primary_color || '#8B5CF6'

    const [settings, setSettings] = useState({
        first_consultation_price: 50.0,
        followup_price: 40.0,
        currency: 'USD',
        payment_methods: ['zelle', 'paypal', 'bank_transfer'],
        available_hours: {
            start: '09:00',
            end: '17:00',
            days: [1, 2, 3, 4, 5] // Mon-Fri
        },
        session_duration_minutes: 45,
        is_active: true,
        video_url: ''
    })

    useEffect(() => {
        loadSettings()
    }, [])

    const loadSettings = async () => {
        try {
            setLoading(true)
            const data = await onlineConsultationService.getMySettings()
            setSettings(data)
        } catch (error) {
            console.error('Error loading settings:', error)
            // Keep defaults if error
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            setSaving(true)
            await onlineConsultationService.updateSettings(settings)
            showToast('Configuración guardada exitosamente', 'success')
        } catch (error) {
            console.error('Error saving settings:', error)
            showToast('Error al guardar configuración', 'error')
        } finally {
            setSaving(false)
        }
    }

    const paymentMethodOptions = [
        { value: 'zelle', label: 'Zelle', icon: '💰' },
        { value: 'paypal', label: 'PayPal', icon: '💳' },
        { value: 'bank_transfer', label: 'Transferencia Bancaria', icon: '🏦' },
        { value: 'mobile_payment', label: 'Pago Móvil (Bs)', icon: '📱' }
    ]

    const dayOptions = [
        { value: 1, label: 'Lunes' },
        { value: 2, label: 'Martes' },
        { value: 3, label: 'Miércoles' },
        { value: 4, label: 'Jueves' },
        { value: 5, label: 'Viernes' },
        { value: 6, label: 'Sábado' },
        { value: 0, label: 'Domingo' }
    ]

    const handlePaymentMethodToggle = (method) => {
        const current = settings.payment_methods || []
        if (current.includes(method)) {
            setSettings({
                ...settings,
                payment_methods: current.filter(m => m !== method)
            })
        } else {
            setSettings({
                ...settings,
                payment_methods: [...current, method]
            })
        }
    }

    const handleDayToggle = (day) => {
        const current = settings.available_hours?.days || []
        if (current.includes(day)) {
            setSettings({
                ...settings,
                available_hours: {
                    ...settings.available_hours,
                    days: current.filter(d => d !== day)
                }
            })
        } else {
            setSettings({
                ...settings,
                available_hours: {
                    ...settings.available_hours,
                    days: [...current, day].sort()
                }
            })
        }
    }

    if (loading) return <Spinner />

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div
                            className="p-2 rounded-lg text-white"
                            style={{ backgroundColor: primaryColor }}
                        >
                            <FiVideo className="w-6 h-6" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Consultas Online
                        </h1>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                        Configura los precios, métodos de pago y disponibilidad para tus consultas por videollamada.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Enable/Disable Toggle */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Estado del Servicio</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {settings.is_active ? 'Las consultas online están activadas' : 'Las consultas online están desactivadas'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSettings({ ...settings, is_active: !settings.is_active })}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.is_active ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-700'
                                    }`}
                                style={settings.is_active ? { backgroundColor: primaryColor } : {}}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.is_active ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>
                    </div>

                    {/* Video Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <FiVideo className="w-5 h-5" style={{ color: primaryColor }} />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Video de Marketing</h3>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Video de Marketing
                            </label>
                            <DragDropUpload
                                type="video"
                                onUploadSuccess={(url) => setSettings({ ...settings, video_url: url })}
                                currentUrl={settings.video_url}
                                primaryColor={primaryColor}
                                accept="video/*"
                                sideBySide={true}
                                compact={true}
                            />
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                Este video se mostrará en la sección pública de Consulta Online.
                                Se reproducirá en loop, sin audio (muted), para atraer pacientes.
                                <br />
                                <strong>Recomendación:</strong> Videos cortos (15-30 seg), formato MP4, máx 50MB.
                            </p>
                        </div>
                    </div>

                    {/* Pricing */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <FiDollarSign className="w-5 h-5" style={{ color: primaryColor }} />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Precios</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Primera Consulta
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={settings.first_consultation_price}
                                        onChange={(e) => setSettings({ ...settings, first_consultation_price: parseFloat(e.target.value) })}
                                        className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 bg-white dark:bg-gray-700 dark:text-white"
                                        style={{ '--tw-ring-color': primaryColor }}
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Seguimiento
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={settings.followup_price}
                                        onChange={(e) => setSettings({ ...settings, followup_price: parseFloat(e.target.value) })}
                                        className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 bg-white dark:bg-gray-700 dark:text-white"
                                        style={{ '--tw-ring-color': primaryColor }}
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Moneda
                                </label>
                                <select
                                    value={settings.currency}
                                    onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 bg-white dark:bg-gray-700 dark:text-white"
                                    style={{ '--tw-ring-color': primaryColor }}
                                >
                                    <option value="USD">USD</option>
                                    <option value="EUR">EUR</option>
                                    <option value="VES">Bs (VES)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Payment Methods */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <FiCreditCard className="w-5 h-5" style={{ color: primaryColor }} />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Métodos de Pago</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {paymentMethodOptions.map((method) => (
                                <button
                                    key={method.value}
                                    type="button"
                                    onClick={() => handlePaymentMethodToggle(method.value)}
                                    className={`flex items-center gap-3 p-3 rounded-lg border-2 transition ${settings.payment_methods?.includes(method.value)
                                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                                        }`}
                                    style={settings.payment_methods?.includes(method.value) ? { borderColor: primaryColor } : {}}
                                >
                                    <span className="text-2xl">{method.icon}</span>
                                    <span className={`font-medium ${settings.payment_methods?.includes(method.value)
                                        ? 'text-purple-700 dark:text-purple-300'
                                        : 'text-gray-700 dark:text-gray-300'
                                        }`}>
                                        {method.label}
                                    </span>
                                    {settings.payment_methods?.includes(method.value) && (
                                        <span className="ml-auto text-purple-600">✓</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Available Hours */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <FiClock className="w-5 h-5" style={{ color: primaryColor }} />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Horario de Atención</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Hora Inicio
                                </label>
                                <input
                                    type="time"
                                    value={settings.available_hours?.start || '09:00'}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        available_hours: { ...settings.available_hours, start: e.target.value }
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 bg-white dark:bg-gray-700 dark:text-white"
                                    style={{ '--tw-ring-color': primaryColor }}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Hora Fin
                                </label>
                                <input
                                    type="time"
                                    value={settings.available_hours?.end || '17:00'}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        available_hours: { ...settings.available_hours, end: e.target.value }
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 bg-white dark:bg-gray-700 dark:text-white"
                                    style={{ '--tw-ring-color': primaryColor }}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Duración (min)
                                </label>
                                <select
                                    value={settings.session_duration_minutes}
                                    onChange={(e) => setSettings({ ...settings, session_duration_minutes: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 bg-white dark:bg-gray-700 dark:text-white"
                                    style={{ '--tw-ring-color': primaryColor }}
                                >
                                    <option value={30}>30 minutos</option>
                                    <option value={45}>45 minutos</option>
                                    <option value={60}>60 minutos</option>
                                </select>
                            </div>
                        </div>

                        {/* Available Days */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                <FiCalendar className="w-4 h-4" />
                                Días Disponibles
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {dayOptions.map((day) => (
                                    <button
                                        key={day.value}
                                        type="button"
                                        onClick={() => handleDayToggle(day.value)}
                                        className={`px-4 py-2 rounded-full font-medium transition ${settings.available_hours?.days?.includes(day.value)
                                            ? 'text-white'
                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                            }`}
                                        style={settings.available_hours?.days?.includes(day.value) ? { backgroundColor: primaryColor } : {}}
                                    >
                                        {day.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end gap-3">
                        <Button
                            type="submit"
                            disabled={saving}
                            style={{ backgroundColor: primaryColor }}
                            className="px-8"
                        >
                            {saving ? 'Guardando...' : 'Guardar Configuración'}
                        </Button>
                    </div>
                </form>
            </main>
        </div>
    )
}
