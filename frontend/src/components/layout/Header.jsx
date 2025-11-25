import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import Button from '../common/Button'

export default function Header() {
  const { isAuthenticated, logout } = useAuthStore()

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <Link to="/" className="text-2xl font-bold text-indigo-600">
            GynSys
          </Link>
          <nav className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Button variant="outline" size="sm" onClick={logout}>
                  Cerrar Sesión
                </Button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Iniciar Sesión
                </Link>
                <Link to="/register">
                  <Button size="sm">Registrarse</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}

