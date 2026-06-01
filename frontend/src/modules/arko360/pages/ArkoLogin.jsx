import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiLock, FiMail, FiEye, FiEyeOff } from 'react-icons/fi'
import Button from '../../../components/common/Button'
import { useToastStore } from '../../../store/toastStore'
import api from '../../../lib/axios'

export default function ArkoLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { showToast } = useToastStore()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const formData = new URLSearchParams()
      formData.append('username', email)
      formData.append('password', password)

      const response = await api.post('/arko/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })

      const token = response.data.access_token
      // Guardar el token específicamente para Arko (separado de GynSys)
      localStorage.setItem('arko_token', token)
      
      showToast('Bienvenido al panel de Arko 360', 'success')
      navigate('/arko-admin/dashboard')
    } catch (error) {
      console.error('Error logging in:', error)
      showToast('Credenciales incorrectas', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
          Arko 360
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          Panel Administrativo
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-gray-900 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-800">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-gray-300">
                Correo electrónico
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="email"
                  required
                  className="bg-gray-800 border border-gray-700 text-white rounded-md pl-10 block w-full sm:text-sm p-2.5 focus:ring-amber-500 focus:border-amber-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@arko360.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">
                Contraseña
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="bg-gray-800 border border-gray-700 text-white rounded-md pl-10 pr-10 block w-full sm:text-sm p-2.5 focus:ring-amber-500 focus:border-amber-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-white"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <FiEyeOff className="h-5 w-5" />
                  ) : (
                    <FiEye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                variant="primary"
                primaryColor="#f59e0b" // Amber color for Arko
                className="w-full flex justify-center py-2 px-4"
                disabled={loading}
              >
                {loading ? 'Iniciando sesión...' : 'Entrar'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
