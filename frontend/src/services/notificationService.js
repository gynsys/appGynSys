import api from '../lib/axios';

const notificationService = {
    getRules: async () => {
        const response = await api.get('/notifications/rules');
        return response.data;
    },

    createRule: async (ruleData) => {
        const response = await api.post('/notifications/rules', ruleData);
        return response.data;
    },

    updateRule: async (id, ruleData) => {
        const response = await api.put(`/notifications/rules/${id}`, ruleData);
        return response.data;
    },

    deleteRule: async (id) => {
        const response = await api.delete(`/notifications/rules/${id}`);
        return response.data;
    }
};

export default notificationService;
