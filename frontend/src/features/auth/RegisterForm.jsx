import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import { Label } from '../../components/ui/label'
import { User, Mail, Lock, Loader2, Sparkles, Eye, EyeOff } from 'lucide-react'
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
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  useEffect(() => {
    // Get doctor_slug from URL params
    const doctorSlug = searchParams.get('doctor') || 'mariel-herrera' // Default fallback
    setFormData(prev => ({ ...prev, doctor_slug: doctorSlug }))
  }, [searchParams])

  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        navigate('/')
      }, 8000)
      return () => clearTimeout(timer)
    }
  }, [isSuccess, navigate])

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
      setIsSuccess(true)
    } catch (err) {
      const detail = err.response?.data?.detail
      setError(detail || 'Error al registrar. Por favor intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-pink-50/50 skew-x-12 translate-x-20 z-0"></div>
        <div className="w-full max-w-lg relative z-10">
          <Card className="shadow-2xl border-gray-100 rounded-[40px] overflow-hidden p-8 text-center animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-4">¡Información enviada con éxito!</h2>
            <div className="space-y-4 text-gray-600 font-medium">
              <p>Tu solicitud de registro ha sido recibida correctamente.</p>
              <p className="bg-pink-50 p-4 rounded-2xl text-pink-700 text-sm">
                📧 Recibirás un correo electrónico de confirmación una vez que tu cuenta esté activa.
              </p>
              <p className="text-sm">Serás redirigido a la página principal en unos segundos...</p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="mt-8 w-full h-14 rounded-2xl font-black bg-pink-500 text-white shadow-xl hover:bg-pink-600 transition-all font-sans"
            >
              Volver al Inicio
            </button>
          </Card>
        </div>
      </div>
    )
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
            GynSys <span className="text-sm font-bold opacity-70">App</span>
          </span>
        </div>

        <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/90 rounded-[30px] overflow-hidden">
          <CardHeader className="space-y-1 text-center pb-6">
            <CardTitle className="text-3xl text-gray-800" style={{ fontFamily: 'Playfair Display, serif' }}>
              Crear cuenta
            </CardTitle>
            <CardDescription className="text-base text-gray-600">
              Gestión inteligente para tu salud femenina
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
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-10 h-12 rounded-xl bg-gray-50 border-0 focus:ring-2 focus:ring-pink-500/30 transition-all outline-none text-gray-800"
                    data-testid="register-password-input"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
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
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pl-10 pr-10 h-12 rounded-xl bg-gray-50 border-0 focus:ring-2 focus:ring-pink-500/30 transition-all outline-none text-gray-800"
                    data-testid="register-confirm-password-input"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
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
