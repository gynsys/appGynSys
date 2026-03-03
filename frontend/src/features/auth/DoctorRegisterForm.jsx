import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import { Label } from '../../components/ui/label'
import { User, Mail, Lock, Loader2, Play } from 'lucide-react'
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

    useEffect(() => {
        const plan = searchParams.get('plan')
        if (plan) {
            setFormData(prev => ({ ...prev, plan_id: parseInt(plan) }))
        }
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

        setLoading(true)

        try {
            await register({
                email: formData.email,
                password: formData.password,
                nombre_completo: formData.nombre_completo,
                plan_id: formData.plan_id
            })
            // Successful registration for doctor redirects to dashboard
            navigate('/dashboard')
        } catch (err) {
            const detail = err.response?.data?.detail
            setError(detail || 'Error al registrar. Por favor intenta de nuevo.')
        } finally {
            setLoading(false)
        }
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
                                            type="password"
                                            required
                                            placeholder="••••••••"
                                            value={formData.password}
                                            onChange={handleChange}
                                            className="w-full pl-12 pr-4 h-14 rounded-2xl bg-gray-50 border border-transparent focus:border-indigo-200 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none text-gray-800 font-medium"
                                        />
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
                                            type="password"
                                            required
                                            placeholder="••••••••"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            className="w-full pl-12 pr-4 h-14 rounded-2xl bg-gray-50 border border-transparent focus:border-indigo-200 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none text-gray-800 font-medium"
                                        />
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
