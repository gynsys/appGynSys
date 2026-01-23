// Toast notification store using Zustand
import { create } from 'zustand'

export const useToastStore = create((set) => ({
  toasts: [],
  
  showToast: (message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random()
    const toast = { id, message, type, duration }
    
    set((state) => ({
      toasts: [...state.toasts, toast]
    }))
    
    // Auto remove after duration
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id)
      }))
    }, duration)
    
    return id
  },
  
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id)
    }))
  },
  
  success: (message, duration) => {
    return useToastStore.getState().showToast(message, 'success', duration)
  },
  
  error: (message, duration) => {
    return useToastStore.getState().showToast(message, 'error', duration)
  },
  
  info: (message, duration) => {
    return useToastStore.getState().showToast(message, 'info', duration)
  },
  
  warning: (message, duration) => {
    return useToastStore.getState().showToast(message, 'warning', duration)
  },
}))

