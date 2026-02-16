import api from '../lib/axios';

const notificationService = {
    getRules: async () => {
        const response = await api.get('/notifications/rules');
        return response.data;
    },

    getRule: async (notificationType) => {
        const response = await api.get(`/notifications/rules/${notificationType}`);
        return response.data;
    },

    updateRule: async (notificationType, ruleData) => {
        const response = await api.put(`/notifications/rules/${notificationType}`, ruleData);
        return response.data;
    }
};

export default notificationService;
