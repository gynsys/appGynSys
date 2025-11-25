// Axios instance with JWT interceptor
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
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
                            config.url?.includes('/auth/token')
    
    if (!isPublicEndpoint) {
      const token = localStorage.getItem('access_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
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
      // Solo redirigir si estamos en una ruta protegida
      if (window.location.pathname.startsWith('/dashboard')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api

