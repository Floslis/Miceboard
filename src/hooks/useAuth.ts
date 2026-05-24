// ─────────────────────────────────────────────────────────────
// MicBoard – Auth Hook
// Simple session-based password authentication for the admin panel
// ─────────────────────────────────────────────────────────────

import { useState, useCallback, useEffect } from 'react'
import { ADMIN_PASSWORD } from '../lib/config'

const SESSION_KEY = 'micboard_auth'

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(SESSION_KEY) === 'true'
    } catch {
      return false
    }
  })

  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Sync across tabs (storage event)
    const handler = (e: StorageEvent) => {
      if (e.key === SESSION_KEY) {
        setIsAuthenticated(e.newValue === 'true')
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  const login = useCallback((password: string): boolean => {
    setError(null)

    // Allow any password if none is configured (development mode)
    const expected = ADMIN_PASSWORD

    if (!expected || password === expected) {
      sessionStorage.setItem(SESSION_KEY, 'true')
      setIsAuthenticated(true)
      return true
    }

    setError('Falsches Passwort. Bitte erneut versuchen.')
    return false
  }, [])

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY)
    setIsAuthenticated(false)
  }, [])

  return { isAuthenticated, login, logout, error, clearError: () => setError(null) }
}
