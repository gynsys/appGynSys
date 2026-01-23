// Admin store using Zustand
import { create } from 'zustand'
import { adminService } from '../services/adminService'

export const useAdminStore = create((set, get) => ({
  // State
  tenants: [],
  plans: [],
  modules: [],
  loading: false,
  error: null,

  // Actions
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  // Tenant actions
  fetchTenants: async (params = {}) => {
    try {
      set({ loading: true, error: null })
      const tenants = await adminService.getTenants(params)
      set({ tenants, loading: false })
      return tenants
    } catch (error) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  createTenant: async (tenantData) => {
    try {
      set({ loading: true, error: null })
      const newTenant = await adminService.createTenant(tenantData)
      set(state => ({
        tenants: [...state.tenants, newTenant],
        loading: false
      }))
      return newTenant
    } catch (error) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  updateTenant: async (tenantId, tenantData) => {
    try {
      set({ loading: true, error: null })
      const updatedTenant = await adminService.updateTenant(tenantId, tenantData)
      set(state => ({
        tenants: state.tenants.map(tenant =>
          tenant.id === tenantId ? updatedTenant : tenant
        ),
        loading: false
      }))
      return updatedTenant
    } catch (error) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  updateTenantStatus: async (tenantId, statusData) => {
    try {
      set({ loading: true, error: null })
      const updatedTenant = await adminService.updateTenantStatus(tenantId, statusData)
      set(state => ({
        tenants: state.tenants.map(tenant =>
          tenant.id === tenantId ? updatedTenant : tenant
        ),
        loading: false
      }))
      return updatedTenant
    } catch (error) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  deleteTenant: async (tenantId) => {
    try {
      set({ loading: true, error: null })
      await adminService.deleteTenant(tenantId)
      set(state => ({
        tenants: state.tenants.filter(tenant => tenant.id !== tenantId),
        loading: false
      }))
    } catch (error) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  updateTenantModules: async (tenantId, moduleUpdates) => {
    try {
      set({ loading: true, error: null })
      const updatedModules = await adminService.updateTenantModules(tenantId, moduleUpdates)
      // Refresh tenant data to get updated modules
      const updatedTenant = await adminService.getTenant(tenantId)
      set(state => ({
        tenants: state.tenants.map(tenant =>
          tenant.id === tenantId ? updatedTenant : tenant
        ),
        loading: false
      }))
      return updatedModules
    } catch (error) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  // Plan actions
  fetchPlans: async (params = {}) => {
    try {
      set({ loading: true, error: null })
      const plans = await adminService.getPlans(params)
      set({ plans, loading: false })
      return plans
    } catch (error) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  createPlan: async (planData) => {
    try {
      set({ loading: true, error: null })
      const newPlan = await adminService.createPlan(planData)
      set(state => ({
        plans: [...state.plans, newPlan],
        loading: false
      }))
      return newPlan
    } catch (error) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  updatePlan: async (planId, planData) => {
    try {
      set({ loading: true, error: null })
      const updatedPlan = await adminService.updatePlan(planId, planData)
      set(state => ({
        plans: state.plans.map(plan =>
          plan.id === planId ? updatedPlan : plan
        ),
        loading: false
      }))
      return updatedPlan
    } catch (error) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  deletePlan: async (planId) => {
    try {
      set({ loading: true, error: null })
      await adminService.deletePlan(planId)
      set(state => ({
        plans: state.plans.filter(plan => plan.id !== planId),
        loading: false
      }))
    } catch (error) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  // Module actions
  fetchModules: async (params = {}) => {
    try {
      set({ loading: true, error: null })
      const modules = await adminService.getModules(params)
      set({ modules, loading: false })
      return modules
    } catch (error) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  createModule: async (moduleData) => {
    try {
      set({ loading: true, error: null })
      const newModule = await adminService.createModule(moduleData)
      set(state => ({
        modules: [...state.modules, newModule],
        loading: false
      }))
      return newModule
    } catch (error) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  updateModule: async (moduleId, moduleData) => {
    try {
      set({ loading: true, error: null })
      const updatedModule = await adminService.updateModule(moduleId, moduleData)
      set(state => ({
        modules: state.modules.map(module =>
          module.id === moduleId ? updatedModule : module
        ),
        loading: false
      }))
      return updatedModule
    } catch (error) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  deleteModule: async (moduleId) => {
    try {
      set({ loading: true, error: null })
      await adminService.deleteModule(moduleId)
      set(state => ({
        modules: state.modules.filter(module => module.id !== moduleId),
        loading: false
      }))
    } catch (error) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  // Clear error
  clearError: () => set({ error: null }),
}))