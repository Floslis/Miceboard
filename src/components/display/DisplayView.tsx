import { useCallback, useState, useEffect, useRef, memo } from 'react'
import type { Display, User, RemoteData } from '../../types'
import type { GitHubConfig } from '../../lib/github'
import * as GH from '../../lib/github'
import { usePolling } from '../../hooks/usePolling'
import SlotCard from './SlotCard'

interface Props {
  displayId: string
  cfg: GitHubConfig       // Must be a stable reference (memoized in parent)
  showClock?: boolean
  pollInterval?: number
}

// Clock rendered separately so it doesn't cause slot re-renders
const Clock = memo(function Clock() {
  const [time, setTime] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <span className="text-white/40 text-sm font-mono tabular-nums">
      {time.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
    </span>
  )
})

export default function DisplayView({ displayId, cfg, showClock = true, pollInterval = 8000 }: Props) {
  const [display, setDisplay]     = useState<RemoteData<Display> | null>(null)
  const [users, setUsers]         = useState<Map<string, User>>(new Map())
  const [error, setError]         = useState<string | null>(null)
  const [isFirstLoad, setIsFirstLoad] = useState(true)

  // Track previous SHA so we skip re-renders when nothing changed
  const prevShаRef = useRef<string>('')

  const poll = useCallback(async () => {
    const [displayData, usersData] = await Promise.all([
      GH.getDisplay(cfg, displayId),
      GH.listUsers(cfg),
    ])
    // Only update state when data actually changed (avoids pointless re-renders)
    if (displayData.sha !== prevShаRef.current) {
      prevShаRef.current = displayData.sha
      setDisplay(displayData)
      const map = new Map<string, User>()
      usersData.forEach((u) => map.set(u.data.id, u.data))
      setUsers(map)
    }
    setError(null)
    setIsFirstLoad(false)
  // cfg and displayId are stable (memoized in DisplayPage) – safe as deps
  }, [cfg, displayId])

  const { lastUpdated, isPolling } = usePolling(poll, {
    interval: pollInterval,
    enabled: true,
    // onError intentionally omitted from options object to keep it stable;
    // usePolling stores it in a ref internally
    onError: useCallback((err: Error) => setError(err.message), []),
  })

  const sortedSlots = display?.data.slots.slice().sort((a, b) => a.order - b.order) ?? []
  const slotCount   = sortedSlots.length
  const gap         = display?.data.slotGap ?? 12
  const slotWidth   = display?.data.slotWidth  // undefined = auto

  // Build grid-template-columns
  const gridCols = slotWidth
    ? `repeat(auto-fill, ${slotWidth}px)`
    : `repeat(${Math.max(slotCount, 1)}, 1fr)`

  // ── Loading ──────────────────────────────────────────────

  if (isFirstLoad) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-surface-900 gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-surface-500 border-t-brand-500 animate-spin" />
        <p className="text-white/30 text-sm">Lade Display …</p>
      </div>
    )
  }

  if (error && !display) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-surface-900">
        <div className="text-center space-y-2">
          <p className="text-2xl text-red-400/60">⚠</p>
          <p className="text-white/50 text-sm">{error}</p>
          <p className="text-white/25 text-xs">Display-ID: {displayId}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col bg-surface-900 overflow-hidden">

      {/* ── Thin header bar ───────────────────────────────── */}
      <header className="flex items-center justify-between px-4 shrink-0" style={{ height: 40 }}>
        <span className="text-white/50 text-xs font-semibold tracking-wide truncate">
          {display?.data.name ?? displayId}
        </span>
        <div className="flex items-center gap-3 shrink-0">
          {isPolling && <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
          {lastUpdated && (
            <span className="text-white/25 text-xs tabular-nums">
              {lastUpdated.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          {showClock && <Clock />}
        </div>
      </header>

      {/* ── Slot grid fills everything below header ───────── */}
      <div
        className="flex-1 min-h-0 overflow-hidden"
        style={{ padding: gap }}
      >
        <div
          className="h-full"
          style={{
            display: 'grid',
            gridTemplateColumns: gridCols,
            gap,
          }}
        >
          {sortedSlots.map((slot) => (
            <SlotCard
              key={slot.id}
              slot={slot}
              user={slot.userId ? users.get(slot.userId) : undefined}
              cfg={cfg}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
