import { AuthProvider } from './hooks/AuthProvider'
import { useAuth } from './hooks/useAuth'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import LoadingSpinner from './components/shared/LoadingSpinner'

function AppRoutes() {
  const { authUser, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner label="Loading…" />
      </div>
    )
  }

  if (!authUser || !profile) {
    return <Login />
  }

  return <Dashboard />
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
