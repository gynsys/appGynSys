import { useState } from 'react'

export default function Navbar({ doctor, primaryColor = '#4F46E5', onAppointmentClick }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <>
      <nav 
        className="bg-white shadow-lg sticky top-0 z-50"
        style={{ borderBottom: `3px solid ${primaryColor}` }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Doctor Name */}
            <div className="flex items-center space-x-4">
              {doctor?.logo_url && (
                <img
                  src={doctor.logo_url.startsWith('http') ? doctor.logo_url : `http://localhost:8000${doctor.logo_url}`}
                  alt={`${doctor.nombre_completo} logo`}
                  className="h-12 w-auto object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none'
                  }}
                />
              )}
              {doctor?.nombre_completo && (
                <h1 
                  className="text-xl md:text-2xl font-semibold text-gray-900"
                >
                  {doctor.nombre_completo}
                </h1>
              )}
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a
                href="#sobre-mi"
                className="text-gray-700 hover:opacity-75 transition"
              >
                Sobre Mí
              </a>
              <a
                href="#servicios"
                className="text-gray-700 hover:opacity-75 transition"
              >
                Servicios
              </a>
              <a
                href="#testimonios"
                className="text-gray-700 hover:opacity-75 transition"
              >
                Testimonios
              </a>
              <a
                href="#galeria"
                className="text-gray-700 hover:opacity-75 transition"
              >
                Galería
              </a>
              <button
                onClick={onAppointmentClick}
                className="px-6 py-2 rounded-lg text-white font-medium hover:opacity-90 transition shadow-md"
                style={{ backgroundColor: primaryColor }}
              >
                Agendar Cita
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-700 hover:text-gray-900 focus:outline-none"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden py-4 space-y-3">
              <a
                href="#sobre-mi"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                onClick={() => setIsMenuOpen(false)}
              >
                Sobre Mí
              </a>
              <a
                href="#servicios"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                onClick={() => setIsMenuOpen(false)}
              >
                Servicios
              </a>
              <a
                href="#testimonios"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                onClick={() => setIsMenuOpen(false)}
              >
                Testimonios
              </a>
              <a
                href="#galeria"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                onClick={() => setIsMenuOpen(false)}
              >
                Galería
              </a>
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
          )}
        </div>
      </nav>
    </>
  )
}

