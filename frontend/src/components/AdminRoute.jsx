import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import GynSysLoader from '../components/common/GynSysLoader'
import { useEffect } from 'react'

export default function AdminRoute({ children }) {
  const { isAuthenticated, user, loading, loadUser } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated && !user) {
      loadUser()
    }
  }, [isAuthenticated, user, loadUser])

  if (loading) {
    return <GynSysLoader />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Check if user has admin role AND is the superadmin
  if (!user || user.role !== 'admin' || user.email !== 'admin@appgynsys.com') {
    return <Navigate to="/dashboard" replace />
  }

  return children
}