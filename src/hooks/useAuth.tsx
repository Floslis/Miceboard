// ─────────────────────────────────────────────────────────────
// MicBoard – Auth Context + Hook
// Single source of truth for authentication state.
// All components that call useAuth() share the SAME state.
// ─────────────────────────────────────────────────────────────

import {
  createContext, useContext, useState, useCallback,
  useEffect, type ReactNode,
} from 'react'
import { ADMIN_PASSWORD } from '../lib/config'
import { signInAdmin, signOutAdmin } from '../lib/firebase'

const SESSION_KEY = 'micboard_auth'

interface AuthCtx {
  isAuthenticated: boolean
  error: string | null
  login: (password: string) => boolean
  logout: () => void
  clearError: () => void
}

const AuthContext = createContext<AuthCtx | null>(null)

// ── Provider ─────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try { return sessionStorage.getItem(SESSION_KEY) === 'true' } catch { return false }
  })
  const [error, setError] = useState<string | null>(null)

  // Keep sessionStorage in sync
  useEffect(() => {
    try {
      if (isAuthenticated) sessionStorage.setItem(SESSION_KEY, 'true')
      else sessionStorage.removeItem(SESSION_KEY)
    } catch { /* ignore */ }
  }, [isAuthenticated])

  // On every page load: if already authenticated, re-establish Firebase auth.
  // Firebase Anonymous Auth does not survive a full page reload unless we call
  // signInAnonymously() again — sessionStorage remembers our app state but not
  // the Firebase session.
  useEffect(() => {
    if (isAuthenticated) {
      signInAdmin().catch(() => { /* non-fatal */ })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally only on mount

  const login = useCallback((password: string): boolean => {
    setError(null)
    const expected = ADMIN_PASSWORD
    if (!expected || password === expected) {
      setIsAuthenticated(true)
      // Sign in to Firebase so write rules pass
      signInAdmin().catch(() => { /* non-fatal if offline */ })
      return true
    }
    setError('Falsches Passwort. Bitte erneut versuchen.')
    return false
  }, [])

  const logout = useCallback(() => {
    setIsAuthenticated(false)
    signOutAdmin().catch(() => { /* non-fatal */ })
  }, [])

  return (
    <AuthContext.Provider value={{ isAuthenticated, error, login, logout, clearError: () => setError(null) }}>
      {children}
    </AuthContext.Provider>
  )
}

// ── Hook ─────────────────────────────────────────────────────

export function useAuth(): AuthCtx {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
