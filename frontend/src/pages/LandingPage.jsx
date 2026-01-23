import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import HeroSlider from '../components/features/HeroSlider'
import LoginModal from '../components/features/LoginModal'

export default function LandingPage() {
  const { isAuthenticated, user, logout } = useAuthStore()
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-indigo-600">GynSys</h1>
            </div>
            <nav className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <span className="text-gray-700 text-sm font-medium hidden sm:block">
                    {user?.email}
                  </span>
                  <Link
                    to={user?.role === 'admin' ? '/admin' : '/dashboard'}
                    className="text-indigo-600 hover:text-indigo-800 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    {user?.role === 'admin' ? 'Ir al Panel Admin' : 'Ir al Dashboard'}
                  </Link>
                  <button
                    onClick={() => logout()}
                    className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
                  >
                    Cerrar Sesión
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsLoginModalOpen(true)}
                    className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Iniciar Sesión
                  </button>
                </>
              )}
            </nav>
            <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold text-gray-900 sm:text-6xl">
            Tu Clínica Digital
            <span className="text-indigo-600"> en Minutos</span>
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
            GynSys te permite crear tu propia página web profesional personalizable
            con herramientas integradas para gestionar citas, blog médico y pre-consultas.
          </p>
          <div className="mt-10 flex justify-center space-x-4">
            <a
              href="#planes"
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-indigo-700"
            >
              Ver Planes y Registrarse
            </a>
          </div>
        </div>

        {/* Hero Slider - Imágenes destacadas */}
        <div className="flex justify-center items-center w-full">
          <HeroSlider />
        </div>

        {/* Features Section */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-indigo-600 text-4xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Gestión de Citas
            </h3>
            <p className="text-gray-600">
              Sistema completo de agendamiento que tus pacientes pueden usar directamente desde tu página.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-indigo-600 text-4xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Pre-consultas Digitales
            </h3>
            <p className="text-gray-600">
              Formularios digitales que tus pacientes completan antes de la visita.
            </p>
          </div>
        </div>

        {/* Hero Slider - Imágenes destacadas */}
        <div className="flex justify-center items-center w-full">
          <HeroSlider />
        </div>

        {/* Features Section */}
        <div id="planes" className="mt-24">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-12">
            Elige el plan perfecto para ti
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Plan Básico */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-900">Plan Básico</h3>
                <p className="mt-4 text-gray-500">Para profesionales independientes</p>
                <p className="mt-8">
                  <span className="text-4xl font-extrabold text-gray-900">$29.99</span>
                  <span className="text-base font-medium text-gray-500">/mes</span>
                </p>
                <ul className="mt-6 space-y-4">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span className="text-gray-600">Testimonios (max 10)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span className="text-gray-600">Galería (max 20)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span className="text-gray-600">FAQs (max 15)</span>
                  </li>
                </ul>
                <div className="mt-8">
                  <Link
                    to="/register?plan=1"
                    className="block w-full bg-indigo-600 text-white text-center px-4 py-2 rounded-md font-medium hover:bg-indigo-700"
                  >
                    Seleccionar Plan
                  </Link>
                </div>
              </div>
            </div>

            {/* Plan Profesional */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-indigo-500 transform scale-105">
              <div className="bg-indigo-500 text-white text-center py-1 text-sm font-bold uppercase tracking-wide">
                Más Popular
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-900">Plan Profesional</h3>
                <p className="mt-4 text-gray-500">Para clínicas en crecimiento</p>
                <p className="mt-8">
                  <span className="text-4xl font-extrabold text-gray-900">$49.99</span>
                  <span className="text-base font-medium text-gray-500">/mes</span>
                </p>
                <ul className="mt-6 space-y-4">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span className="text-gray-600">Testimonios (max 15)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span className="text-gray-600">Galería (max 30)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span className="text-gray-600">FAQs (max 15)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span className="text-gray-600">Dashboard de Analíticas</span>
                  </li>
                </ul>
                <div className="mt-8">
                  <Link
                    to="/register?plan=2"
                    className="block w-full bg-indigo-600 text-white text-center px-4 py-2 rounded-md font-medium hover:bg-indigo-700"
                  >
                    Seleccionar Plan
                  </Link>
                </div>
              </div>
            </div>

            {/* Plan Premium */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-900">Plan Premium</h3>
                <p className="mt-4 text-gray-500">Para clínicas establecidas</p>
                <p className="mt-8">
                  <span className="text-4xl font-extrabold text-gray-900">$79.99</span>
                  <span className="text-base font-medium text-gray-500">/mes</span>
                </p>
                <ul className="mt-6 space-y-4">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span className="text-gray-600">Todo Ilimitado</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span className="text-gray-600">Dominio Personalizado</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span className="text-gray-600">Soporte Prioritario</span>
                  </li>
                </ul>
                <div className="mt-8">
                  <Link
                    to="/register?plan=3"
                    className="block w-full bg-indigo-600 text-white text-center px-4 py-2 rounded-md font-medium hover:bg-indigo-700"
                  >
                    Seleccionar Plan
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-600">
            © 2024 GynSys. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}

