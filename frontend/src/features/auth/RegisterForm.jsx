import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import { Label } from '../../components/ui/label'
import { User, Mail, Lock, Loader2, Sparkles } from 'lucide-react'
import LoginModal from '../../components/features/LoginModal'

export default function RegisterForm() {
  const { registerCycleUser } = useAuthStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    nombre_completo: '',
    email: '',
    password: '',
    confirmPassword: '',
    doctor_slug: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Get doctor_slug from URL params
    const doctorSlug = searchParams.get('doctor') || 'mariel-herrera' // Default fallback
    setFormData(prev => ({ ...prev, doctor_slug: doctorSlug }))
  }, [searchParams])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)

    try {
      await registerCycleUser({
        email: formData.email,
        password: formData.password,
        nombre_completo: formData.nombre_completo,
        doctor_slug: formData.doctor_slug,
      })
      navigate('/cycles/dashboard')
    } catch (err) {
      const detail = err.response?.data?.detail
      setError(detail || 'Error al registrar. Por favor intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 relative overflow-hidden px-4 py-8">
      {/* Background blobs */}
      <div className="absolute w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 -top-20 -left-20 animate-blob"></div>
      <div className="absolute w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 bottom-10 -right-10 animate-blob animation-delay-2000"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <span className="text-3xl font-semibold text-gray-800" style={{ fontFamily: 'Playfair Display, serif' }}>
            GynTrack
          </span>
        </div>

        <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/90">
          <CardHeader className="space-y-1 text-center pb-6">
            <CardTitle className="text-3xl text-gray-800" style={{ fontFamily: 'Playfair Display, serif' }}>
              Crear cuenta
            </CardTitle>
            <CardDescription className="text-base text-gray-600">
              Comienza a llevar el control de tu ciclo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl text-center">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="nombre_completo" className="text-sm font-medium text-gray-700">
                  Nombre
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="nombre_completo"
                    name="nombre_completo"
                    type="text"
                    required
                    placeholder="Tu nombre"
                    value={formData.nombre_completo}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 h-12 rounded-xl bg-gray-50 border-0 focus:ring-2 focus:ring-pink-500/30 transition-all outline-none text-gray-800"
                    data-testid="register-name-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Correo electrónico
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 h-12 rounded-xl bg-gray-50 border-0 focus:ring-2 focus:ring-pink-500/30 transition-all outline-none text-gray-800"
                    data-testid="register-email-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 h-12 rounded-xl bg-gray-50 border-0 focus:ring-2 focus:ring-pink-500/30 transition-all outline-none text-gray-800"
                    data-testid="register-password-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  Confirmar contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 h-12 rounded-xl bg-gray-50 border-0 focus:ring-2 focus:ring-pink-500/30 transition-all outline-none text-gray-800"
                    data-testid="register-confirm-password-input"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl text-base font-medium bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                data-testid="register-submit-btn"
              >
                {loading ? (
                  <>
                    <Loader2 className="inline mr-2 h-4 w-4 animate-spin" />
                    Creando cuenta...
                  </>
                ) : (
                  "Crear Cuenta"
                )}
              </button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pt-0 pb-6">
            <div className="text-center text-sm text-gray-600">
              ¿Ya tienes cuenta?{" "}
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="text-pink-600 hover:text-pink-700 font-medium hover:underline"
                data-testid="register-login-link"
              >
                Iniciar sesión
              </button>
            </div>
          </CardFooter>
        </Card>
      </div>
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </div >
  )
}
