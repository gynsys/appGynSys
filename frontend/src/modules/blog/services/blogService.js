import api from '../../../lib/axios'

export const blogService = {
  getPublicPosts: async (doctorSlug) => {
    const response = await api.get(`/blog/public/${doctorSlug}`)
    return response.data
  },

  getPostBySlug: async (slug) => {
    const response = await api.get(`/blog/public/post/${slug}`)
    return response.data
  },

  getMegaMenu: async (doctorSlug) => {
    const response = await api.get(`/blog/menu/mega/${doctorSlug}`)
    return response.data
  },

  getMyPosts: async () => {
    const response = await api.get('/blog/my-posts')
    return response.data
  },

  createPost: async (postData) => {
    const response = await api.post('/blog/', postData)
    return response.data
  },

  updatePost: async (id, postData) => {
    const response = await api.put(`/blog/${id}`, postData)
    return response.data
  },

  deletePost: async (id) => {
    const response = await api.delete(`/blog/${id}`)
    return response.data
  },
  
  getPostById: async (id) => {
    const response = await api.get(`/blog/${id}`)
    return response.data
  },

  getComments: async (postSlug) => {
    const response = await api.get(`/blog/comments/${postSlug}`)
    return response.data
  },

  createComment: async (postSlug, commentData) => {
    const response = await api.post(`/blog/comments/${postSlug}`, commentData)
    return response.data
  }
}
