import { useState, FormEvent } from 'react'
import { Lock, Mic } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export default function LoginPage() {
  const { login, error, clearError } = useAuth()
  const [password, setPassword]     = useState('')
  const [shaking, setShaking]       = useState(false)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    clearError()
    const ok = login(password)
    if (!ok) {
      setShaking(true)
      setTimeout(() => setShaking(false), 500)
      setPassword('')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-900 px-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl" />
      </div>

      <div className={`relative z-10 w-full max-w-sm ${shaking ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}>
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center mb-4">
            <Mic className="w-8 h-8 text-brand-400" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">MicBoard</h1>
          <p className="text-white/40 text-sm mt-1">Admin-Zugang</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Passwort"
              autoFocus
              autoComplete="current-password"
              className="w-full bg-surface-700 border border-white/10 rounded-2xl pl-11 pr-4 py-4 text-white placeholder-white/30 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors text-lg"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center animate-fade-in">{error}</p>
          )}

          <button
            type="submit"
            className="w-full py-4 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-lg transition-colors active:scale-95"
          >
            Einloggen
          </button>
        </form>

        <p className="text-center text-white/20 text-xs mt-8">
          MicBoard · Live Mic Display System
        </p>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
      `}</style>
    </div>
  )
}
