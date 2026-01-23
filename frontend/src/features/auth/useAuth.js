import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../../services/authService'
import { doctorService } from '../../services/doctorService'
import { useAuthStore } from '../../store/authStore'

export function useAuth() {
  const navigate = useNavigate()
  const { user, isAuthenticated, setUser, logout: logoutStore } = useAuthStore()
  const [loading, setLoading] = useState(true)

  // Fetch user info from API
  const fetchUserInfo = async () => {
    try {
      const userData = await authService.getCurrentUser()
      setUser(userData)
      // Persist theme preference for login page
      if (userData?.design_template === 'dark') {
        localStorage.setItem('theme_preference', 'dark')
      } else {
        localStorage.setItem('theme_preference', 'light')
      }
      return userData
    } catch (error) {
      // If token is invalid, clear it
      if (error.response?.status === 401) {
        localStorage.removeItem('access_token')
        logoutStore()
      }
      throw error
    }
  }

  useEffect(() => {
    // Check if user is authenticated on mount
    const token = localStorage.getItem('access_token')
    if (token && !user) {
      // Fetch user info from API
      fetchUserInfo()
        .then(() => setLoading(false))
        .catch(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [user, setUser, logoutStore])

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password)
      // Fetch user info after successful login
      if (response.access_token) {
        const userData = await fetchUserInfo()
        return { ...response, user: userData }
      }
      return response
    } catch (error) {
      throw error
    }
  }

  const register = async (userData) => {
    try {
      const response = await authService.register(userData)
      // Auto-login after registration
      if (response.email) {
        await login(userData.email, userData.password)
      }
      return response
    } catch (error) {
      throw error
    }
  }

  const logout = (redirectToLogin = false) => {
    authService.logout()
    logoutStore()
    // Only redirect if explicitly requested
    if (redirectToLogin === true) {
      navigate('/login')
    }
    // Otherwise, stay on current page (don't navigate)
  }

  const loginWithGoogle = () => {
    authService.loginWithGoogle()
  }

  return {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    loginWithGoogle,
    refreshUser: fetchUserInfo,
    requestPasswordReset: authService.requestPasswordReset,
    resetPassword: authService.resetPassword,
    resetCyclePassword: authService.resetCyclePassword,
  }
}

