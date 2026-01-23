import api from '../lib/axios'

export const contactService = {
  sendMessage: async (data) => {
    const response = await api.post('/contact/', data)
    return response.data
  }
}
