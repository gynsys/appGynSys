import api from '../lib/axios';

export const preconsultationService = {
  async getQuestions() {
    const response = await api.get('/preconsultation/');
    return response.data;
  },

  async getQuestionsByAppointment(appointmentId) {
    const response = await api.get(`/preconsultation/by-appointment/${appointmentId}`);
    return response.data;
  },

  async createQuestion(questionData) {
    const response = await api.post('/preconsultation/', questionData);
    return response.data;
  },

  async updateQuestion(id, questionData) {
    const response = await api.put(`/preconsultation/${id}`, questionData);
    return response.data;
  },

  async deleteQuestion(id) {
    const response = await api.delete(`/preconsultation/${id}`);
    return response.data;
  },

  async deleteAllQuestions() {
    const response = await api.delete('/preconsultation/');
    return response.data;
  },

  async submitAnswers(appointmentId, answers) {
    const response = await api.post(`/appointments/${appointmentId}/preconsulta`, answers);
    return response.data;
  },

  async getConfig(appointmentId) {
    const response = await api.get(`/preconsultation/config?appointment_id=${appointmentId}`);
    return response.data;
  }
};
