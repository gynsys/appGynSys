import axios from '../lib/axios'

export const servicesService = {
  getPublicServices: async (slug) => {
    const response = await axios.get(`/services/public/${slug}`)
    return response.data
  },

  getMyServices: async () => {
    const response = await axios.get('/services/me')
    return response.data
  },

  createService: async (serviceData) => {
    const response = await axios.post('/services/', serviceData)
    return response.data
  },

  updateService: async (id, serviceData) => {
    const response = await axios.put(`/services/${id}`, serviceData)
    return response.data
  },

  deleteService: async (id) => {
    const response = await axios.delete(`/services/${id}`)
    return response.data
  }
}
