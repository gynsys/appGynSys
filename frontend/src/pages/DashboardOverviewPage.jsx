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
import { dashboardService } from '../services/dashboardService'
import DashboardCalendar from '../components/dashboard/DashboardCalendar'

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

  // New Stats State
  const [stats, setStats] = useState({
    test_count: 0,
    cycle_users_count: 0,
    visitor_count: 0,
    appointments_month_count: 0
  })
  const [appointmentsList, setAppointmentsList] = useState([])

  const isModuleEnabled = (moduleCode) => {
    return doctor?.enabled_modules?.some(m => (typeof m === 'string' ? m === moduleCode : m.code === moduleCode))
  }
  const hasEndometriosisModule = isModuleEnabled('endometriosis_test') || isModuleEnabled('preconsulta')

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    // Fetch current user data to get logo and name
    const fetchData = async () => {
      try {
        const [doctorData, posts, appointments, dashboardStats] = await Promise.all([
          doctorService.getCurrentUser(),
          blogService.getMyPosts(),
          appointmentService.getAppointments(),
          dashboardService.getStats()
        ])
        setDoctor(doctorData)
        setArticleCount(posts.length)
        setPendingAppointmentsCount(appointments.filter(a => ['scheduled', 'preconsulta_completed'].includes(a.status)).length)
        setAppointmentsList(appointments)
        setStats(dashboardStats)
      } catch (err) {
        console.error("Error fetching dashboard data", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [isAuthenticated, navigate])

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
        <div className="mb-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Panel de Administración
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Bienvenido, Dr(a). {doctor?.nombre_completo}. Aquí tiene el resumen de su actividad actual.
          </p>
        </div>

        {/* Stats Grid - Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 max-w-6xl mx-auto w-full">
          {/* Citas del Mes */}
          <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-800 dark:text-white transition-colors duration-200 flex flex-col items-center justify-center text-center hover:scale-105 transform transition-transform">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Citas del Mes</h3>
            <p className="text-4xl font-extrabold" style={{ color: primaryColor }}>{stats.appointments_month_count}</p>
          </div>

          {/* Pacientes (Placeholder logic for now, or total appointments) */}
          <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-800 dark:text-white transition-colors duration-200 flex flex-col items-center justify-center text-center hover:scale-105 transform transition-transform">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Pacientes Atendidos</h3>
            <p className="text-4xl font-extrabold" style={{ color: primaryColor }}>{stats.appointments_month_count}</p> {/* Using same metric for now as proxy */}
          </div>

          {/* Artículos */}
          <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-800 dark:text-white transition-colors duration-200 flex flex-col items-center justify-center text-center hover:scale-105 transform transition-transform">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Artículos Publicados</h3>
            <p className="text-4xl font-extrabold" style={{ color: primaryColor }}>{articleCount}</p>
          </div>
        </div>

        {/* Stats Grid - Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-6xl mx-auto w-full">
          {/* Test Realizados (Conditional) */}
          {hasEndometriosisModule && (
            <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-800 dark:text-white transition-colors duration-200 flex flex-col items-center justify-center text-center hover:scale-105 transform transition-transform">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Test Endometriosis</h3>
              <p className="text-4xl font-extrabold text-pink-500">{stats.test_count}</p>
            </div>
          )}

          {/* Usuarios Predictor */}
          <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-800 dark:text-white transition-colors duration-200 flex flex-col items-center justify-center text-center hover:scale-105 transform transition-transform">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Usuarias Ciclo</h3>
            <p className="text-4xl font-extrabold text-purple-500">{stats.cycle_users_count}</p>
          </div>

          {/* Visitantes */}
          <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-800 dark:text-white transition-colors duration-200 flex flex-col items-center justify-center text-center hover:scale-105 transform transition-transform">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Visitantes Perfil</h3>
            <p className="text-4xl font-extrabold text-blue-500">{stats.visitor_count}</p>
          </div>
        </div>

        {/* Calendars Section */}
        <div className="max-w-6xl mx-auto w-full mb-12">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">Agenda de Citas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <DashboardCalendar
              appointments={appointmentsList}
              title="Consultas Online 📹"
              type="online"
              primaryColor={primaryColor}
            />
            <DashboardCalendar
              appointments={appointmentsList}
              title="Consultas Presenciales 🏥"
              type="presencial"
              primaryColor={primaryColor}
            />
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

