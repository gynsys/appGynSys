// Axios instance with JWT interceptor
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    // Solo agregar token si no es un endpoint público
    const isPublicEndpoint = config.url?.includes('/public') ||
      config.url?.includes('/profiles/') ||
      config.url?.includes('/auth/register') ||
      config.url?.includes('/auth/token') ||
      config.url?.includes('/auth/login/google') ||
      config.url?.includes('/preconsultation/by-appointment') ||
      config.url?.includes('/preconsultation/config') // Allow config to be public

    if (!isPublicEndpoint) {
      // Check if it's a cycle-related request
      const isCycleRequest = config.url?.includes('/cycle-users') || config.url?.includes('/cycle-predictor')

      if (isCycleRequest) {
        // For cycle requests, ONLY use the cycle token
        const cycleToken = localStorage.getItem('cycle_access_token')
        if (cycleToken) {
          config.headers.Authorization = `Bearer ${cycleToken}`
          // console.log('[Axios] Attaching CYCLE token to:', config.url);
        } else {
          // If no cycle token, send without auth (anonymous) - DO NOT use admin token
          // console.warn('[Axios] No cycle token found for cycle request:', config.url);
        }
      } else {
        // For standard requests (admin/doctor), use standard token
        const token = localStorage.getItem('access_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
          // console.log('[Axios] Attaching ADMIN token to:', config.url);
        } else {
          console.warn('[Axios] No token found in localStorage for:', config.url);
        }
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Solo redirigir a login si no es un endpoint público
    const isPublicEndpoint = error.config?.url?.includes('/public') ||
      error.config?.url?.includes('/profiles/') ||
      error.config?.url?.includes('/auth/register') ||
      error.config?.url?.includes('/auth/token')

    if (error.response?.status === 401 && !isPublicEndpoint) {
      // Token expired or invalid
      localStorage.removeItem('access_token')
      localStorage.removeItem('cycle_access_token') // Clear cycle token too for safety

      // Dispatch event to notify React components/Store
      window.dispatchEvent(new Event('auth:logout'))

      // Solo redirigir si estamos en una ruta protegida
      if (window.location.pathname.startsWith('/dashboard') || window.location.pathname.startsWith('/admin')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
