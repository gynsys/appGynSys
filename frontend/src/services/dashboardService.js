import api from '../lib/axios';

export const dashboardService = {
    /**
     * Get dashboard statistics
     * @returns {Promise<Object>} Stats object
     */
    async getStats() {
        const response = await api.get('/dashboard/stats');
        return response.data;
    }
};
