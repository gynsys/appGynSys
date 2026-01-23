import api from '../lib/axios';

export const consultationService = {
  createConsultation: async (payload) => {
    const response = await api.post('/consultations/', payload);
    return response.data;
  },

  getConsultationPdf: (id) => {
    // Note: This returns a URL. If the endpoint requires auth, window.open might fail 
    // unless the token is passed in query params or cookies.
    // For now, we keep it as is, assuming the backend might handle it or we fix it later.
    return `/consultations/${id}/pdf`;
  },

  getConsultationHistoryPdf: (id) => {
    return `/consultations/${id}/history_pdf`;
  },

  sendReport: async (id, email) => {
    const response = await api.post(`/consultations/${id}/send-email`, { email });
    return response.data;
  },

  getLatestConsultation: async (dni) => {
    const response = await api.get('/consultations/patient/latest', {
      params: { dni }
    });
    return response.data;
  },

  getAllConsultations: async (dni) => {
    const response = await api.get('/consultations/patient/all', {
      params: { dni }
    });
    return response.data;
  }
};
