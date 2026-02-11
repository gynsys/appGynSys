import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import Button from '../common/Button'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { toast } from 'sonner'
import { useGoogleLogin } from '@react-oauth/google'

export default function CycleAuthDialog({ open, onOpenChange, initialView = 'register' }) {
    const [authMode, setAuthMode] = useState(initialView) // 'register', 'login', 'forgot-password'
    const [registerData, setRegisterData] = useState({
        nombre_completo: '',
        email: '',
        password: ''
    })
    const [isLoadingRegister, setIsLoadingRegister] = useState(false)
    const [forgotEmail, setForgotEmail] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    // Reset mode when dialog opens
    useEffect(() => {
        if (open) {
            setAuthMode(initialView)
            setShowPassword(false)
        }
    }, [open, initialView])

    // We assume default slug 'mariel-herrera' for now as in the original code, 
    // or we could pass it as prop if it varies.
    const slug = 'mariel-herrera'
    const { registerCycleUser, loginCycleUser, requestCyclePasswordReset, loginWithGoogle } = useAuthStore()

    const handleGoogleSuccess = async (tokenResponse) => {
        setIsLoadingRegister(true)
        try {
            await loginWithGoogle(tokenResponse.access_token)
            handleAuthSuccess()
        } catch (err) {
            console.error("Google Login error:", err)
            toast.error("Error al autenticar con Google")
        } finally {
            setIsLoadingRegister(false)
        }
    }

    const googleLogin = useGoogleLogin({
        onSuccess: handleGoogleSuccess,
        onError: () => toast.error('Error al iniciar sesión con Google'),
    })

    const handleRegisterSubmit = async (e) => {
        e.preventDefault()

        if (!slug) {
            toast.error("Error crítico: No hay doctor asociado.")
            return
        }

        setIsLoadingRegister(true)
        try {
            await registerCycleUser({
                ...registerData,
                doctor_slug: slug
            })
            // console.log("Registration successful.")
            handleAuthSuccess()
        } catch (error) {
            console.error("Registration error:", error)
            const errorMsg = error.response?.data?.detail || "Error al registrarse. Intenta nuevamente."
            toast.error(errorMsg)
        } finally {
            setIsLoadingRegister(false)
        }
    }

    const handleLoginSubmit = async (e) => {
        e.preventDefault()
        setIsLoadingRegister(true)
        try {
            await loginCycleUser(registerData.email, registerData.password)
            handleAuthSuccess()
        } catch (error) {
            console.error("Login error:", error)
            toast.error("Error al iniciar sesión. Verifica tus credenciales.")
        } finally {
            setIsLoadingRegister(false)
        }
    }

    const handleForgotPasswordSubmit = async (e) => {
        e.preventDefault()
        setIsLoadingRegister(true)
        try {
            await requestCyclePasswordReset(forgotEmail)
            toast.success("Si el correo está registrado, recibirás un enlace de recuperación.")
            setAuthMode('login')
        } catch (error) {
            console.error("Recovery error:", error)
            toast.error("Error al solicitar recuperación.")
        } finally {
            setIsLoadingRegister(false)
        }
    }

    const handleAuthSuccess = () => {
        toast.success("¡Bienvenida!")
        setRegisterData({
            nombre_completo: '',
            email: '',
            password: ''
        })
        onOpenChange(false)
    }

    // Common input classes for dark mode visibility
    const inputClass = "bg-white dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md w-full max-w-[95vw] rounded-xl dark:bg-gray-900 dark:border-gray-700 duration-[1100ms]">
                <DialogHeader>
                    <DialogTitle className="dark:text-gray-100">
                        {authMode === 'login'
                            ? 'Iniciar Sesión'
                            : authMode === 'forgot-password'
                                ? 'Recuperar Contraseña'
                                : 'Crear Cuenta'}
                    </DialogTitle>
                    <DialogDescription className="dark:text-gray-400">
                        {authMode === 'login'
                            ? 'Accede a tu cuenta para ver tu historial.'
                            : authMode === 'forgot-password'
                                ? 'Te ayudaremos a recuperar el acceso a tu cuenta.'
                                : 'Crea una cuenta para recibir alertas sobre tu ciclo y guardar tu historial.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-2">
                    {authMode === 'register' && (
                        <form onSubmit={handleRegisterSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="nombre_completo" className="dark:text-gray-300">Nombre Completo</Label>
                                <Input
                                    id="nombre_completo"
                                    placeholder="Tu nombre"
                                    value={registerData.nombre_completo}
                                    onChange={(e) => setRegisterData(prev => ({ ...prev, nombre_completo: e.target.value }))}
                                    required
                                    className={inputClass}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email" className="dark:text-gray-300">Correo Electrónico</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="tu@email.com"
                                    value={registerData.email}
                                    onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                                    required
                                    className={inputClass}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password" className="dark:text-gray-300">Contraseña</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Crear contraseña segura"
                                        value={registerData.password}
                                        onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                                        required
                                        className={`${inputClass} pr-10`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                            <Button
                                type="submit"
                                className="w-full rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white border-0 hover:opacity-90"
                                disabled={isLoadingRegister}
                            >
                                {isLoadingRegister ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Registrarse
                            </Button>

                            {/* Google Login Section */}
                            <div className="mt-4">
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">O continúa con</span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => googleLogin()}
                                    className="mt-4 w-full flex items-center justify-center gap-3 px-4 py-2 border rounded-full transition-all duration-200 bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-transparent dark:border-gray-600 dark:text-gray-300 dark:hover:bg-white/5"
                                >
                                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    <span className="font-medium">Google</span>
                                </button>
                            </div>

                            <div className="text-center text-sm text-muted-foreground mt-2">
                                ¿Ya tienes cuenta?{' '}
                                <button type="button" onClick={() => setAuthMode('login')} className="text-pink-600 hover:underline font-medium">
                                    Inicia sesión
                                </button>
                            </div>
                        </form>
                    )}

                    {authMode === 'login' && (
                        <form onSubmit={handleLoginSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="login-email" className="dark:text-gray-300">Correo Electrónico</Label>
                                <Input
                                    id="login-email"
                                    type="email"
                                    placeholder="tu@email.com"
                                    value={registerData.email}
                                    onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                                    required
                                    className={inputClass}
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="login-password" className="dark:text-gray-300">Contraseña</Label>
                                    <button
                                        type="button"
                                        onClick={() => setAuthMode('forgot-password')}
                                        className="text-xs text-pink-600 hover:underline dark:text-pink-400"
                                    >
                                        ¿Olvidaste tu contraseña?
                                    </button>
                                </div>
                                <div className="relative">
                                    <Input
                                        id="login-password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Ingresa tu contraseña"
                                        value={registerData.password}
                                        onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                                        required
                                        className={`${inputClass} pr-10`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                            <Button
                                type="submit"
                                className="w-full rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white border-0 hover:opacity-90"
                                disabled={isLoadingRegister}
                            >
                                {isLoadingRegister ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Iniciar Sesión
                            </Button>

                            {/* Google Login Section */}
                            <div className="mt-4">
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">O continúa con</span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => googleLogin()}
                                    className="mt-4 w-full flex items-center justify-center gap-3 px-4 py-2 border rounded-full transition-all duration-200 bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-transparent dark:border-gray-600 dark:text-gray-300 dark:hover:bg-white/5"
                                >
                                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    <span className="font-medium">Google</span>
                                </button>
                            </div>

                            <div className="text-center text-sm text-muted-foreground mt-2">
                                ¿No tienes cuenta?{' '}
                                <button type="button" onClick={() => setAuthMode('register')} className="text-pink-600 hover:underline font-medium dark:text-pink-400">
                                    Regístrate
                                </button>
                            </div>
                        </form>
                    )}

                    {authMode === 'forgot-password' && (
                        <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                            <div className="text-center mb-4">
                                <p className="text-sm text-muted-foreground dark:text-gray-400">
                                    Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="forgot-email" className="dark:text-gray-300">Correo Electrónico</Label>
                                <Input
                                    id="forgot-email"
                                    type="email"
                                    placeholder="tu@email.com"
                                    value={forgotEmail}
                                    onChange={(e) => setForgotEmail(e.target.value)}
                                    required
                                    className={inputClass}
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white border-0 hover:opacity-90"
                                disabled={isLoadingRegister}
                            >
                                {isLoadingRegister ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Enviar Enlace
                            </Button>
                            <div className="text-center text-sm text-muted-foreground mt-2">
                                <button type="button" onClick={() => setAuthMode('login')} className="text-pink-600 hover:underline font-medium dark:text-pink-400">
                                    Volver al inicio de sesión
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
