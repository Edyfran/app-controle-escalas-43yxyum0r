import { Navigate, Outlet } from 'react-router-dom'
import useAppStore from '@/stores/main'

export function ProtectedRoute() {
  const { session, loading, userType } = useAppStore()

  if (loading) return null
  if (!session) return <Navigate to="/login" replace />
  if (userType !== 'coordinator') return <Navigate to="/portal" replace />
  return <Outlet />
}

export function PublicOnlyRoute() {
  const { session, loading, userType } = useAppStore()

  if (loading) return null
  if (session && userType === 'coordinator') return <Navigate to="/" replace />
  if (session && userType !== null) return <Navigate to="/portal" replace />
  return <Outlet />
}

export function MemberProtectedRoute() {
  const { session, loading, userType } = useAppStore()

  if (loading) return null
  if (!session) return <Navigate to="/portal/entrar" replace />
  if (userType === 'coordinator') return <Navigate to="/" replace />
  return <Outlet />
}

export function MemberPublicOnlyRoute() {
  const { session, loading, userType } = useAppStore()

  if (loading) return null
  if (session && userType === 'coordinator') return <Navigate to="/" replace />
  if (session && userType !== null) return <Navigate to="/portal" replace />
  return <Outlet />
}
