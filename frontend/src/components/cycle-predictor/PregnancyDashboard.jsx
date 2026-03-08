import { useState, useEffect } from 'react'
import { Card, CardContent } from '../ui/card'
import Button from '../common/Button'
import { differenceInDays, addDays, format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar, AlertCircle, Baby, Stethoscope, FileText, Heart, Settings, ChevronRight, Camera, User, Loader2 } from 'lucide-react'
import cycleService from '../../services/cycleService'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { useAuthStore } from '../../store/authStore'

export default function PregnancyDashboard({ activePregnancy, onStatusChange }) {
    const { cycleUser, setPhotoUrl } = useAuthStore()
    const [weeks, setWeeks] = useState(0)
    const [days, setDays] = useState(0)
    const [daysRemaining, setDaysRemaining] = useState(0)

    const [showEndDialog, setShowEndDialog] = useState(false)
    const [endLoading, setEndLoading] = useState(false)
    const [uploadingAvatar, setUploadingAvatar] = useState(false)

    useEffect(() => {
        if (activePregnancy?.last_period_date) {
            const lmp = parseISO(activePregnancy.last_period_date)
            const today = new Date()
            const diffDays = differenceInDays(today, lmp)

            const w = Math.floor(diffDays / 7)
            const d = diffDays % 7
            setWeeks(w)
            setDays(d)

            if (activePregnancy?.due_date) {
                const due = parseISO(activePregnancy.due_date)
                const remaining = differenceInDays(due, today)
                setDaysRemaining(remaining > 0 ? remaining : 0)
            }
        }
    }, [activePregnancy])

    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            setUploadingAvatar(true)
            const formData = new FormData()
            formData.append('file', file)
            const res = await cycleService.uploadProfileImage(formData)
            if (res.photo_url) {
                setPhotoUrl(res.photo_url)
            }
        } catch (error) {
            console.error('Error uploading avatar:', error)
        } finally {
            setUploadingAvatar(false)
        }
    }

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
        <div className="space-y-2 py-1 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Avatar */}
            <div className="relative flex flex-col items-center">
                {/* End Pregnancy Button */}
                <div className="absolute top-0 right-0 z-10">
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-[10px] h-6 px-2 text-red-500 hover:text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-900/40"
                        onClick={() => setShowEndDialog(true)}
                    >
                        Finalizar
                    </Button>
                </div>

                {/* Profile Picture / Avatar */}
                <div className="relative group mb-3 pt-4">
                    <div className="w-24 h-24 rounded-full border-4 border-purple-500 p-1 flex items-center justify-center bg-white dark:bg-gray-800 overflow-hidden shadow-lg">
                        {cycleUser?.photo_url ? (
                            <img src={`${import.meta.env.VITE_API_URL}${cycleUser.photo_url}`} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                        ) : (
                            <User className="w-12 h-12 text-gray-300" />
                        )}
                        {uploadingAvatar && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full">
                                <Loader2 className="w-6 h-6 animate-spin text-white" />
                            </div>
                        )}
                    </div>
                    <label className="absolute bottom-0 right-0 bg-purple-600 hover:bg-purple-700 p-2 rounded-full cursor-pointer shadow-md transform hover:scale-110 transition-transform">
                        <Camera className="w-4 h-4 text-white" />
                        <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                    </label>
                </div>

                <div className="text-center space-y-0.5">
                    <div className="inline-flex items-center justify-center p-1.5 bg-purple-100 dark:bg-purple-900/40 rounded-full mb-1">
                        <Baby className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="text-2xl font-black dark:text-white px-4 leading-none">
                        ¡Semana {weeks}!
                    </h3>
                    <p className="text-xs text-muted-foreground dark:text-gray-400 max-w-lg mx-auto leading-tight">
                        Tu bebé tiene el tamaño de una fruta esta semana.
                    </p>

                    {/* FPP Highlight & Countdown */}
                    <div className="mt-4 flex flex-col items-center gap-1">
                        <div className="flex flex-col items-center bg-purple-600 dark:bg-purple-700 text-white rounded-2xl px-6 py-3 shadow-xl transform hover:scale-105 transition-transform border-2 border-purple-400">
                            <span className="text-[10px] uppercase font-bold tracking-widest opacity-80">Fecha Probable Parto</span>
                            <span className="text-xl font-black">
                                {activePregnancy?.due_date ? format(parseISO(activePregnancy.due_date), "d 'de' MMMM, yyyy", { locale: es }) : '--'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 px-4 py-1.5 bg-white dark:bg-gray-800 border border-purple-100 dark:border-purple-900 rounded-full shadow-sm">
                            <Calendar className="w-3.5 h-3.5 text-purple-500" />
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                Faltan <span className="text-purple-600 dark:text-purple-400">{daysRemaining} días</span>
                            </span>
                            <span className="text-[10px] text-gray-400 font-medium">({Math.ceil(daysRemaining / 7)} sem)</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 4 Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
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
