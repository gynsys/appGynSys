import { useNavigate } from 'react-router-dom'
import { getImageUrl } from '../../lib/imageUtils'
import { FiHome, FiMoon, FiSun } from 'react-icons/fi'
import { useDarkMode } from '../../hooks/useDarkMode'

export default function DashboardNavbar({ doctor, primaryColor = '#4F46E5' }) {
  const navigate = useNavigate()
  const [darkMode, toggleDarkMode] = useDarkMode()
  const publicUrl = doctor?.slug_url ? `/dr/${doctor.slug_url}` : '#'

  return (
    <nav
      className="bg-white shadow-lg sticky top-0 z-50 dark:bg-gray-800 dark:border-gray-700 transition-colors duration-200"
      style={{ borderBottom: '3px solid white' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Doctor Name */}
          <div className="flex items-center space-x-4">
            {doctor?.logo_url && (
              <img
                src={getImageUrl(doctor.logo_url)}
                alt={`${doctor.nombre_completo} logo`}
                className="h-12 w-auto object-contain"
                onError={(e) => {
                  e.target.style.display = 'none'
                }}
              />
            )}
            {doctor?.nombre_completo && (
              <h1
                className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white"
              >
                {doctor.nombre_completo}
              </h1>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition"
              title={darkMode ? "Activar modo claro" : "Activar modo oscuro"}
            >
              {darkMode ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
            </button>
            <button
              onClick={() => navigate(publicUrl)}
              className="px-6 py-2 rounded-lg text-white font-medium hover:opacity-90 transition shadow-md"
              style={{ backgroundColor: primaryColor }}
            >
              <div className="flex items-center space-x-2">
                <FiHome className="w-5 h-5" />
                <span>Home</span>
              </div>
            </button>

          </div>
        </div>
      </div>
    </nav>
  )
}

