import { Navigate } from 'react-router-dom'
import { useAuth } from '../../shared/auth/useAuth'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session } = useAuth()

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return children
}
