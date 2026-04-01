import api from '../lib/axios';

export const campaignService = {
  getSources: async () => {
    const response = await api.get('/campaigns/sources');
    return response.data;
  },

  createCampaign: async (campaignData) => {
    const response = await api.post('/campaigns/', campaignData);
    return response.data;
  },

  getCampaigns: async () => {
    const response = await api.get('/campaigns/');
    return response.data;
  },

  getContacts: async () => {
    const response = await api.get('/campaigns/contacts');
    return response.data;
  },

  createContact: async (contactData) => {
    const response = await api.post('/campaigns/contacts', contactData);
    return response.data;
  },

  deleteContact: async (contactId) => {
    const response = await api.delete(`/campaigns/contacts/${contactId}`);
    return response.data;
  },

  syncContacts: async () => {
    const response = await api.post('/campaigns/contacts/sync');
    return response.data;
  },

  async uploadCampaignImage(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/uploads/campaign-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
