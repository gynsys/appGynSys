import api from '../lib/axios';

export const testService = {
    /**
     * Save Endometriosis Test Result
     * @param {Object} resultData - { doctor_id, score, total_questions, result_level, patient_identifier }
     * @returns {Promise} Saved result
     */
    async saveEndometriosisResult(resultData) {
        const response = await api.post('/tests/endometriosis', resultData);
        return response.data;
    },

    /**
     * Get Endometriosis Test Statistics
     * @returns {Promise} { total, level_distribution, score_distribution }
     */
    async getEndometriosisStats() {
        const response = await api.get('/tests/endometriosis/stats');
        return response.data;
    }
};
