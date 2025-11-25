// Authentication service
import api from '../lib/axios'

export const authService = {
  async login(email, password) {
    // OAuth2PasswordRequestForm expects form-urlencoded data
    const params = new URLSearchParams()
    params.append('username', email)
    params.append('password', password)
    
    const response = await api.post('/auth/token', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token)
    }
    
    return response.data
  },

  async register(userData) {
    const response = await api.post('/auth/register', userData)
    return response.data
  },

  async logout() {
    localStorage.removeItem('access_token')
  },

  async loginWithGoogle() {
    // Redirect to backend Google OAuth endpoint
    window.location.href = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1/auth/login/google`
  },
}

