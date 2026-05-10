import api from '../lib/axios';

export const scheduledAppointmentService = {
  /**
   * Get all scheduled appointments for the current doctor.
   */
  getAll: async (params = {}) => {
    const response = await api.get('/scheduled-appointments/', { params });
    return response.data;
  },

  /**
   * Create a new scheduled appointment.
   */
  create: async (data) => {
    const response = await api.post('/scheduled-appointments/', data);
    return response.data;
  },

  /**
   * Update a scheduled appointment.
   */
  update: async (id, data) => {
    const response = await api.put(`/scheduled-appointments/${id}`, data);
    return response.data;
  },

  /**
   * Cancel/Delete a scheduled appointment.
   */
  delete: async (id) => {
    const response = await api.delete(`/scheduled-appointments/${id}`);
    return response.data;
  }
};
