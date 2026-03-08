// Auth store using Zustand
import { create } from 'zustand'
import { authService } from '../services/authService'

export const useAuthStore = create((set, get) => {
  // Initialize flags based on existing tokens
  const token = localStorage.getItem('access_token')
  const cycleToken = localStorage.getItem('cycle_access_token')

  return {
    // 1. Doctor/Admin State
    user: null,
    isAuthenticated: !!token,

    // 2. Patient/CycleUser State
    cycleUser: null,
    isCycleAuthenticated: !!cycleToken,

    loading: false,

    // Doctor Setters
    setUser: (user) => set({ user, isAuthenticated: !!user }),

    // Patient Setters
    setCycleUser: (cycleUser) => set({ cycleUser, isCycleAuthenticated: !!cycleUser }),

    setPhotoUrl: (photoUrl) => set(state => ({
      cycleUser: state.cycleUser ? { ...state.cycleUser, photo_url: photoUrl } : null
    })),

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

    loginWithGoogle: async (token) => {
      set({ loading: true })
      try {
        const data = await authService.loginGoogle(token)
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
        set({ cycleUser: user, isCycleAuthenticated: true, loading: false })
        return data
      } catch (error) {
        set({ loading: false })
        throw error
      }
    },

    loginCycleUserWithGoogle: async (token) => {
      set({ loading: true })
      try {
        const data = await authService.loginGoogle(token, true) // Pass true for isCycle
        const user = await authService.getCycleUser()
        set({ cycleUser: user, isCycleAuthenticated: true, loading: false })
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
        if (userData.email && userData.password) {
          try {
            await get().login(userData.email, userData.password)
          } catch (loginError) {
            if (loginError.response?.status === 403) {
              set({ loading: false })
              return data
            }
            throw loginError
          }
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
        const user = await authService.getCycleUser()
        set({ cycleUser: user, isCycleAuthenticated: true, loading: false })
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
      try {
        const data = await authService.updateCycleUser(userData)
        set(state => ({
          cycleUser: { ...state.cycleUser, ...data }
        }))
        return data
      } catch (error) {
        throw error
      }
    },

    loadUser: async (silent = false) => {
      const token = localStorage.getItem('access_token')
      const cycleToken = localStorage.getItem('cycle_access_token')

      if (!token && !cycleToken) {
        set({
          user: null, isAuthenticated: false,
          cycleUser: null, isCycleAuthenticated: false,
          loading: false
        })
        return
      }

      if (!silent) set({ loading: true })

      try {
        // Load Doctor if token exists
        if (token) {
          try {
            const user = await authService.getCurrentUser()
            set({ user, isAuthenticated: true })
          } catch (err) {
            localStorage.removeItem('access_token')
            set({ user: null, isAuthenticated: false })
          }
        }

        // Load Patient if cycleToken exists (Independently!)
        if (cycleToken) {
          try {
            const user = await authService.getCycleUser()
            set({ cycleUser: user, isCycleAuthenticated: true })
          } catch (err) {
            localStorage.removeItem('cycle_access_token')
            set({ cycleUser: null, isCycleAuthenticated: false })
          }
        }
      } finally {
        set({ loading: false })
      }
    },

    logout: () => {
      // General logout (defaults to Doctor to avoid breaking existing code)
      // but we should favor logoutDoctor/logoutPatient for specific cases
      localStorage.removeItem('access_token')
      set({
        user: null,
        isAuthenticated: false,
        loading: false
      })
    },

    logoutAll: () => {
      // Full logout of everything
      localStorage.removeItem('access_token')
      localStorage.removeItem('cycle_access_token')
      set({
        user: null, isAuthenticated: false,
        cycleUser: null, isCycleAuthenticated: false,
        loading: false
      })
    },

    logoutDoctor: () => {
      localStorage.removeItem('access_token')
      set({ user: null, isAuthenticated: false })
    },

    logoutPatient: () => {
      localStorage.removeItem('cycle_access_token')
      set({ cycleUser: null, isCycleAuthenticated: false })
    }
  }
})


