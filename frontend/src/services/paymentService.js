import api from '../lib/axios';

export const paymentService = {
    /**
     * Get payment configuration (e.g. PayPal Client ID)
     * @returns {Promise} Config object
     */
    async getConfig() {
        const response = await api.get('/payment/config');
        return response.data;
    }
};
