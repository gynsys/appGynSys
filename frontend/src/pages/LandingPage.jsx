import { Link } from 'react-router-dom'

export default function LandingPage() {
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
              <Link
                to="/login"
                className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Iniciar Sesión
              </Link>
              <Link
                to="/register"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
              >
                Registrarse
              </Link>
            </nav>
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
            <Link
              to="/register"
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-indigo-700"
            >
              Comenzar Ahora
            </Link>
            <Link
              to="/pricing"
              className="bg-white text-indigo-600 px-8 py-3 rounded-lg text-lg font-medium border-2 border-indigo-600 hover:bg-indigo-50"
            >
              Ver Planes
            </Link>
          </div>
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
            <div className="text-indigo-600 text-4xl mb-4">✍️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Blog con IA
            </h3>
            <p className="text-gray-600">
              Genera y publica artículos médicos con la ayuda de inteligencia artificial.
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

