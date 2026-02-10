import { useState } from 'react'
import { getImageUrl } from '../../lib/imageUtils'
import { Link, useNavigate } from 'react-router-dom'
import { FiMenu, FiX, FiLogIn, FiBarChart2, FiActivity } from 'react-icons/fi'
import MegaMenu from './MegaMenu'
import LoginModal from '../features/LoginModal'
import { useAuthStore } from '../../store/authStore'
import CyclePredictorModal from '../cycle-predictor/CyclePredictorModal'
import EndometriosisTestModal from '../features/EndometriosisTestModal'

export default function Navbar({ doctor, primaryColor = '#4F46E5', onAppointmentClick, containerShadow = true, containerBgColor }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isCycleModalOpen, setIsCycleModalOpen] = useState(false)
  const [isTestModalOpen, setIsTestModalOpen] = useState(false)
  const { isAuthenticated, user, logout } = useAuthStore()
  const navigate = useNavigate()

  // Usage: if containerBgColor is explicitly passed (even null), use it. Only fallback to doctor.theme... if undefined.
  // In Dark Mode, parent passes 'null', so effectiveBgColor becomes 'null', preventing the legacy color override.
  const effectiveBgColor = containerBgColor !== undefined ? containerBgColor : doctor?.theme_container_bg_color

  // Check if Endometriosis Test module is enabled
  const showEndoTest = doctor?.enabled_modules?.includes('endometriosis_test')
  // Check if Blog module is enabled
  const showBlog = doctor?.enabled_modules?.includes('blog')

  return (
    <>
      <nav
        className={`
          sticky top-0 z-50 transition-colors duration-200 
          ${containerShadow ? 'shadow-lg border-b-4 border-white dark:border-gray-800' : 'border-b border-gray-200 dark:border-gray-800'} 
          ${!effectiveBgColor ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md' : ''}
        `}
        style={{
          ...(effectiveBgColor ? { backgroundColor: effectiveBgColor } : {})
        }}
      >
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center py-2 md:py-0 md:h-16 space-y-2 md:space-y-0">

            {/* Top Row: Logo, Name, Mobile Menu Button */}
            <div className="flex w-full md:w-auto justify-between items-center">
              <div className="flex items-center space-x-2 md:space-x-3">
                {doctor?.logo_url && (
                  <img
                    src={getImageUrl(doctor.logo_url)}
                    alt={`${doctor.nombre_completo} logo`}
                    className="h-8 md:h-10 w-auto object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none'
                    }}
                  />
                )}
                {doctor?.nombre_completo && (
                  <h1
                    className="text-sm md:text-xl font-semibold text-gray-900 dark:text-white leading-tight truncate max-w-[200px] md:max-w-none"
                  >
                    {doctor.nombre_completo}
                  </h1>
                )}
              </div>

              {/* Mobile Menu Button - Moved to Top Row */}
              <div className="md:hidden flex items-center">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="text-gray-700 hover:text-gray-900 focus:outline-none dark:text-gray-300 dark:hover:text-white p-1"
                >
                  {isMenuOpen ? (
                    <FiX className="h-6 w-6" />
                  ) : (
                    <FiMenu className="h-6 w-6" />
                  )}
                </button>
              </div>
            </div>

            {/* Second Row (Mobile Only): Action Buttons */}
            <div className="flex md:hidden w-full items-center justify-between space-x-2 pb-1">
              {/* Cycle Predictor Button */}
              <button
                onClick={() => {
                  if (isAuthenticated) {
                    navigate('/cycle/dashboard')
                  } else {
                    setIsCycleModalOpen(true)
                  }
                }}
                className="flex-1 flex items-center justify-center space-x-1 px-2 py-1.5 rounded-lg border-2 transition-colors"
                style={{ borderColor: `${primaryColor}33`, color: primaryColor }}
              >
                <FiActivity className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Tu ciclo</span>
              </button>

              {/* Endometriosis Test Button (if enabled) */}
              {showEndoTest && (
                <button
                  onClick={() => setIsTestModalOpen(true)}
                  className="flex-1 flex items-center justify-center space-x-1 px-2 py-1.5 rounded-lg border-2 transition-colors bg-pink-50 dark:bg-pink-900/20"
                  style={{ borderColor: 'rgb(236 72 153 / 0.3)', color: 'rgb(236 72 153)' }}
                >
                  <span className="text-xs font-medium">Test Endometriosis</span>
                </button>
              )}
            </div>

            {/* Desktop Only Cycle Button (hidden on mobile, shown in flex row on desktop) */}
            <div className="hidden md:flex items-center">
              <button
                onClick={() => {
                  if (isAuthenticated) {
                    navigate('/cycle/dashboard')
                  } else {
                    setIsCycleModalOpen(true)
                  }
                }}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border-2 border-primary/20 hover:border-primary/40 transition-colors"
                style={{ borderColor: `${primaryColor}33`, color: primaryColor }}
              >
                <FiActivity className="w-4 h-4" />
                <span className="text-sm font-medium">Tu ciclo</span>
              </button>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a
                href="#sobre-mi"
                className="text-gray-700 hover:opacity-75 transition dark:text-gray-300 dark:hover:text-white"
              >
                Sobre Mí
              </a>
              <a
                href="#servicios"
                className="text-gray-700 hover:opacity-75 transition dark:text-gray-300 dark:hover:text-white"
              >
                Servicios
              </a>
              <a
                href="#testimonios"
                className="text-gray-700 hover:opacity-75 transition dark:text-gray-300 dark:hover:text-white"
              >
                Testimonios
              </a>
              <a
                href="#galeria"
                className="text-gray-700 hover:opacity-75 transition dark:text-gray-300 dark:hover:text-white"
              >
                Galería
              </a>
              <a
                href="#ubicaciones"
                className="text-gray-700 hover:opacity-75 transition dark:text-gray-300 dark:hover:text-white"
              >
                Ubicaciones
              </a>

              <a
                href="#preguntas-frecuentes"
                className="text-gray-700 hover:opacity-75 transition dark:text-gray-300 dark:hover:text-white"
              >
                FAQ
              </a>

              {
                showBlog && (
                  <MegaMenu doctorSlug={doctor?.slug_url} primaryColor={primaryColor} />
                )
              }

              {/* Authentication Logic */}
              {isAuthenticated ? (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => logout()}
                    className="text-sm font-medium text-red-600 hover:text-red-700 transition"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg text-white font-semibold hover:opacity-90 transition shadow-md hover:shadow-lg"
                  style={{ backgroundColor: 'rgb(174, 55, 103)' }}
                >
                  <FiLogIn className="w-5 h-5" />
                  <span>Login</span>
                </button>
              )}
            </div >

            {/* Desktop Mobile Menu Button Placeholer (Removed from here, moved up) */}
          </div >

          {/* Mobile Menu */}
          {
            isMenuOpen && (
              <div className="md:hidden py-4 space-y-3">
                <a
                  href="#sobre-mi"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sobre Mí
                </a>
                <a
                  href="#servicios"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Servicios
                </a>
                <a
                  href="#testimonios"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Testimonios
                </a>
                <a
                  href="#galeria"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Galería
                </a>
                <a
                  href="#ubicaciones"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Ubicaciones
                </a>
                <a
                  href="#preguntas-frecuentes"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                  onClick={() => setIsMenuOpen(false)}
                >
                  FAQ
                </a>
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/dashboard"
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Panel Admin
                    </Link>
                    <button
                      onClick={() => {
                        logout()
                        setIsMenuOpen(false)
                      }}
                      className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-gray-800"
                    >
                      Cerrar Sesión
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setIsLoginModalOpen(true)
                      setIsMenuOpen(false)
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    Iniciar Sesión
                  </button>
                )}
                {/* Blog removed - now in bottom nav */}
                {showEndoTest && (
                  <button
                    onClick={() => {
                      setIsTestModalOpen(true)
                      setIsMenuOpen(false)
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    Test Endometriosis
                  </button>
                )}
                <button
                  onClick={() => {
                    onAppointmentClick()
                    setIsMenuOpen(false)
                  }}
                  className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  Agendar Cita
                </button>
              </div>
            )
          }
        </div >
        <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
        <CyclePredictorModal open={isCycleModalOpen} onOpenChange={setIsCycleModalOpen} />
        {showEndoTest && (
          <EndometriosisTestModal
            isOpen={isTestModalOpen}
            onClose={() => setIsTestModalOpen(false)}
          />
        )}
      </nav >
    </>
  )
}
