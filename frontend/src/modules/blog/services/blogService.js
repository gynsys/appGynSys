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
  },

  generateAI: async (aiData) => {
    // If aiData contains a file, use FormData
    if (aiData.pdf_file) {
      const formData = new FormData();
      Object.keys(aiData).forEach(key => {
        if (aiData[key] !== null && aiData[key] !== undefined) {
          formData.append(key, aiData[key]);
        }
      });
      const response = await api.post('/blog/generate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    }
    
    // Otherwise, standard JSON post
    const response = await api.post('/blog/generate', aiData);
    return response.data;
  },
  
  generateSocialContent: async (postId, genType) => {
    const response = await api.post(`/blog/${postId}/generate-social?gen_type=${genType}`)
    return response.data
  },

  generateSocialFromContent: async (title, content, genType) => {
    const response = await api.post('/blog/generate-social-from-content', { title, content, gen_type: genType })
    return response.data
  },

  // Social Carousel Projects
  getCarouselProjects: async () => {
    const response = await api.get('/blog/carousels')
    return response.data
  },

  saveCarouselProject: async (projectData) => {
    const response = await api.post('/blog/carousels', projectData)
    return response.data
  },

  updateCarouselProject: async (projectId, projectData) => {
    const response = await api.put(`/blog/carousels/${projectId}`, projectData)
    return response.data
  },

  deleteCarouselProject: async (projectId) => {
    const response = await api.delete(`/blog/carousels/${projectId}`)
    return response.data
  },

  // Social Audios
  getSocialAudios: async () => {
    const response = await api.get('/blog/social-audios')
    return response.data
  },

  uploadSocialAudio: async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post('/uploads/social-audio', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },

  deleteSocialAudio: async (audioId) => {
    const response = await api.delete(`/blog/social-audios/${audioId}`)
    return response.data
  }
}
