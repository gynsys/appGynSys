import api from '../../../lib/axios'

export const arkoService = {
  getPublicPosts: async (category = null) => {
    const url = category ? `/arko/posts?category=${category}` : '/arko/posts'
    const response = await api.get(url)
    return response.data
  },

  getPostBySlug: async (slug) => {
    const response = await api.get(`/arko/posts/${slug}`)
    return response.data
  },

  getAdminPosts: async () => {
    const response = await api.get('/arko/admin/posts')
    return response.data
  },

  createPost: async (postData) => {
    const response = await api.post('/arko/admin/posts', postData)
    return response.data
  },

  updatePost: async (id, postData) => {
    const response = await api.put(`/arko/admin/posts/${id}`, postData)
    return response.data
  },

  deletePost: async (id) => {
    const response = await api.delete(`/arko/admin/posts/${id}`)
    return response.data
  },

  generateAI: async (aiData) => {
    const response = await api.post('/arko/admin/posts/generate', aiData)
    return response.data
  }
}
