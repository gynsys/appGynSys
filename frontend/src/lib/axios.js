// Axios instance with JWT interceptor
import axios from 'axios'

let baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

// Seguridad para evitar errores de Mixed Content en producción
if (typeof window !== 'undefined' && window.location.protocol === 'https:' && baseURL.startsWith('http:')) {
  baseURL = baseURL.replace('http:', 'https:');
}

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Helper to determine if an endpoint is public
const isPublicEndpoint = (url) => {
  if (!url) return false;
  return url.includes('/public') ||
    url.includes('/profiles/') ||
    url.includes('/auth/register') ||
    url.includes('/auth/token') ||
    url.includes('/auth/login/google') ||
    url.includes('/preconsultation/by-appointment') ||
    url.includes('/preconsultation/config') ||
    url.includes('/appointments/') && url.includes('/preconsulta') || // Submit preconsultation
    url.includes('/cycle-users/register') ||
    url.includes('/cycle-users/verify-email') ||
    url.includes('/cycle-users/login') ||
    url.includes('/cycle-users/password-recovery') ||
    url.includes('/auth/patient/activation-info') ||
    url.includes('/auth/patient/activate') ||
    url.includes('/onboarding/') ||
    url.includes('/locations/public/') ||
    url.includes('/notifications/track'); // Debug and tracking pings
};

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    // Solo agregar token si no es un endpoint público
    if (!isPublicEndpoint(config.url)) {
      // Check if it's a cycle-related request
      const isCycleRequest = config.url?.includes('/cycle-users') ||
        config.url?.includes('/cycle-predictor') ||
        config.url?.includes('/notifications/vapid-public-key') ||
        config.url?.includes('/notifications/subscribe') ||
        config.url?.includes('/notifications/unsubscribe') ||
        config.url?.includes('/compliance/')

      if (isCycleRequest) {
        // For cycle requests, ONLY use the cycle token
        const cycleToken = localStorage.getItem('cycle_access_token')
        if (cycleToken) {
          config.headers.Authorization = `Bearer ${cycleToken}`
          // console.log('[Axios] Attaching CYCLE token to:', config.url);
        } else {
          // Fallback: Try standard access_token (e.g. Google Login or Main App Login)
          // This allows unified auth users to access cycle endpoints
          const standardToken = localStorage.getItem('access_token')
          if (standardToken) {
            config.headers.Authorization = `Bearer ${standardToken}`
          } else {
            // console.warn('[Axios] No token found for cycle request:', config.url);
          }
        }
      } else {
        // For standard requests (admin/doctor), use standard token
        const token = localStorage.getItem('access_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
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
  async (error) => {
    // --- CORS BYPASS FOR CAPACITOR ---
    // If we have a network error in Capacitor, it's likely a CORS issue.
    // We try to fallback to Native HTTP request which bypasses CORS.
    if (error.code === 'ERR_NETWORK' || !error.response) {
      const { Capacitor } = await import('@capacitor/core');
      if (Capacitor.isNativePlatform()) {
        const { CapacitorHttp } = await import('@capacitor/core');
        console.log('[AxiosBypass] Network error detected in Native. Attempting Native HTTP Bypass for:', error.config.url);
        
        try {
          // Convert axios config to CapacitorHttp options
          const options = {
            url: error.config.url.startsWith('http') ? error.config.url : `${error.config.baseURL}${error.config.url}`,
            method: error.config.method.toUpperCase(),
            headers: error.config.headers,
            data: typeof error.config.data === 'string' ? JSON.parse(error.config.data) : error.config.data,
          };
          
          const nativeResponse = await CapacitorHttp.request(options);
          
          // Map back to axios-like response
          return {
            data: nativeResponse.data,
            status: nativeResponse.status,
            headers: nativeResponse.headers,
            config: error.config
          };
        } catch (nativeErr) {
          console.error('[AxiosBypass] Native Bypass failed too:', nativeErr);
        }
      }
    }
    // Solo redirigir a login si no es un endpoint público
    if (error.response?.status === 401 && !isPublicEndpoint(error.config?.url)) {
      // Token expired or invalid

      // Determine if it was a cycle request based on URL or previous logic
      const isCycleRequest = error.config?.url?.includes('/cycle-users') ||
        error.config?.url?.includes('/cycle-predictor') ||
        error.config?.url?.includes('/notifications/vapid-public-key') ||
        error.config?.url?.includes('/notifications/subscribe') ||
        error.config?.url?.includes('/notifications/unsubscribe') ||
        error.config?.url?.includes('/compliance/')

      if (isCycleRequest) {
        localStorage.removeItem('cycle_access_token')
        window.dispatchEvent(new Event('auth:logout:patient'))
      } else {
        localStorage.removeItem('access_token')
        window.dispatchEvent(new Event('auth:logout:doctor'))

        // Solo redirigir doctor si estamos en una ruta protegida de admin/dashboard
        if (window.location.pathname.startsWith('/dashboard') || window.location.pathname.startsWith('/admin')) {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api
