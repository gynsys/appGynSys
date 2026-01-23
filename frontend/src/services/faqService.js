// FAQ service
import api from '../lib/axios'

export const faqService = {
  async getPublicFAQs(doctorSlug) {
    const response = await api.get(`/faq/public/${doctorSlug}`)
    return response.data
  },

  async getMyFAQs() {
    const response = await api.get('/faq/')
    return response.data
  },

  async createFAQ(faqData) {
    const response = await api.post('/faq/', faqData)
    return response.data
  },

  async updateFAQ(faqId, faqData) {
    const response = await api.put(`/faq/${faqId}`, faqData)
    return response.data
  },

  async deleteFAQ(faqId) {
    const response = await api.delete(`/faq/${faqId}`)
    return response.data
  },
}

