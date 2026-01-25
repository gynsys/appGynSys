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

  async loginCycleUser(email, password) {
    // OAuth2PasswordRequestForm expects form-urlencoded data
    const params = new URLSearchParams()
    params.append('username', email)
    params.append('password', password)

    const response = await api.post('/cycle-users/login', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    if (response.data.access_token) {
      localStorage.setItem('cycle_access_token', response.data.access_token)
    }

    return response.data
  },

  async register(userData) {
    const response = await api.post('/auth/register', userData)
    return response.data
  },

  async registerCycleUser(userData) {
    const response = await api.post('/cycle-users/register', userData)

    if (response.data.access_token) {
      localStorage.setItem('cycle_access_token', response.data.access_token)
    }

    return response.data
  },

  async loginGoogle(token) {
    const response = await api.post('/auth/login/google', { token })
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token)
    }
    return response.data
  },

  async logout() {
    localStorage.removeItem('access_token')
  },

  async getCurrentUser() {
    const response = await api.get('/auth/me')
    return response.data
  },

  async getCycleUser() {
    const response = await api.get('/cycle-users/me')
    return response.data
  },

  async updateCycleUser(userData) {
    const response = await api.put('/cycle-users/me', userData)
    return response.data
  },



  async requestPasswordReset(email) {
    const response = await api.post('/auth/password-recovery', { email })
    return response.data
  },

  async resetPassword(token, newPassword) {
    const response = await api.post('/auth/reset-password', {
      token,
      new_password: newPassword
    })
    return response.data
  },

  async requestCyclePasswordReset(email) {
    const response = await api.post('/cycle-users/password-recovery', { email })
    return response.data
  },

  async resetCyclePassword(token, newPassword) {
    const response = await api.post('/cycle-users/reset-password', {
      token,
      new_password: newPassword
    })
    return response.data
  },
}

