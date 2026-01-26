/**
 * Online Consultation Service
 * API calls for managing online consultation settings
 */
import api from '../lib/axios';

export const onlineConsultationService = {
    /**
     * Get online consultation settings for a doctor (public)
     * @param {string} doctorSlug - Doctor's slug URL
     * @returns {Promise} Settings object
     */
    async getPublicSettings(doctorSlug) {
        const response = await api.get(`/online-consultation/settings/${doctorSlug}`);
        return response.data;
    },

    /**
     * Get online consultation settings for current doctor (authenticated)
     * @returns {Promise} Settings object
     */
    async getMySettings() {
        const response = await api.get('/online-consultation/settings');
        return response.data;
    },

    /**
     * Update online consultation settings (authenticated)
     * @param {Object} settingsData - Settings to update
     * @returns {Promise} Updated settings
     */
    async updateSettings(settingsData) {
        const response = await api.put('/online-consultation/settings', settingsData);
        return response.data;
    },

    /**
     * Get available slots for online consultation
     * @param {string} doctorSlug 
     * @param {string} startDate YYYY-MM-DD
     * @param {string} endDate YYYY-MM-DD
     * @returns {Promise} List of ISO slot strings
     */
    async getAvailableSlots(doctorSlug, startDate, endDate) {
        const response = await api.get('/online-consultation/available-slots', {
            params: { doctor_slug: doctorSlug, start_date: startDate, end_date: endDate }
        });
        return response.data;
    }
};
