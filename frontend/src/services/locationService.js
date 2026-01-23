import api from '../lib/axios'

export const locationService = {
  getMyLocations: async () => {
    const response = await api.get('/locations/')
    return response.data
  },

  getPublicLocations: async (doctorSlug) => {
    const response = await api.get(`/locations/public/${doctorSlug}`)
    return response.data
  },

  createLocation: async (locationData) => {
    const response = await api.post('/locations/', locationData)
    return response.data
  },

  updateLocation: async (id, locationData) => {
    const response = await api.put(`/locations/${id}`, locationData)
    return response.data
  },

  deleteLocation: async (id) => {
    const response = await api.delete(`/locations/${id}`)
    return response.data
  }
}
