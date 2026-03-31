import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const campaignService = {
  getSources: async () => {
    const response = await axios.get(`${API_URL}/campaigns/sources`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
    });
    return response.data;
  },

  createCampaign: async (campaignData) => {
    const response = await axios.post(`${API_URL}/campaigns/`, campaignData, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
    });
    return response.data;
  },

  getCampaigns: async () => {
    const response = await axios.get(`${API_URL}/campaigns/`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
    });
    return response.data;
  }
};
