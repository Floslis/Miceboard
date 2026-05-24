// ─────────────────────────────────────────────────────────────
// MicBoard – DisplayView
// Full-screen display page for a single display configuration
// ─────────────────────────────────────────────────────────────

import { useCallback, useState } from 'react'
import clsx from 'clsx'
import type { Display, User, RemoteData } from '../../types'
import type { GitHubConfig } from '../../lib/github'
import * as GH from '../../lib/github'
import { usePolling } from '../../hooks/usePolling'
import SlotCard from './SlotCard'

interface Props {
  displayId: string
  cfg: GitHubConfig
  showClock?: boolean
  pollInterval?: number
}

function Clock() {
  const [time, setTime] = useState(() => new Date())
  // Update every second
  useState(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  })
  return (
    <span className="text-white/40 text-sm font-mono tabular-nums">
      {time.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
    </span>
  )
}

export default function DisplayView({ displayId, cfg, showClock = true, pollInterval = 8000 }: Props) {
  const [display, setDisplay]   = useState<RemoteData<Display> | null>(null)
  const [users, setUsers]       = useState<Map<string, User>>(new Map())
  const [error, setError]       = useState<string | null>(null)
  const [isFirstLoad, setIsFirstLoad] = useState(true)

  const poll = useCallback(async () => {
    try {
      const [displayData, usersData] = await Promise.all([
        GH.getDisplay(cfg, displayId),
        GH.listUsers(cfg),
      ])
      setDisplay(displayData)
      const map = new Map<string, User>()
      usersData.forEach((u) => map.set(u.data.id, u.data))
      setUsers(map)
      setError(null)
      setIsFirstLoad(false)
    } catch (err) {
      setError((err as Error).message)
    }
  }, [cfg, displayId])

  const { lastUpdated, isPolling } = usePolling(poll, {
    interval: pollInterval,
    enabled: true,
    onError: (err) => setError(err.message),
  })

  const sortedSlots = display?.data.slots
    .slice()
    .sort((a, b) => a.order - b.order) ?? []

  const layoutCols = () => {
    const count = sortedSlots.length
    if (count <= 2) return 'grid-cols-2'
    if (count <= 3) return 'grid-cols-3'
    if (count <= 4) return 'grid-cols-4'
    if (count <= 6) return 'grid-cols-3'
    if (count <= 8) return 'grid-cols-4'
    return 'grid-cols-4'
  }

  // ── Loading ──────────────────────────────────────────────

  if (isFirstLoad) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-surface-900 gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-surface-500 border-t-brand-500 animate-spin" />
        <p className="text-white/40 text-sm">Lade Display …</p>
      </div>
    )
  }

  if (error && !display) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-surface-900">
        <div className="text-center space-y-3">
          <p className="text-2xl text-red-400">⚠</p>
          <p className="text-white/60">{error}</p>
          <p className="text-white/30 text-sm">Display-ID: {displayId}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col bg-surface-900 overflow-hidden">
      {/* Header bar */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-white/5">
        <h1 className="text-white font-semibold tracking-wide">
          {display?.data.name ?? displayId}
        </h1>
        <div className="flex items-center gap-4">
          {isPolling && (
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          )}
          {lastUpdated && (
            <span className="text-white/30 text-xs tabular-nums">
              {lastUpdated.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          {showClock && <Clock />}
        </div>
      </header>

      {/* Slot grid */}
      <main className="flex-1 p-6 min-h-0">
        <div
          className={clsx(
            'grid gap-4 h-full',
            layoutCols(),
          )}
        >
          {sortedSlots.map((slot) => (
            <SlotCard
              key={slot.id}
              slot={slot}
              user={slot.userId ? users.get(slot.userId) : undefined}
              imageBaseUrl={`https://raw.githubusercontent.com/${cfg.owner}/${cfg.repo}/${cfg.branch ?? 'main'}`}
              animate={false}
            />
          ))}
        </div>
      </main>
    </div>
  )
}
