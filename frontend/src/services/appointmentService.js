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

  async getBookedTimes(doctorId, date, location = null) {
    let url = `/appointments/public/booked-times?doctor_id=${doctorId}&date=${date}`;
    if (location) url += `&location=${encodeURIComponent(location)}`;
    const response = await api.get(url);
    return response.data;
  },

  async checkPatient(name, dni) {
    const response = await api.post('/patients/check-existence', { name, dni })
    return response.data
  },

  async getPatientByEmail(email) {
    const response = await api.get(`/patients/by-email?email=${encodeURIComponent(email)}`)
    return response.data
  },

  async getAppointments() {
    // Add cache-busting timestamp to prevent browser from returning stale 304 cache during polling
    const response = await api.get(`/appointments/?t=${new Date().getTime()}`)
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

