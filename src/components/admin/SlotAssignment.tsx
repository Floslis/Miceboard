// ─────────────────────────────────────────────────────────────
// MicBoard – SlotAssignment
// Quick assignment widget for a single slot on the admin panel.
// The dropdown is rendered via a React portal so it is never clipped
// by ancestor overflow:auto / overflow:hidden containers.
// ─────────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Search, X, UserX, UserMinus } from 'lucide-react'
import clsx from 'clsx'
import type { User, Slot, RemoteData } from '../../types'
import type { GitHubConfig } from '../../lib/github'
import { positionToCss } from '../../lib/imageUtils'
import { useAuthImage } from '../../hooks/useAuthImage'
import { getAuthImageUrl } from '../../lib/imageCache'

interface Props {
  slot:     Slot
  users:    RemoteData<User>[]
  cfg:      GitHubConfig
  onAssign: (slotId: string, userId: string | undefined) => Promise<void>
  saving?:  boolean
}

// ── Per-row avatar in the dropdown list ───────────────────────

function UserAvatar({ user, cfg }: { user: User; cfg: GitHubConfig }) {
  const raw = user.image
    ? `https://raw.githubusercontent.com/${cfg.owner}/${cfg.repo}/${cfg.branch ?? 'main'}/${user.image}`
    : null
  const [src, setSrc] = useState<string | null>(raw)

  const handleError = async () => {
    if (!user.image) return
    const url = await getAuthImageUrl(cfg, user.image)
    if (url) setSrc(url)
  }

  if (!src) {
    return (
      <div className="w-full h-full flex items-center justify-center text-white/40 text-sm font-bold"
        style={user.color ? { color: user.color } : {}}>
        {user.displayName.charAt(0).toUpperCase()}
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={user.displayName}
      className="w-full h-full object-cover"
      style={{ objectPosition: positionToCss(user.imagePosition?.x, user.imagePosition?.y) }}
      onError={handleError}
    />
  )
}

// ── Main component ────────────────────────────────────────────

export default function SlotAssignment({ slot, users, cfg, onAssign, saving }: Props) {
  const [open, setOpen]   = useState(false)
  const [query, setQuery] = useState('')
  const inputRef          = useRef<HTMLInputElement>(null)
  const tileRef           = useRef<HTMLButtonElement>(null)
  const dropdownRef       = useRef<HTMLDivElement>(null)

  // Fixed-position coordinates for the portal dropdown
  const [ddPos, setDdPos] = useState<{ top: number; left: number; width: number }>({
    top: 0, left: 0, width: 288,
  })

  const assigned   = users.find((u) => u.data.id === slot.userId)?.data
  const slotBgUrl  = useAuthImage(assigned?.image ? cfg : null, assigned?.image ?? null)

  const filtered = users
    .map((u) => u.data)
    .filter((u) =>
      u.active !== false &&
      (
        u.displayName.toLowerCase().includes(query.toLowerCase()) ||
        u.fullName.toLowerCase().includes(query.toLowerCase()) ||
        (u.role?.toLowerCase().includes(query.toLowerCase()) ?? false)
      ),
    )

  // Compute dropdown position when opening
  useEffect(() => {
    if (!open || !tileRef.current) return
    const rect = tileRef.current.getBoundingClientRect()
    const vpW  = window.innerWidth
    const ddW  = Math.max(288, rect.width)
    // Flip left if dropdown would overflow the right edge
    const left = rect.left + ddW > vpW ? Math.max(4, vpW - ddW - 4) : rect.left
    setDdPos({ top: rect.bottom + 8, left, width: ddW })
    setQuery('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  // Close on outside click or scroll
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (
        tileRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      ) return
      setOpen(false)
    }
    const onScroll = () => setOpen(false)
    document.addEventListener('mousedown', onDown)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [open])

  const select = async (userId: string | undefined) => {
    setOpen(false)
    await onAssign(slot.id, userId)
  }

  // ── Portal dropdown ───────────────────────────────────────

  const dropdown = open ? createPortal(
    <div
      ref={dropdownRef}
      style={{
        position: 'fixed',
        top:      ddPos.top,
        left:     ddPos.left,
        width:    ddPos.width,
        zIndex:   9999,
      }}
      className="bg-surface-700 border border-white/15 rounded-2xl shadow-2xl overflow-hidden animate-slide-up"
    >
      {/* Search */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-white/10">
        <Search className="w-4 h-4 text-white/40 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Person suchen …"
          className="flex-1 bg-transparent text-white placeholder-white/30 text-sm outline-none"
        />
        {query && (
          <button onClick={() => setQuery('')} className="text-white/40 hover:text-white/70">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Clear / unassign option */}
      <button
        onClick={() => select(undefined)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 text-left"
      >
        <div className="w-9 h-9 rounded-full bg-surface-600 flex items-center justify-center shrink-0">
          <UserX className="w-4 h-4 text-white/40" />
        </div>
        <div>
          <p className="text-sm text-white/50 font-medium">Niemanden zuweisen</p>
          <p className="text-xs text-white/25">Slot leeren</p>
        </div>
      </button>

      {/* User list */}
      <div className="max-h-64 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="px-4 py-6 text-center text-white/30 text-sm">Keine Personen gefunden</p>
        ) : (
          filtered.map((user) => (
            <button
              key={user.id}
              onClick={() => select(user.id)}
              className={clsx(
                'w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left',
                slot.userId === user.id && 'bg-brand-600/10',
              )}
            >
              <div className="w-9 h-9 rounded-full overflow-hidden bg-surface-600 shrink-0">
                <UserAvatar user={user} cfg={cfg} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-semibold truncate">{user.displayName}</p>
                {user.fullName !== user.displayName && (
                  <p className="text-xs text-white/40 truncate">{user.fullName}</p>
                )}
              </div>
              {slot.userId === user.id && (
                <div className="w-2 h-2 rounded-full bg-brand-400 shrink-0" />
              )}
            </button>
          ))
        )}
      </div>
    </div>,
    document.body,
  ) : null

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="relative h-full group/tile">

      {/* ── Slot tile (assignment trigger) ── */}
      <button
        ref={tileRef}
        onClick={() => !saving && setOpen((p) => !p)}
        disabled={saving}
        className={clsx(
          'relative flex flex-col overflow-hidden rounded-2xl border transition-all w-full h-full',
          'group',
          open
            ? 'border-brand-500/60 ring-1 ring-brand-500/30'
            : 'border-white/10 hover:border-white/25',
          saving ? 'opacity-60 cursor-wait' : 'cursor-pointer',
        )}
      >
        {/* Background image */}
        {assigned?.image && slotBgUrl ? (
          <>
            <div className="absolute inset-0 overflow-hidden">
              <img
                src={slotBgUrl}
                alt=""
                className="w-full h-full object-cover select-none pointer-events-none"
                draggable={false}
                style={{
                  objectPosition: positionToCss(assigned.imagePosition?.x, assigned.imagePosition?.y),
                  transform:      (assigned.imageScale ?? 1) !== 1 ? `scale(${assigned.imageScale})` : undefined,
                  transformOrigin: `${assigned.imagePosition?.x ?? 50}% ${assigned.imagePosition?.y ?? 30}%`,
                }}
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
          </>
        ) : (
          <div className="absolute inset-0 bg-surface-700" />
        )}

        {/* Slot name badge */}
        <div className="relative z-10 px-3 pt-3">
          <span
            className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full bg-black/30 border border-white/20 text-white/80"
            style={slot.color ? { borderColor: slot.color + '60', color: slot.color } : {}}
          >
            {slot.name}
          </span>
        </div>

        <div className="flex-1" />

        {/* Person name */}
        <div className="relative z-10 px-3 pb-3">
          {assigned ? (
            <p className="text-lg font-bold text-white leading-tight drop-shadow-lg"
              style={assigned.color ? { color: assigned.color } : {}}>
              {assigned.displayName}
            </p>
          ) : (
            <p className="text-sm text-white/30">Niemand</p>
          )}
        </div>

        {/* Edit hint overlay */}
        <div className="absolute inset-0 bg-brand-600/0 group-hover:bg-brand-600/10 transition-colors rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100">
          <span className="bg-black/60 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
            {assigned ? 'Ändern' : 'Zuweisen'}
          </span>
        </div>

        {/* Saving spinner */}
        {saving && (
          <div className="absolute inset-0 bg-surface-900/70 flex items-center justify-center rounded-2xl">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </button>

      {/* ── Unassign quick-button (outside the tile button, no nesting) ── */}
      {assigned && !saving && (
        <button
          onClick={() => select(undefined)}
          title="Zuweisung aufheben"
          className={clsx(
            'absolute top-2 right-2 z-10',
            'w-6 h-6 rounded-full flex items-center justify-center',
            'bg-black/50 border border-white/20',
            'opacity-0 group-hover/tile:opacity-100',
            'hover:bg-red-500/30 hover:border-red-400/40 transition-all',
          )}
        >
          <UserMinus className="w-3 h-3 text-white/70" />
        </button>
      )}

      {/* Portal dropdown */}
      {dropdown}
    </div>
  )
}
