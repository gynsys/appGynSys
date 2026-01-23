// Gallery service
import api from '../lib/axios'

export const galleryService = {
  async getPublicGallery(doctorSlug) {
    // Dev-mode local mock: return 5 placeholder images when enabled
    // Activate by setting VITE_USE_LOCAL_GALLERY=true in frontend/.env.local
    // Mock removido para forzar uso de la API real
    // if (import.meta.env.DEV && ... ) { ... }

    const response = await api.get(`/gallery/public/${doctorSlug}`)
    return response.data
  },

  async uploadGalleryImage(file, title, description) {
    const formData = new FormData()
    formData.append('file', file)
    if (title) formData.append('title', title)
    if (description) formData.append('description', description)

    const response = await api.post('/gallery/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  async getMyGallery() {
    const response = await api.get('/gallery/')
    return response.data
  },

  async updateGalleryImage(galleryId, galleryData) {
    const response = await api.put(`/gallery/${galleryId}`, galleryData)
    return response.data
  },

  async deleteGalleryImage(galleryId) {
    await api.delete(`/gallery/${galleryId}`)
  },

  async replaceGalleryImage(galleryId, file) {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.put(`/gallery/${galleryId}/image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },
}

export default galleryService

