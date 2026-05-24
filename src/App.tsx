import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { isConfigured } from './lib/config'
import { useAuth } from './hooks/useAuth'
import LoginPage   from './pages/LoginPage'
import SetupPage   from './pages/SetupPage'
import AdminPage   from './pages/AdminPage'
import DisplayPage from './pages/DisplayPage'

// ── Protected admin route ────────────────────────────────────

function AdminRoute() {
  const { isAuthenticated } = useAuth()
  if (!isConfigured()) return <Navigate to="/setup" replace />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <AdminPage />
}

// ── App root ─────────────────────────────────────────────────

export default function App() {
  const basePath = import.meta.env.VITE_BASE_PATH ?? '/'

  return (
    <BrowserRouter basename={basePath === '/' ? undefined : basePath}>
      <Routes>
        {/* Setup wizard */}
        <Route
          path="/setup"
          element={<SetupPage onDone={() => { window.location.href = '/admin' }} />}
        />

        {/* Login page */}
        <Route path="/login" element={<LoginPage />} />

        {/* Display pages – publicly accessible, no auth */}
        <Route path="/display/:displayId" element={<DisplayPage />} />

        {/* Admin panel – protected */}
        <Route path="/admin" element={<AdminRoute />} />

        {/* Default redirect */}
        <Route
          path="/"
          element={
            isConfigured()
              ? <Navigate to="/admin" replace />
              : <Navigate to="/setup" replace />
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
