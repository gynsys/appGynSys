import api from '../lib/axios';

export const templateService = {
    getTemplates: async (params = {}) => {
        const { data } = await api.get('/templates/', { params });
        return data;
    },

    getTemplate: async (id) => {
        const { data } = await api.get(`/templates/${id}`);
        return data;
    },

    createTemplate: async (templateData) => {
        const { data } = await api.post('/templates/', templateData);
        return data;
    },

    updateTemplate: async (id, templateData) => {
        const { data } = await api.put(`/templates/${id}`, templateData);
        return data;
    },

    deleteTemplate: async (id) => {
        const { data } = await api.delete(`/templates/${id}`);
        return data;
    }
};
