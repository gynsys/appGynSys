import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from './useAuth'
import { isCapacitor } from '../../utils/platform'
import { useGoogleLogin } from '@react-oauth/google'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginForm({ redirect = '/dashboard', isModal = false, primaryColor = '#4f46e5', onForgotPasswordClick, onSuccess, onRegisterClick }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const { login, loginWithGoogle } = useAuth()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Determine theme from props OR localStorage
  const themePreference = localStorage.getItem('theme_preference')
  const isDark = themePreference === 'dark'

  const handleGoogleSuccess = async (tokenResponse) => {
    setLoading(true);
    try {
      // For redirect mode, the token might come in the Hash/URL
      const token = tokenResponse.access_token;
      if (!token) throw new Error("No token received");

      const response = await loginWithGoogle(token);
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
  };

  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => setError('Error al iniciar sesión con Google'),
    ux_mode: isCapacitor() ? 'redirect' : 'popup',
  });

  // Handle redirect callback (Implicit Flow) for Capacitor/Mobile
  useEffect(() => {
    const handleRedirectResult = async () => {
      // Check both hash (common for implicit flow) and search params
      const hash = window.location.hash;
      const params = new URLSearchParams(window.location.search);
      
      let accessToken = params.get('access_token');
      
      if (!accessToken && hash && hash.includes('access_token=')) {
        const hashParams = new URLSearchParams(hash.substring(1));
        accessToken = hashParams.get('access_token');
      }

      if (accessToken) {
        console.log("[GynSys] Google Token detected in URL, processing...");
        // Clean URL to prevent multiple login attempts on refresh
        window.history.replaceState({}, document.title, window.location.pathname);
        
        handleGoogleSuccess({ access_token: accessToken });
      }
    };

    handleRedirectResult();
  }, []);

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

  // Outer container classes
  const containerClasses = isModal
    ? "space-y-6"
    : `bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 border-gray-200 dark:border-gray-700 p-8 space-y-6`

  // Wrapper classes for full page
  const wrapperClasses = `min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200 ${isDark ? 'dark bg-gray-900' : 'bg-gray-50'}`

  const content = (
    <div className={containerClasses}>
      <div>
        <h2 className={`text-center text-[22px] font-extrabold ${isModal || isDark ? 'text-gray-900 dark:text-white' : 'text-gray-900'}`}>
          Inicia sesión en tu cuenta
        </h2>
      </div>
      <form className="space-y-6" onSubmit={handleSubmit}>
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
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
              className={`appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:z-10 sm:text-sm ${isModal || isDark ? 'dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400' : ''}`}
              style={{ 
                '--tw-ring-color': primaryColor,
                outlineColor: primaryColor
              }}
              onFocus={(e) => e.target.style.borderColor = primaryColor}
              onBlur={(e) => e.target.style.borderColor = isDark ? '#4b5563' : '#d1d5db'}
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" title="Contraseña" className="sr-only">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                className={`appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:z-10 sm:text-sm ${isModal || isDark ? 'dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 pr-10' : 'pr-10'}`}
                style={{ 
                    '--tw-ring-color': primaryColor,
                    outlineColor: primaryColor
                }}
                onFocus={(e) => e.target.style.borderColor = primaryColor}
                onBlur={(e) => e.target.style.borderColor = isDark ? '#4b5563' : '#d1d5db'}
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
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
            className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white transition-all duration-200 outline-none transform active:scale-95 hover:opacity-90 shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`}
            style={{ 
                backgroundColor: primaryColor,
                '--tw-ring-color': primaryColor
            }}
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
          <div className="flex items-center">
            <div className={`flex-grow border-t ${isModal || isDark ? 'border-gray-300 dark:border-gray-600' : 'border-gray-300'}`} />
            <span className={`flex-shrink mx-4 text-sm text-gray-500 ${isModal || isDark ? 'dark:text-gray-400' : ''}`}>
              O continúa con
            </span>
            <div className={`flex-grow border-t ${isModal || isDark ? 'border-gray-300 dark:border-gray-600' : 'border-gray-300'}`} />
          </div>

          <div className="mt-6">
            <div className="w-full flex justify-center">
              <button
                type="button"
                onClick={() => {
                  if (isCapacitor()) {
                    // Manual Implicit Flow for Capacitor to bypass SDK origin issues
                    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1013444456950-r1v7m72v7673p5f5v486745674567456.apps.googleusercontent.com'; // Fallback to avoid crashes if env is missing
                    const redirectUri = window.location.origin; // Solo el origin (https://gynsys.net) — debe coincidir exactamente con Google Cloud Console
                    const scope = 'openid email profile';
                    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(scope)}`;
                    
                    console.log("[GynSys] Starting manual Google Oauth redirect for Capacitor...");
                    window.location.href = url;
                  } else {
                    googleLogin();
                  }
                }}
                className={`w-full flex items-center justify-center gap-3 px-4 py-2 border rounded-md transition-all duration-200 ${isDark ? 'bg-transparent border-gray-600 text-gray-300 hover:bg-white/5' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="font-medium">Continuar con Google</span>
              </button>
            </div>
          </div>
        </div>
      </form>

      {!isModal && (
        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            ¿Eres paciente?{' '}
            <Link
              to="/cycle"
              className="font-bold text-pink-600 hover:text-pink-500 transition-colors"
            >
              Ir a Mi Ciclo
            </Link>
          </p>
        </div>
      )}
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
