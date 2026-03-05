import { useState, useRef, useEffect } from 'react'
import { getImageUrl } from '../../lib/imageUtils'
import { Link, useNavigate } from 'react-router-dom'
import { FiMenu, FiX, FiLogIn, FiBarChart2, FiActivity, FiUserPlus, FiUser, FiFileText, FiLogOut, FiSettings } from 'react-icons/fi'
import MegaMenu from './MegaMenu'
import { useAuthStore } from '../../store/authStore'
import usePWAStore from '../../store/pwaStore'
import PWAInstallButton from '../common/PWAInstallButton'

export default function Navbar({ doctor, primaryColor = '#4F46E5', onAppointmentClick, onTestClick, onCycleClick, onLoginClick, onRegisterClick, containerShadow = true, containerBgColor }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef(null)

  // Close user menu when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const { isAuthenticated, user, logout } = useAuthStore()
  const { isStandalone } = usePWAStore()
  const navigate = useNavigate()

  // Usage: if containerBgColor is explicitly passed (even null), use it. Only fallback to doctor.theme... if undefined.
  // In Dark Mode, parent passes 'null', so effectiveBgColor becomes 'null', preventing the legacy color override.
  const effectiveBgColor = containerBgColor !== undefined ? containerBgColor : doctor?.theme_container_bg_color

  // Check if Endometriosis Test module is enabled
  const showEndoTest = doctor?.enabled_modules?.includes('endometriosis_test')
  // Check if Blog module is enabled
  const showBlog = doctor?.enabled_modules?.includes('blog')

  // Calculate Dark Mode based on doctor's template
  // This allows passing the explicit theme to modals instead of relying on system preference
  const isDarkTheme = doctor?.design_template === 'dark'

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
        <div className="max-w-[1260px] mx-auto px-2 sm:px-6 lg:px-8">
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

              {/* Mobile Menu & Admin Actions */}
              <div className="md:hidden flex items-center space-x-2">
                {isAuthenticated && (user?.slug_url === doctor?.slug_url || user?.id === doctor?.id) && (
                  <Link
                    to="/dashboard"
                    className="p-1.5 rounded-lg text-white shadow-sm"
                    style={{ backgroundColor: primaryColor }}
                    title="Panel Admin"
                  >
                    <FiBarChart2 className="w-5 h-5" />
                  </Link>
                )}
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
            {/* Second Row (Mobile Only): Action Buttons Hub */}
            <div className="flex md:hidden w-full flex-col space-y-2 pb-2 px-1">
              <div className="flex w-full items-center justify-between space-x-2">
                {/* Cycle Predictor Button */}
                <button
                  onClick={onCycleClick}
                  className="flex-1 flex items-center justify-center space-x-1 px-2 py-1.5 rounded-lg border-2 transition-colors"
                  style={{ borderColor: `${primaryColor}33`, color: primaryColor }}
                >
                  <FiActivity className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">Mi ciclo</span>
                </button>

                {/* Endometriosis Test Button (if enabled) */}
                {showEndoTest && (
                  <button
                    onClick={onTestClick}
                    className="flex-1 flex items-center justify-center space-x-1 px-2 py-1.5 rounded-lg border-2 transition-colors bg-pink-50 dark:bg-pink-900/20"
                    style={{ borderColor: 'rgb(236 72 153 / 0.3)', color: 'rgb(236 72 153)' }}
                  >
                    <span className="text-xs font-medium">Test Endometriosis</span>
                  </button>
                )}
              </div>

              {/* PWA Install Button - Hidden in Standalone Mode */}
              {!isStandalone && (
                <div className="w-full">
                  <PWAInstallButton isFloating={true} fullWidth={true} />
                </div>
              )}
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
                  {(user?.slug_url === doctor?.slug_url || user?.id === doctor?.id) && (
                    <Link
                      to="/dashboard"
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 hover:scale-105"
                      style={{ backgroundColor: primaryColor }}
                      title="Panel Admin"
                    >
                      <FiBarChart2 className="w-4 h-4" />
                      <span>Panel Admin</span>
                    </Link>
                  )}
                  <button
                    onClick={() => logout()}
                    className="text-sm font-medium text-red-600 hover:text-red-700 transition"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => onLoginClick ? onLoginClick() : null}
                  className="flex items-center space-x-1.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md group"
                  title="Iniciar sesión"
                >
                  <FiLogIn className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium">Login</span>
                </button>
              )}

              {/* User icon: dropdown if patient logged in, register if not authenticated */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => {
                    if (isAuthenticated && !(user?.slug_url === doctor?.slug_url || user?.id === doctor?.id)) {
                      setShowUserMenu(v => !v)
                    } else if (!isAuthenticated) {
                      onRegisterClick && onRegisterClick()
                    }
                  }}
                  className="p-2 rounded-lg transition-all hover:scale-110"
                  style={{ color: isAuthenticated && !(user?.slug_url === doctor?.slug_url || user?.id === doctor?.id) ? primaryColor : undefined }}
                  onMouseEnter={e => { if (!isAuthenticated) e.currentTarget.style.backgroundColor = primaryColor; e.currentTarget.style.color = '#fff' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = isAuthenticated && !(user?.slug_url === doctor?.slug_url || user?.id === doctor?.id) ? primaryColor : '' }}
                  title={isAuthenticated ? 'Mi cuenta' : 'Crear cuenta'}
                >
                  {isAuthenticated && !(user?.slug_url === doctor?.slug_url || user?.id === doctor?.id)
                    ? <FiUser className="w-5 h-5" />
                    : <FiUserPlus className="w-5 h-5" />
                  }
                </button>

                {/* Patient user dropdown */}
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* User header */}
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                      <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">Cuenta</p>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{user?.email || user?.nombre_completo}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        to="/cycle/dashboard"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <FiFileText className="w-4 h-4 text-gray-400" />
                        Mi Historial
                      </Link>
                      <Link
                        to="/cycle/profile"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <FiSettings className="w-4 h-4 text-gray-400" />
                        Mi Usuario
                      </Link>
                    </div>
                    <div className="border-t border-gray-100 dark:border-gray-700 py-1">
                      <button
                        onClick={() => { logout(); setShowUserMenu(false) }}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <FiLogOut className="w-4 h-4" />
                        Cerrar Sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
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
                  <button
                    onClick={() => {
                      logout()
                      setIsMenuOpen(false)
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-gray-800"
                  >
                    Cerrar Sesión
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (onLoginClick) onLoginClick()
                      setIsMenuOpen(false)
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    Iniciar Sesión
                  </button>
                )}

              </div>
            )
          }
        </div >

      </nav >
    </>
  )
}
