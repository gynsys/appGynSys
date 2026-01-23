import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth'

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams()
    const token = searchParams.get('token')
    const type = searchParams.get('type') // 'cycle_user' or undefined
    const navigate = useNavigate()
    const { resetPassword, resetCyclePassword } = useAuth()

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [status, setStatus] = useState('idle') // idle, loading, success, error
    const [message, setMessage] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (password !== confirmPassword) {
            setStatus('error')
            setMessage('Las contraseñas no coinciden')
            return
        }

        if (password.length < 8) {
            setStatus('error')
            setMessage('La contraseña debe tener al menos 8 caracteres')
            return
        }

        setStatus('loading')
        setMessage('')

        try {
            if (type === 'cycle_user') {
                await resetCyclePassword(token, password)
            } else {
                await resetPassword(token, password)
            }
            setStatus('success')
            setMessage('Tu contraseña ha sido actualizada correctamente.')

            // Redirect based on type
            if (type === 'cycle_user') {
                // For cycle users, maybe we don't redirect to /login but show a message?
                // Or redirect to home page where they can open the modal?
                // Currently /login is for doctors.
                // Let's redirect to home page after 3s
                setTimeout(() => navigate('/'), 3000)
            } else {
                setTimeout(() => navigate('/login'), 3000)
            }
        } catch (error) {
            console.error(error)
            setStatus('error')
            setMessage(error.response?.data?.detail || 'Error al restablecer contraseña. El enlace puede haber expirado.')
        }
    }

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full bg-white rounded-lg shadow-lg border-2 border-gray-200 p-8 text-center">
                    <h2 className="text-xl font-bold text-red-600 mb-4">Token inválido</h2>
                    <p className="text-gray-600 mb-6">No se proporcionó un token de recuperación válido.</p>
                    <Link to="/forgot-password" className="text-indigo-600 hover:text-indigo-500 font-medium">
                        Solicitar nuevo enlace
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 p-8 space-y-6">
                    <div>
                        <h2 className="text-center text-3xl font-extrabold text-gray-900">
                            Restablecer Contraseña
                        </h2>
                    </div>

                    {status === 'success' ? (
                        <div className="rounded-md bg-green-50 p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-green-800">{message}</p>
                                    <p className="text-sm text-green-700 mt-2">Redirigiendo al login...</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            {status === 'error' && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                                    {message}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="password" className="sr-only">
                                        Nueva Contraseña
                                    </label>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete="new-password"
                                        required
                                        className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                        placeholder="Nueva Contraseña"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="confirmPassword" className="sr-only">
                                        Confirmar Contraseña
                                    </label>
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type="password"
                                        autoComplete="new-password"
                                        required
                                        className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                        placeholder="Confirmar Contraseña"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={status === 'loading'}
                                    className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                >
                                    {status === 'loading' ? 'Restableciendo...' : 'Cambiar Contraseña'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}
