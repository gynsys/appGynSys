// Auth store using Zustand
import { create } from 'zustand'

export const useAuthStore = create((set) => {
  // Initialize from localStorage if token exists
  const token = localStorage.getItem('access_token')
  const initialAuth = !!token

  return {
    user: null,
    isAuthenticated: initialAuth,
    
    setUser: (user) => set({ user, isAuthenticated: !!user }),
    
    logout: () => {
      localStorage.removeItem('access_token')
      set({ user: null, isAuthenticated: false })
    },
  }
})

