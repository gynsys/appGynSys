// Auth store using Zustand
import { create } from 'zustand'
import { authService } from '../services/authService'

export const useAuthStore = create((set, get) => {
  // Initialize from localStorage if token exists
  const token = localStorage.getItem('access_token')
  const initialAuth = !!token

  return {
    user: null,
    isAuthenticated: initialAuth,
    loading: false,

    setUser: (user) => set({ user, isAuthenticated: !!user }),

    login: async (email, password) => {
      set({ loading: true })
      try {
        const data = await authService.login(email, password)
        const user = await authService.getCurrentUser()
        set({ user, isAuthenticated: true, loading: false })
        return data
      } catch (error) {
        set({ loading: false })
        throw error
      }
    },

    loginCycleUser: async (email, password) => {
      set({ loading: true })
      try {
        const data = await authService.loginCycleUser(email, password)
        const user = await authService.getCycleUser()
        set({ user, isAuthenticated: true, loading: false })
        return data
      } catch (error) {
        set({ loading: false })
        throw error
      }
    },

    register: async (userData) => {
      set({ loading: true })
      try {
        const data = await authService.register(userData)
        // After registration, try to login automatically
        if (userData.email && userData.password) {
          await get().login(userData.email, userData.password)
        }
        return data
      } catch (error) {
        set({ loading: false })
        throw error
      }
    },

    registerCycleUser: async (userData) => {
      set({ loading: true })
      try {
        const data = await authService.registerCycleUser(userData)
        // Token is already set by authService
        const user = await authService.getCycleUser()
        set({ user, isAuthenticated: true, loading: false })
        return data
      } catch (error) {
        set({ loading: false })
        throw error
      }
    },

    requestCyclePasswordReset: async (email) => {
      set({ loading: true })
      try {
        const data = await authService.requestCyclePasswordReset(email)
        set({ loading: false })
        return data
      } catch (error) {
        set({ loading: false })
        throw error
      }
    },

    updateCycleUser: async (userData) => {
      // Don't set global loading state for updates to avoid full page interactions blocking unless needed
      // set({ loading: true }) 
      try {
        const data = await authService.updateCycleUser(userData)
        // Update local user state
        set(state => ({
          user: { ...state.user, ...data }
        }))
        return data
      } catch (error) {
        // set({ loading: false })
        throw error
      }
    },

    loadUser: async (silent = false) => {
      const token = localStorage.getItem('access_token')
      const cycleToken = localStorage.getItem('cycle_access_token')

      if (!token && !cycleToken) {
        set({ user: null, isAuthenticated: false, loading: false })
        return
      }

      if (!silent) set({ loading: true })

      try {
        if (token) {
          // First try standard user
          try {
            const user = await authService.getCurrentUser()
            set({ user, isAuthenticated: true, loading: false })
            return
          } catch (err) {
            // If admin token fails (expired), try cycle? Or just fail? 
            // Usually if token exists but invalid, we clear it.
            console.warn("Admin token invalid", err)
            localStorage.removeItem('access_token')
            // Continue to check cycle token below...
          }
        }

        if (cycleToken) {
          // Try cycle user
          const user = await authService.getCycleUser()
          set({ user, isAuthenticated: true, loading: false })
        } else {
          // No valid session found after checks
          set({ user: null, isAuthenticated: false, loading: false })
        }

      } catch (error) {
        // Token might be invalid, clear it
        console.error("Auth load failed:", error)
        // We might have removed access_token above, remove cycle too if it failed
        if (localStorage.getItem('cycle_access_token')) localStorage.removeItem('cycle_access_token')

        set({ user: null, isAuthenticated: false, loading: false })
      }
    },

    logout: () => {
      localStorage.removeItem('access_token')
      localStorage.removeItem('cycle_access_token')
      set({ user: null, isAuthenticated: false, loading: false })
    },
  }
})

