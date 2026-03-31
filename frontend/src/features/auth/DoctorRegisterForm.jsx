import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import { Label } from '../../components/ui/label'
import { User, Mail, Lock, Loader2, Play, Eye, EyeOff } from 'lucide-react'
import LoginModal from '../../components/features/LoginModal'

export default function DoctorRegisterForm() {
    const { register } = useAuthStore()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
    const [formData, setFormData] = useState({
        nombre_completo: '',
        email: '',
        password: '',
        confirmPassword: '',
        plan_id: 1, // Default plan
    })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)

    useEffect(() => {
        const plan = searchParams.get('plan')
        if (plan) {
            setFormData(prev => ({ ...prev, plan_id: parseInt(plan) }))
        }
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

        setLoading(true)

        try {
            await register({
                email: formData.email,
                password: formData.password,
                nombre_completo: formData.nombre_completo,
                plan_id: formData.plan_id
            })
            // Set success state instead of immediate redirect
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
                <div className="absolute top-0 right-0 w-1/2 h-full bg-indigo-50/50 skew-x-12 translate-x-20 z-0"></div>
                <div className="w-full max-w-lg relative z-10">
                    <Card className="shadow-2xl border-gray-100 rounded-[40px] overflow-hidden p-8 text-center animate-in fade-in zoom-in duration-500">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 mb-4">¡Información enviada con éxito!</h2>
                        <div className="space-y-4 text-gray-600 font-medium">
                            <p>Tu solicitud ha sido recibida y está siendo procesada por nuestro equipo técnico.</p>
                            <p className="bg-indigo-50 p-4 rounded-2xl text-indigo-700 text-sm">
                                📧 Recibirás un correo electrónico de confirmación una vez que tu cuenta sea aprobada (generalmente en menos de 24 horas).
                            </p>
                            <p className="text-sm">Serás redirigido a la página principal en unos segundos...</p>
                        </div>
                        <button
                            onClick={() => navigate('/')}
                            className="mt-8 w-full h-14 rounded-2xl font-black bg-indigo-600 text-white shadow-xl hover:bg-indigo-700 transition-all"
                        >
                            Volver al Inicio
                        </button>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden px-4 py-8">
            {/* Abstract Background patterns */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-indigo-50/50 skew-x-12 translate-x-20 z-0"></div>

            <div className="w-full max-w-lg relative z-10">
                {/* Logo */}
                <div className="flex items-center justify-center gap-2 mb-10">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-100">
                        <span className="text-white font-black text-2xl">G</span>
                    </div>
                    <span className="text-3xl font-black text-gray-900 tracking-tight">
                        GynSys <span className="text-indigo-600 text-sm font-bold uppercase tracking-widest ml-1">SaaS</span>
                    </span>
                </div>

                <Card className="shadow-2xl border-gray-100 rounded-[40px] overflow-hidden">
                    <div className="h-2 bg-indigo-600 w-full"></div>
                    <CardHeader className="space-y-2 text-center pt-10 pb-6">
                        <CardTitle className="text-4xl font-black text-gray-900">
                            Crea tu clínica digital
                        </CardTitle>
                        <CardDescription className="text-lg text-gray-500 font-medium">
                            Únete a la red de ginecólogas más moderna.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-8 md:px-12">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="bg-red-50 border border-red-100 text-red-600 text-sm p-4 rounded-2xl text-center font-bold">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="nombre_completo" className="text-sm font-black text-gray-700 ml-1">
                                    Nombre Completo
                                </Label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                                    <input
                                        id="nombre_completo"
                                        name="nombre_completo"
                                        type="text"
                                        required
                                        placeholder="Dra. María Pérez"
                                        value={formData.nombre_completo}
                                        onChange={handleChange}
                                        className="w-full pl-12 pr-4 h-14 rounded-2xl bg-gray-50 border border-transparent focus:border-indigo-200 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none text-gray-800 font-medium"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-black text-gray-700 ml-1">
                                    Correo Profesional
                                </Label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        required
                                        placeholder="doctora@ejemplo.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full pl-12 pr-4 h-14 rounded-2xl bg-gray-50 border border-transparent focus:border-indigo-200 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none text-gray-800 font-medium"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-sm font-black text-gray-700 ml-1">
                                        Contraseña
                                    </Label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                                        <input
                                            id="password"
                                            name="password"
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            placeholder="••••••••"
                                            value={formData.password}
                                            onChange={handleChange}
                                            className="w-full pl-12 pr-12 h-14 rounded-2xl bg-gray-50 border border-transparent focus:border-indigo-200 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none text-gray-800 font-medium"
                                        />
                                        <button
                                            type="button"
                                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-indigo-600 transition-colors"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword" className="text-sm font-black text-gray-700 ml-1">
                                        Repetir
                                    </Label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                                        <input
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            required
                                            placeholder="••••••••"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            className="w-full pl-12 pr-12 h-14 rounded-2xl bg-gray-50 border border-transparent focus:border-indigo-200 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none text-gray-800 font-medium"
                                        />
                                        <button
                                            type="button"
                                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-indigo-600 transition-colors"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-14 rounded-2xl text-lg font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-200 hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex items-center justify-center"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Configurando tu sitio...
                                    </>
                                ) : (
                                    "Empezar ahora"
                                )}
                            </button>
                        </form>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-6 pt-4 pb-10">
                        <div className="text-center text-sm text-gray-500 font-bold">
                            ¿Ya tienes una cuenta GynSys?{" "}
                            <button
                                onClick={() => setIsLoginModalOpen(true)}
                                className="text-indigo-600 hover:text-indigo-700 font-black hover:underline underline-offset-4"
                            >
                                Inicia sesión aquí
                            </button>
                        </div>
                    </CardFooter>
                </Card>

                <p className="text-center mt-8 text-gray-400 text-xs font-medium px-10">
                    Al registrarte, aceptas nuestros términos de servicio y política de privacidad diseñados para la protección de datos médicos.
                </p>
            </div>
            <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
        </div >
    )
}
