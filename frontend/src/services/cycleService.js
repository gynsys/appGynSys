import api from '../lib/axios';

const cycleService = {
    getPredictions: async () => {
        const response = await api.get('/cycle-predictor/predictions');
        return response.data;
    },

    getStats: async () => {
        const response = await api.get('/cycle-predictor/stats');
        return response.data;
    },

    getCycles: async () => {
        const response = await api.get(`/cycle-predictor/cycles?_t=${new Date().getTime()}`);
        return response.data;
    },

    createCycle: async (data) => {
        const response = await api.post('/cycle-predictor/cycles', data);
        return response.data;
    },

    updateCycle: async (id, data) => {
        const response = await api.put(`/cycle-predictor/cycles/${id}`, data);
        return response.data;
    },

    deleteCycle: async (id) => {
        const response = await api.delete(`/cycle-predictor/cycles/${id}`);
        return response.data;
    },

    deleteAllData: async () => {
        const response = await api.delete('/cycle-predictor/reset');
        return response.data;
    },

    getSymptoms: async () => {
        const response = await api.get('/cycle-predictor/symptoms');
        return response.data;
    },

    createSymptom: async (data) => {
        const response = await api.post('/cycle-predictor/symptoms', data);
        return response.data;
    },

    updateSymptom: async (id, data) => {
        const response = await api.put(`/cycle-predictor/symptoms/${id}`, data);
        return response.data;
    },

    getSettings: async () => {
        const response = await api.get('/cycle-predictor/settings');
        return response.data;
    },

    updateSettings: async (data) => {
        const response = await api.put('/cycle-predictor/settings', data);
        return response.data;
    },

    startPregnancy: async (data) => {
        const response = await api.post('/cycle-predictor/pregnancy', data);
        return response.data;
    },

    getPregnancy: async () => {
        const response = await api.get('/cycle-predictor/pregnancy');
        return response.data;
    },

    getActivePregnancy: async () => {
        const response = await api.get('/cycle-predictor/pregnancy');
        return response.data;
    },

    endPregnancy: async () => {
        const response = await api.delete('/cycle-predictor/pregnancy');
        return response.data;
    }
};

export default cycleService;
