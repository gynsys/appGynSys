import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from './useAuth'

export default function ForgotPasswordForm({ isModal = false, onBackToLogin, primaryColor }) {
    const { requestPasswordReset } = useAuth()
    const [email, setEmail] = useState('')
    const [status, setStatus] = useState('idle') // idle, loading, success, error
    const [message, setMessage] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setStatus('loading')
        setMessage('')

        try {
            await requestPasswordReset(email)
            setStatus('success')
            setMessage('Si el correo existe, recibirás un enlace de recuperación.')
        } catch (error) {
            setStatus('error')
            setMessage('Hubo un error al procesar tu solicitud.')
        }
    }

    const content = (
        <div className={isModal ? "space-y-6" : "bg-white rounded-lg shadow-lg border-2 border-gray-200 p-8 space-y-6"}>
            <div>
                <h2 className={`text-center text-3xl font-extrabold ${isModal ? 'text-gray-900 dark:text-white' : 'text-gray-900'}`}>
                    Recuperar Contraseña
                </h2>
                <p className={`mt-2 text-center text-sm ${isModal ? 'text-gray-600 dark:text-gray-300' : 'text-gray-600'}`}>
                    Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
                </p>
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
                        </div>
                    </div>
                    <div className="mt-4 text-center">
                        {onBackToLogin ? (
                            <button
                                onClick={onBackToLogin}
                                className="text-indigo-600 hover:text-indigo-500 font-medium"
                                style={primaryColor ? { color: primaryColor } : {}}
                            >
                                Volver al inicio de sesión
                            </button>
                        ) : (
                            <Link to="/login" className="text-indigo-600 hover:text-indigo-500 font-medium">
                                Volver al inicio de sesión
                            </Link>
                        )}
                    </div>
                </div>
            ) : (
                <form className="space-y-6" onSubmit={handleSubmit}>
                    {status === 'error' && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                            {message}
                        </div>
                    )}

                    <div>
                        <label htmlFor="email" className={`sr-only ${isModal ? 'dark:text-gray-300' : ''}`}>
                            Email
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            className={`appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm ${isModal ? 'dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400' : ''}`}
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={status === 'loading'}
                        />
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${!primaryColor ? 'bg-indigo-600 hover:bg-indigo-700' : 'hover:opacity-90 transition shadow-md'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50`}
                            style={primaryColor ? { backgroundColor: primaryColor } : {}}
                        >
                            {status === 'loading' ? 'Enviando...' : 'Enviar enlace'}
                        </button>
                    </div>

                    <div className="flex items-center justify-center">
                        {onBackToLogin ? (
                            <button
                                type="button"
                                onClick={onBackToLogin}
                                className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                                style={primaryColor ? { color: primaryColor } : {}}
                            >
                                Volver al inicio de sesión
                            </button>
                        ) : (
                            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                                Volver al inicio de sesión
                            </Link>
                        )}
                    </div>
                </form>
            )}
        </div>
    )

    if (isModal) return content

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full">
                {content}
            </div>
        </div>
    )
}
