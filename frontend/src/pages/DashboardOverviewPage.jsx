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
import { useAppointmentStore } from '../store/appointmentStore'
import WelcomeTourModal from '../components/dashboard/WelcomeTourModal'
import PushSubscriptionWidget from '../components/dashboard/PushSubscriptionWidget'

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

  // Use global store for appointments
  const { appointments: appointmentsList, fetchAppointments, loading: appointmentsLoading } = useAppointmentStore()

  // Failsafe: Fetch appointments if store is empty on mount
  useEffect(() => {
    if (appointmentsList.length === 0 && !appointmentsLoading) {
      fetchAppointments()
    }
  }, [appointmentsList.length, appointmentsLoading, fetchAppointments])

  // New Stats State
  const [stats, setStats] = useState({
    test_count: 0,
    cycle_users_count: 0,
    visitor_count: 0,
    appointments_month_count: 0
  })
  // const [appointmentsList, setAppointmentsList] = useState([]) // REMOVED: Managed by store

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
        // Appointments are now preloaded in App.jsx via store
        const [doctorData, posts, dashboardStats] = await Promise.all([
          doctorService.getCurrentUser(),
          blogService.getMyPosts(),
          // appointmentService.getAppointments(), // REMOVED
          dashboardService.getStats()
        ])
        setDoctor(doctorData)
        setArticleCount(posts.length)
        // Recalculate pending from store data if needed, or rely on store derived state later
        setPendingAppointmentsCount(appointmentsList.filter(a => ['scheduled', 'preconsulta_completed'].includes(a.status)).length)
        // setAppointmentsList(appointments) // REMOVED
        setStats(dashboardStats)
      } catch (err) {
        console.error("Error fetching dashboard data", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [isAuthenticated, navigate, appointmentsList]) // Added appointmentsList dependency to re-calc local derived stats

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
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 py-3 min-h-[80vh] flex flex-col justify-center">
        <div className="mb-4 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Panel de Administración
          </h2>

        </div>

        {/* Push Subscription Alert (Dra. Mariel/Inquilina) */}
        <div className="mb-6 max-w-6xl mx-auto w-full px-0 sm:px-2">
          <PushSubscriptionWidget primaryColor={primaryColor} />
        </div>

        {/* Dashboard Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 mb-8 max-w-6xl mx-auto w-full px-0 sm:px-2">
          {/* Citas del Mes */}
          <div className="bg-white rounded-none sm:rounded-lg shadow p-4 dark:bg-gray-800 dark:text-white transition-colors duration-200 flex flex-col items-center justify-center text-center hover:scale-105 transform border-y border-x-0 sm:border-x border-gray-100 dark:border-gray-700 w-full h-[100px]">
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Citas del Mes</h3>
            <p className="text-2xl md:text-3xl font-extrabold" style={{ color: primaryColor }}>{stats.appointments_month_count}</p>
          </div>

          {/* Pacientes */}
          <div className="bg-white rounded-none sm:rounded-lg shadow p-4 dark:bg-gray-800 dark:text-white transition-colors duration-200 flex flex-col items-center justify-center text-center hover:scale-105 transform border-y border-x-0 sm:border-x border-gray-100 dark:border-gray-700 w-full h-[100px]">
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Pacientes</h3>
            <p className="text-2xl md:text-3xl font-extrabold" style={{ color: primaryColor }}>{stats.appointments_month_count}</p>
          </div>

          {/* Artículos */}
          <div className="bg-white rounded-none sm:rounded-lg shadow p-4 dark:bg-gray-800 dark:text-white transition-colors duration-200 flex flex-col items-center justify-center text-center hover:scale-105 transform border-y border-x-0 sm:border-x border-gray-100 dark:border-gray-700 w-full h-[100px]">
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Artículos</h3>
            <p className="text-2xl md:text-3xl font-extrabold" style={{ color: primaryColor }}>{articleCount}</p>
          </div>

          {/* Test Realizados (Conditional) */}
          {hasEndometriosisModule && (
            <div className="bg-white rounded-none sm:rounded-lg shadow p-4 dark:bg-gray-800 dark:text-white transition-colors duration-200 flex flex-col items-center justify-center text-center hover:scale-105 transform border-y border-x-0 sm:border-x border-gray-100 dark:border-gray-700 w-full h-[100px]">
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Test Endo</h3>
              <p className="text-2xl md:text-3xl font-extrabold text-pink-500">{stats.test_count}</p>
            </div>
          )}

          {/* Usuarios Predictor */}
          <div className="bg-white rounded-none sm:rounded-lg shadow p-4 dark:bg-gray-800 dark:text-white transition-colors duration-200 flex flex-col items-center justify-center text-center hover:scale-105 transform border-y border-x-0 sm:border-x border-gray-100 dark:border-gray-700 w-full h-[100px]">
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Ciclo</h3>
            <p className="text-2xl md:text-3xl font-extrabold text-purple-500">{stats.cycle_users_count}</p>
          </div>

          {/* Visitantes */}
          <div className="bg-white rounded-none sm:rounded-lg shadow p-4 dark:bg-gray-800 dark:text-white transition-colors duration-200 flex flex-col items-center justify-center text-center hover:scale-105 transform border-y border-x-0 sm:border-x border-gray-100 dark:border-gray-700 w-full h-[100px]">
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Visitantes</h3>
            <p className="text-2xl md:text-3xl font-extrabold text-blue-500">{stats.visitor_count}</p>
          </div>
        </div>

        {/* Calendars Section */}
        <div className="max-w-6xl mx-auto w-full mb-6 px-0 sm:px-2">
          <div className="flex flex-wrap justify-center gap-[90px]">
            <DashboardCalendar
              appointments={appointmentsList}
              title="Agenda Consultas Online"
              type="online"
              primaryColor={primaryColor}
            />
            <DashboardCalendar
              appointments={appointmentsList}
              title="Agenda Consultas Presenciales"
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
      <WelcomeTourModal doctor={doctor} />
    </>
  )
}

