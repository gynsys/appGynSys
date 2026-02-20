import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import GynSysLoader from './common/GynSysLoader'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, user, loading } = useAuthStore()

  if (loading) {
    return <GynSysLoader />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Redirect admin users to admin panel, they shouldn't access tenant dashboard
  // ONLY if they are the SaaS Superadmin
  if (user?.role === 'admin' && user?.email === 'admin@appgynsys.com') {
    return <Navigate to="/admin" replace />
  }

  return children
}

