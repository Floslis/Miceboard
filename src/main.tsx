import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App'
import { AuthProvider } from './hooks/useAuth'

// ── URL-Bereinigung für GitHub Pages + HashRouter ────────────
// Wenn jemand Müll vor dem # tippt (z.B. /Miceboard/hjk#/admin),
// leitet die App sofort auf den sauberen Basepfad um.
;(function cleanUrl() {
  const base = import.meta.env.BASE_URL ?? '/'
  const { pathname, hash, search } = window.location
  const normalizedBase = base.endsWith('/') ? base : base + '/'
  if (pathname !== normalizedBase && pathname !== normalizedBase.slice(0, -1)) {
    window.history.replaceState(null, '', normalizedBase + (hash || '#/') + search)
  }
})()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
