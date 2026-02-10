import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { doctorService } from '../../../services/doctorService'
import Spinner from '../../../components/common/Spinner'
import AppointmentModal from '../../../components/features/AppointmentModal'
import EndometriosisTestModal from '../../../components/features/EndometriosisTestModal'
import { getImageUrl } from '../../../lib/imageUtils'
import { BottomNav, NavIcons } from '../../../components/common/BottomNav'

export default function BlogLayout({ children }) {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [doctor, setDoctor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false)
  const [isTestModalOpen, setIsTestModalOpen] = useState(false)

  useEffect(() => {
    if (slug) {
      loadDoctor()
    }
  }, [slug])

  const loadDoctor = async () => {
    try {
      setLoading(true)
      const data = await doctorService.getDoctorProfileBySlug(slug)
      setDoctor(data)

      // Set primary color
      if (data?.theme_primary_color) {
        document.documentElement.style.setProperty(
          '--primary-color',
          data.theme_primary_color
        )
      }
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner /></div>
  if (!doctor) return <div className="text-center py-10">Doctor no encontrado</div>

  const primaryColor = doctor.theme_primary_color || '#4F46E5'

  const theme = doctor.design_template || 'glass'
  const isDarkTheme = theme === 'dark'

  // Disable explicit background colors in dark mode so classes take over
  const bodyBgStyle = (doctor.theme_body_bg_color && !isDarkTheme) ? { background: doctor.theme_body_bg_color } : {}
  const containerBgColor = isDarkTheme ? null : doctor.theme_container_bg_color

  // Check enabled modules
  // Handle both array of strings and array of objects (depending on backend response format)
  const hasModule = (code) => {
    if (!doctor.enabled_modules) return false
    return doctor.enabled_modules.includes(code) ||
      doctor.enabled_modules.some(m => m.code === code)
  }

  const showEndoTest = hasModule('endometriosis_test')

  return (
    <div
      className={`min-h-screen pb-16 md:pb-0 transition-colors duration-200 ${isDarkTheme ? 'dark bg-gray-950 text-white' : (!doctor.theme_body_bg_color ? 'bg-gray-50' : '')}`}
      style={bodyBgStyle}
    >
      {/* Modals */}
      <AppointmentModal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        doctorId={doctor.id}
        doctor={doctor}
        primaryColor={primaryColor}
      />

      {showEndoTest && (
        <EndometriosisTestModal
          isOpen={isTestModalOpen}
          onClose={() => setIsTestModalOpen(false)}
          primaryColor={primaryColor}
          isDarkMode={isDarkTheme}
          onSchedule={() => setIsAppointmentModalOpen(true)}
        />
      )}

      {/* Blog Navbar */}
      <nav
        className={`sticky top-0 z-50 ${doctor.container_shadow ? 'shadow-lg' : ''} transition-colors duration-200 ${!containerBgColor ? 'bg-white dark:bg-gray-900 dark:border-gray-800' : ''}`}
        style={{
          borderBottom: isDarkTheme ? '1px solid #1f2937' : '3px solid white',
          ...(containerBgColor ? { backgroundColor: containerBgColor } : {})
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Doctor Name */}
            <Link to={`/dr/${doctor.slug_url}`} className="flex items-center space-x-4 hover:opacity-90 transition">
              {doctor.logo_url && (
                <img
                  src={getImageUrl(doctor.logo_url)}
                  alt={`${doctor.nombre_completo} logo`}
                  className="h-12 w-auto object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none'
                  }}
                />
              )}
              {doctor.nombre_completo && (
                <h1 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white">
                  {doctor.nombre_completo}
                </h1>
              )}
            </Link>

            {/* Actions - Hidden on Mobile (using Bottom Nav instead) */}
            <div className="hidden md:flex items-center space-x-4">


              <Link
                to={`/dr/${doctor.slug_url}`}
                className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white font-medium px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>Inicio</span>
              </Link>

              {showEndoTest && (
                <button
                  onClick={() => setIsTestModalOpen(true)}
                  className="hidden md:block px-4 py-2 border-2 rounded-lg font-bold hover:opacity-75 transition shadow-sm bg-white dark:bg-gray-800"
                  style={{ borderColor: primaryColor, color: primaryColor }}
                >
                  Test Endometriosis
                </button>
              )}

              <button
                onClick={() => setIsAppointmentModalOpen(true)}
                className="px-4 py-2 rounded-lg text-white font-bold hover:opacity-90 transition shadow-md"
                style={{ backgroundColor: primaryColor }}
              >
                Agendar Cita
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main>
        {children}
      </main>

      {/* Footer */}
      <footer
        className={`${doctor.container_shadow ? 'shadow-inner' : 'border-t'} transition-colors duration-200 ${!containerBgColor ? 'bg-white dark:bg-gray-800 dark:border-gray-700' : ''}`}
        style={containerBgColor ? { backgroundColor: containerBgColor } : {}}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-600 dark:text-gray-400">
            © {new Date().getFullYear()} {doctor.nombre_completo}. Todos los derechos reservados.
          </p>
        </div>
      </footer>

      {/* Bottom Navigation - Mobile Only */}
      <BottomNav
        items={[
          {
            icon: <NavIcons.Home />,
            label: 'Inicio',
            action: () => navigate(`/dr/${doctor.slug_url}`),
            isActive: false
          },
          {
            icon: <NavIcons.WhatsApp />,
            label: 'WhatsApp',
            action: () => doctor.whatsapp_url && window.open(doctor.whatsapp_url, '_blank', 'noopener,noreferrer'),
            isActive: false
          },
          {
            icon: <NavIcons.Calendar />,
            label: 'Agendar',
            action: () => setIsAppointmentModalOpen(true),
            isActive: isAppointmentModalOpen
          },
          {
            icon: <NavIcons.Blog />,
            label: 'Blog',
            action: () => navigate(`/dr/${doctor.slug_url}/blog`),
            isActive: true
          }
        ]}
        theme={primaryColor}
      />
    </div>
  )
}
