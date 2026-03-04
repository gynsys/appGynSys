import api from '../lib/axios';

const notificationService = {
    getRules: async () => {
        try {
            const response = await api.get('/notifications/rules');
            return response.data;
        } catch (error) {
            console.error('[NotificationService] ❌ Error fetching rules:', error);
            throw error;
        }
    },

    getRule: async (notificationType) => {
        const response = await api.get(`/notifications/rules/${notificationType}`);
        return response.data;
    },

    updateRule: async (notificationType, ruleData) => {
        const response = await api.put(`/notifications/rules/${notificationType}`, ruleData);
        return response.data;
    },

    getHealth: async () => {
        const response = await api.get('/notifications/health');
        return response.data;
    },

    retriggerEvaluation: async (userId) => {
        const response = await api.post(`/notifications/debug/user/${userId}/evaluate`);
        return response.data;
    },

    retryFailed: async (userId) => {
        const response = await api.post(`/notifications/debug/user/${userId}/retry`);
        return response.data;
    }
};

export default notificationService;
