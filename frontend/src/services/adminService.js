// Admin API service
import api from '../lib/axios'

export const adminService = {
  // Tenant operations
  async getTenants(params = {}) {
    const response = await api.get('/admin/tenants', { params })
    return response.data
  },

  async createTenant(tenantData) {
    const response = await api.post('/admin/tenants', tenantData)
    return response.data
  },

  async getTenant(tenantId) {
    const response = await api.get(`/admin/tenants/${tenantId}`)
    return response.data
  },

  async updateTenant(tenantId, tenantData) {
    const response = await api.put(`/admin/tenants/${tenantId}`, tenantData)
    return response.data
  },

  async updateTenantStatus(tenantId, statusData) {
    const response = await api.patch(`/admin/tenants/${tenantId}/status`, statusData)
    return response.data
  },

  async deleteTenant(tenantId) {
    const response = await api.delete(`/admin/tenants/${tenantId}`)
    return response.data
  },

  async updateTenantModules(tenantId, moduleUpdates) {
    const response = await api.put(`/admin/tenants/${tenantId}/modules`, moduleUpdates)
    return response.data
  },

  // Plan operations
  async getPlans(params = {}) {
    const response = await api.get('/admin/plans', { params })
    return response.data
  },

  async createPlan(planData) {
    const response = await api.post('/admin/plans', planData)
    return response.data
  },

  async getPlan(planId) {
    const response = await api.get(`/admin/plans/${planId}`)
    return response.data
  },

  async updatePlan(planId, planData) {
    const response = await api.put(`/admin/plans/${planId}`, planData)
    return response.data
  },

  async deletePlan(planId) {
    const response = await api.delete(`/admin/plans/${planId}`)
    return response.data
  },

  // Module operations
  async getModules(params = {}) {
    const response = await api.get('/admin/modules', { params })
    return response.data
  },

  async createModule(moduleData) {
    const response = await api.post('/admin/modules', moduleData)
    return response.data
  },

  async getModule(moduleId) {
    const response = await api.get(`/admin/modules/${moduleId}`)
    return response.data
  },

  async updateModule(moduleId, moduleData) {
    const response = await api.put(`/admin/modules/${moduleId}`, moduleData)
    return response.data
  },

  async deleteModule(moduleId) {
    const response = await api.delete(`/admin/modules/${moduleId}`)
    return response.data
  },
}