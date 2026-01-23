import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function ModuleProtectedRoute({ moduleCode, children }) {
    const { user } = useAuthStore()

    // Check if user has the required module enabled
    const hasModule = user?.enabled_modules?.some(m =>
        typeof m === 'string' ? m === moduleCode : m.code === moduleCode
    )

    if (!hasModule) {
        return <Navigate to="/dashboard" replace />
    }

    return children
}
