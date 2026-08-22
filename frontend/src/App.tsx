import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './app/layouts/AppLayout'
import { ProtectedRoute } from './app/router/ProtectedRoute'
import { ApprovalsPage } from './features/approvals/ApprovalsPage'
import { TenantBookingPage } from './features/booking/TenantBookingPage'
import { LoginPage } from './features/auth/LoginPage'
import { SignupPage } from './features/auth/SignupPage'
import { ProfilePage } from './features/profile/ProfilePage'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { ModulePage } from './features/modules/ModulePage'
import { moduleConfigs } from './features/modules/moduleConfigs'
import { ModuleAccessProvider } from './features/modules/ModuleAccessProvider'
import { useModuleAccess } from './features/modules/useModuleAccess'
import type { ModuleConfig } from './features/modules/types'
import { useAuth } from './shared/auth/useAuth'
import { PaymentsPage } from './features/payments/PaymentsPage'

function AuthorizedModule({ config }: { config: ModuleConfig }) {
  const { session } = useAuth()
  const { modules, loading } = useModuleAccess()

  if (!session) return <Navigate to="/login" replace />
  if (loading) return null
  if (!modules.some((module) => module.resource === config.resource)) return <Navigate to="/" replace />
  return <ModulePage config={config} />
}

function AuthorizedApprovals() {
  const { session } = useAuth()
  return session?.role
    ? <ApprovalsPage />
    : <Navigate to="/" replace />
}

function AuthorizedApartments() {
  const { session } = useAuth()
  return session?.role === 'TENANT'
    ? <TenantBookingPage />
    : <Navigate to="/" replace />
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route
        element={
          <ProtectedRoute>
            <ModuleAccessProvider>
              <AppLayout />
            </ModuleAccessProvider>
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="approvals" element={<AuthorizedApprovals />} />
        <Route path="apartments" element={<AuthorizedApartments />} />
        <Route path="payments" element={<PaymentsPage />} />
        {moduleConfigs.filter((config) => config.resource !== 'payments').map((config) => (
          <Route
            key={config.resource}
            path={config.resource}
            element={<AuthorizedModule config={config} />}
          />
        ))}
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
