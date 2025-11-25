// Appointment service
import api from '../lib/axios'

export const appointmentService = {
  async createAppointment(appointmentData) {
    // Usar endpoint público para pacientes sin autenticación
    const response = await api.post('/appointments/public', appointmentData, {
      // No incluir token para endpoints públicos
      headers: {
        'Content-Type': 'application/json',
      },
    })
    return response.data
  },

  async getAppointments() {
    const response = await api.get('/appointments/')
    return response.data
  },

  async getAppointment(id) {
    const response = await api.get(`/appointments/${id}`)
    return response.data
  },

  async updateAppointment(id, appointmentData) {
    const response = await api.put(`/appointments/${id}`, appointmentData)
    return response.data
  },

  async deleteAppointment(id) {
    const response = await api.delete(`/appointments/${id}`)
    return response.data
  },
}

