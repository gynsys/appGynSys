import api from '../lib/axios'

export const recommendationService = {
    // --- Recommendations (Cards) ---
    getAll: async () => {
        const response = await api.get('/recommendations/admin')
        return response.data
    },

    getPublic: async (slug) => {
        const response = await api.get(`/recommendations/public/${slug}`)
        return response.data
    },

    create: async (data) => {
        const response = await api.post('/recommendations', data)
        return response.data
    },

    update: async (id, data) => {
        const response = await api.put(`/recommendations/${id}`, data)
        return response.data
    },

    delete: async (id) => {
        const response = await api.delete(`/recommendations/${id}`)
        return response.data
    },

    // --- Categories (Tabs) ---
    getCategories: async () => {
        const response = await api.get('/recommendations/categories')
        return response.data
    },

    getPublicCategories: async (slug) => {
        const response = await api.get(`/recommendations/categories/public/${slug}`)
        return response.data
    },

    createCategory: async (data) => {
        const response = await api.post('/recommendations/categories', data)
        return response.data
    },

    deleteCategory: async (id) => {
        const response = await api.delete(`/recommendations/categories/${id}`)
        return response.data
    },

    reorderCategories: async (orders) => { // List of {id, order}
        const response = await api.put('/recommendations/categories/reorder', orders)
        return response.data
    }
}
