import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ allowedRoles }) {
  const { token, user } = useAuth()
  const role = localStorage.getItem('role') || user?.role

  if (!token) return <Navigate to="/login" replace />
  
  if (allowedRoles && !allowedRoles.includes(role)) {
    // Prevent infinite loop: only navigate if we aren't already going to the correct portal
    if (role === 'BORROWER') {
        return <Navigate to="/borrower/dashboard" replace />
    }
    // If no role or unauthorized admin access, go to login
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
