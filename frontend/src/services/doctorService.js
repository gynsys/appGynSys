// Doctor service
import api from '../lib/axios'

export const doctorService = {
  async getDoctorProfileBySlug(slug) {
    const response = await api.get(`/profiles/${slug}`)
    return response.data
  },

  async getCurrentUser() {
    const response = await api.get('/users/me')
    return response.data
  },

  async updateCurrentUser(userData) {
    const response = await api.put('/users/me', userData)
    return response.data
  },

  async uploadLogo(file) {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post('/uploads/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  async uploadPhoto(file) {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post('/uploads/photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },
}

