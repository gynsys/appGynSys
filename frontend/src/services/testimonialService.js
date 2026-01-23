// Testimonial service
import api from '../lib/axios'

export const testimonialService = {
  async getPublicTestimonials(doctorSlug) {
    // Always use the API, no local mocks
    const response = await api.get(`/testimonials/public/${doctorSlug}`)
    return response.data
  },

  async createTestimonial(testimonialData) {
    const response = await api.post('/testimonials/', testimonialData)
    return response.data
  },

  async getMyTestimonials() {
    const response = await api.get('/testimonials/')
    return response.data
  },

  async updateTestimonial(testimonialId, testimonialData) {
    const response = await api.put(`/testimonials/${testimonialId}`, testimonialData)
    return response.data
  },

  async deleteTestimonial(testimonialId) {
    await api.delete(`/testimonials/${testimonialId}`)
  },

  async uploadTestimonialPhoto(file) {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post('/uploads/testimonial-photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },
}

