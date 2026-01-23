import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import Spinner from '../components/common/Spinner'
import { useEffect } from 'react'

export default function AdminRoute({ children }) {
  const { isAuthenticated, user, loading, loadUser } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated && !user) {
      loadUser()
    }
  }, [isAuthenticated, user, loadUser])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Check if user has admin role
  if (!user || user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return children
}