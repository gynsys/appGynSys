import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useAuth } from '../features/auth/useAuth'
import { doctorService } from '../services/doctorService'
import { blogService } from '../modules/blog/services/blogService'
import { appointmentService } from '../services/appointmentService'
import ScheduleModal from '../components/features/ScheduleModal'
import { useToastStore } from '../store/toastStore'
import { getImageUrl } from '../lib/imageUtils'
import { useDarkMode } from '../hooks/useDarkMode'
import { MdNotifications } from 'react-icons/md'

export default function DashboardOverviewPage() {
  const navigate = useNavigate()
  const { isAuthenticated, user, logout } = useAuthStore()
  const { refreshUser } = useAuth()
  const { showToast } = useToastStore()
  const [doctor, setDoctor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [articleCount, setArticleCount] = useState(0)
  const [pendingAppointmentsCount, setPendingAppointmentsCount] = useState(0)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [darkMode, toggleDarkMode] = useDarkMode()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    // Fetch current user data to get logo and name
    const fetchData = async () => {
      try {
        const [doctorData, posts, appointments] = await Promise.all([
          doctorService.getCurrentUser(),
          blogService.getMyPosts(),
          appointmentService.getAppointments()
        ])
        setDoctor(doctorData)
        setArticleCount(posts.length)
        setPendingAppointmentsCount(appointments.filter(a => ['scheduled', 'preconsulta_completed'].includes(a.status)).length)
      } catch (err) {
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      setDoctor(user)
      // If we have user, we still need to fetch posts and appointments
      Promise.all([
        blogService.getMyPosts(),
        appointmentService.getAppointments()
      ])
        .then(([posts, appointments]) => {
          setArticleCount(posts.length)
          setPendingAppointmentsCount(appointments.filter(a => ['scheduled', 'preconsulta_completed'].includes(a.status)).length)
        })
        .finally(() => setLoading(false))
    } else {
      fetchData()
    }
  }, [isAuthenticated, navigate, user])

  const handleSaveSchedule = async (tenantId, scheduleData) => {
    try {
      const updatedDoctor = await doctorService.updateCurrentUser(scheduleData)
      setDoctor(updatedDoctor)
      setShowScheduleModal(false)
      showToast('Horarios actualizados exitosamente', 'success')
    } catch (error) {
      showToast('Error al actualizar horarios', 'error')
    }
  }

  if (!isAuthenticated || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  const primaryColor = doctor?.theme_primary_color || '#4F46E5'
  const publicUrl = doctor?.slug_url ? `/dr/${doctor.slug_url}` : '#'

  return (
    <>
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-[80vh] flex flex-col justify-center">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Panel de Administración
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Desde aquí puedes gestionar tus citas, historias médicas, configurar tu perfil público y administrar el contenido de tu blog.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-5xl mx-auto w-full">
          <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-800 dark:text-white transition-colors duration-200 flex flex-col items-center justify-center text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Citas del Mes</h3>
            <p className="text-3xl font-bold" style={{ color: primaryColor }}>0</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-800 dark:text-white transition-colors duration-200 flex flex-col items-center justify-center text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Pacientes</h3>
            <p className="text-3xl font-bold" style={{ color: primaryColor }}>0</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-800 dark:text-white transition-colors duration-200 flex flex-col items-center justify-center text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Artículos Publicados</h3>
            <p className="text-3xl font-bold" style={{ color: primaryColor }}>{articleCount}</p>
          </div>
        </div>
      </main>

      {doctor && (
        <ScheduleModal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          tenant={doctor}
          onSave={handleSaveSchedule}
        />
      )}
    </>
  )
}

