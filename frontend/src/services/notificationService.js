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
    },

    // Operations
    resetCircuit: async () => {
        const response = await api.post('/notifications/reset-circuit');
        return response.data;
    },

    triggerEvaluation: async () => {
        const response = await api.post('/notifications/trigger-evaluation');
        return response.data;
    },

    triggerDelivery: async () => {
        const response = await api.post('/notifications/trigger-delivery');
        return response.data;
    },

    cleanupSubscriptions: async () => {
        const response = await api.post('/notifications/cleanup-subscriptions');
        return response.data;
    },

    getAuditLogs: async (params = {}) => {
        const response = await api.get('/notifications/audit/logs', { params });
        return response.data;
    },

    getPendingQueue: async (params = {}) => {
        const response = await api.get('/notifications/audit/queue', { params });
        return response.data;
    }
};

export default notificationService;
