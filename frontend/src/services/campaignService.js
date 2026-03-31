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
  },

  getContacts: async () => {
    const response = await axios.get(`${API_URL}/campaigns/contacts`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
    });
    return response.data;
  },

  createContact: async (contactData) => {
    const response = await axios.post(`${API_URL}/campaigns/contacts`, contactData, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
    });
    return response.data;
  },

  deleteContact: async (contactId) => {
    const response = await axios.delete(`${API_URL}/campaigns/contacts/${contactId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
    });
    return response.data;
  },

  syncContacts: async () => {
    const response = await axios.post(`${API_URL}/campaigns/contacts/sync`, {}, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
    });
    return response.data;
  }
};
