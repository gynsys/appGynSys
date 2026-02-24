import api from '../lib/axios';

const notificationService = {
    getRules: async () => {
        console.log('[NotificationService] 🔵 Fetching notification rules...');
        try {
            const response = await api.get('/notifications/rules');
            console.log('[NotificationService] ✅ Rules fetched successfully:', {
                count: response.data?.length || 0,
                firstRule: response.data?.[0]?.notification_type || 'N/A'
            });
            return response.data;
        } catch (error) {
            console.error('[NotificationService] ❌ Error fetching rules:', error);
            throw error;
        }
    },

    getRule: async (notificationType) => {
        console.log('[NotificationService] 🔵 Fetching rule:', notificationType);
        const response = await api.get(`/notifications/rules/${notificationType}`);
        console.log('[NotificationService] ✅ Rule fetched:', response.data);
        return response.data;
    },

    updateRule: async (notificationType, ruleData) => {
        console.log('[NotificationService] 🔵 Updating rule:', notificationType, ruleData);
        const response = await api.put(`/notifications/rules/${notificationType}`, ruleData);
        console.log('[NotificationService] ✅ Rule updated:', response.data);
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
