import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from './useAuth'
import { GoogleLogin } from '@react-oauth/google'

export default function LoginForm({ redirect = '/dashboard', isModal = false, primaryColor, onForgotPasswordClick, onSuccess }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const { login, loginWithGoogle } = useAuth()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (loading) return

    setError('')
    setLoading(true)

    try {
      const response = await login(email, password)

      // Check if there is a success callback (e.g. to close modal smoothly)
      if (onSuccess) {
        onSuccess()
      }

      if (response?.user?.role === 'admin') {
        // Admin always goes to /admin context
        // If there was a saved redirect that is also an admin route, verify it
        const savedRedirect = localStorage.getItem('redirect_after_login')
        localStorage.removeItem('redirect_after_login')

        if (savedRedirect && savedRedirect.startsWith('/admin')) {
          navigate(savedRedirect, { replace: true })
        } else {
          navigate('/admin', { replace: true })
        }
      } else {
        // Regular user/doctor
        const savedRedirect = localStorage.getItem('redirect_after_login')
        if (savedRedirect) {
          localStorage.removeItem('redirect_after_login')
          navigate(savedRedirect, { replace: true })
        } else {
          // If it's a modal login, stay on current page (don't redirect to dashboard)
          // Unless explicitly passed a redirect prop that isn't default
          if (!isModal) {
            navigate(redirect || '/dashboard', { replace: true })
          }
          // If isModal is true, we simply do nothing (onSuccess closes the modal)
          // and the user stays where they are.
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.detail || 'Error al iniciar sesión. Verifica tus credenciales.'
      )
    } finally {
      // Only stop loading if we didn't succeed (if we succeeded, we are navigating/closing)
      // If we navigate, component unmounts.
      setLoading(false)
    }
  }

  // Determine theme from props OR localStorage
  const themePreference = localStorage.getItem('theme_preference')
  const isDark = themePreference === 'dark'

  // Outer container classes
  const containerClasses = isModal
    ? "space-y-6"
    : `bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 border-gray-200 dark:border-gray-700 p-8 space-y-6`

  // Wrapper classes for full page
  const wrapperClasses = `min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200 ${isDark ? 'dark bg-gray-900' : 'bg-gray-50'}`

  const handleGoogleLogin = async (credential) => {
    setLoading(true);
    try {
      const response = await loginWithGoogle(credential);
      if (onSuccess) onSuccess();

      const savedRedirect = localStorage.getItem('redirect_after_login');
      if (savedRedirect) {
        localStorage.removeItem('redirect_after_login');
        navigate(savedRedirect, { replace: true });
      } else if (!isModal) {
        navigate(redirect || '/dashboard', { replace: true });
      }
    } catch (err) {
      setError('Error al autenticar con Google');
    } finally {
      setLoading(false);
    }
  }

  const content = (
    <div className={containerClasses}>
      <div>
        <h2 className={`text-center text-3xl font-extrabold ${isModal || isDark ? 'text-gray-900 dark:text-white' : 'text-gray-900'}`}>
          Inicia sesión en tu cuenta
        </h2>
      </div>
      <form className="space-y-6" onSubmit={handleSubmit}>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label htmlFor="email" className={`sr-only ${isModal || isDark ? 'dark:text-gray-300' : ''}`}>
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className={`appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm ${isModal || isDark ? 'dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400' : ''}`}
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className={`appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm ${isModal || isDark ? 'dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400' : ''}`}
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end">
            <div className="text-sm">
              {onForgotPasswordClick ? (
                <button
                  type="button"
                  onClick={onForgotPasswordClick}
                  className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                  style={primaryColor ? { color: primaryColor } : {}}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              ) : (
                <Link
                  to="/forgot-password"
                  className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                  style={primaryColor ? { color: primaryColor } : {}}
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              )}
            </div>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${!primaryColor ? 'bg-indigo-600 hover:bg-indigo-700' : 'hover:opacity-90 transition shadow-md'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed`}
            style={primaryColor ? { backgroundColor: primaryColor } : {}}
          >
            {loading ? (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : 'Iniciar sesión'}
          </button>
        </div>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className={`w-full border-t ${isModal || isDark ? 'border-gray-300 dark:border-gray-600' : 'border-gray-300'}`} />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className={`px-2 bg-gray-50 text-gray-500 ${isModal || isDark ? 'dark:bg-gray-800 dark:text-gray-400' : ''}`}>O continúa con</span>
            </div>
          </div>

          <div className="mt-6">
            <div className="w-full flex justify-center">
              <GoogleLogin
                onSuccess={credentialResponse => {
                  handleGoogleLogin(credentialResponse.credential);
                }}
                onError={() => {
                  setError('Error al iniciar sesión con Google');
                }}
                theme={isDark ? "filled_black" : "outline"}
                size="large"
                width="100%"
                text="continue_with"
                shape="rectangular"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  )

  if (isModal) {
    return content
  }

  return (
    <div className={wrapperClasses}>
      <div className="max-w-md w-full">
        {content}
      </div>
    </div>
  )
}
