import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import Button from '../common/Button'
import { Loader2, Bell } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { toast } from 'sonner'

export default function CycleAuthDialog({ open, onOpenChange, initialView = 'register' }) {
    const [authMode, setAuthMode] = useState(initialView) // 'register', 'login', 'forgot-password'
    const [registerData, setRegisterData] = useState({
        nombre_completo: '',
        email: '',
        password: ''
    })
    const [isLoadingRegister, setIsLoadingRegister] = useState(false)
    const [forgotEmail, setForgotEmail] = useState('')

    // Reset mode when dialog opens
    useEffect(() => {
        if (open) {
            setAuthMode(initialView)
        }
    }, [open, initialView])

    // We assume default slug 'mariel-herrera' for now as in the original code, 
    // or we could pass it as prop if it varies.
    const slug = 'mariel-herrera'
    const { registerCycleUser, loginCycleUser, requestCyclePasswordReset } = useAuthStore()

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
            <DialogContent className="sm:max-w-md dark:bg-gray-900 dark:border-gray-700 duration-[1100ms]">
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
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Crear contraseña segura"
                                    value={registerData.password}
                                    onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
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
                                Registrarse
                            </Button>
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
                                <Input
                                    id="login-password"
                                    type="password"
                                    placeholder="Ingresa tu contraseña"
                                    value={registerData.password}
                                    onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
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
                                Iniciar Sesión
                            </Button>
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
