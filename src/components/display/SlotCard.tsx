// ─────────────────────────────────────────────────────────────
// MicBoard – SlotCard (Display mode)
// Full-screen slot tile with background image + name overlay
// ─────────────────────────────────────────────────────────────

import clsx from 'clsx'
import type { Slot, User } from '../../types'
import { positionToCss, scaleToCss } from '../../lib/imageUtils'

interface Props {
  slot: Slot
  user?: User
  imageBaseUrl?: string     // Base URL prefix for raw image URLs
  animate?: boolean
}

export default function SlotCard({ slot, user, imageBaseUrl, animate }: Props) {
  const hasUser = Boolean(user)
  const imgPath = user?.image
    ? `${imageBaseUrl ?? ''}/${user.image}`
    : null

  const bgPosition = positionToCss(user?.imagePosition?.x, user?.imagePosition?.y)
  const bgSize     = scaleToCss(user?.imageScale ?? 1.15)

  return (
    <div
      className={clsx(
        'relative flex flex-col overflow-hidden rounded-2xl',
        'bg-surface-700 border border-white/5',
        'aspect-[3/4] min-h-0 select-none',
        animate && 'animate-fade-in',
      )}
    >
      {/* Background image */}
      {imgPath && (
        <>
          <div
            className="absolute inset-0 bg-cover transition-all duration-700"
            style={{
              backgroundImage: `url(${imgPath})`,
              backgroundPosition: bgPosition,
              backgroundSize: bgSize,
            }}
          />
          {/* Dark gradient overlay – heavier at bottom for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
        </>
      )}

      {/* Empty slot placeholder */}
      {!hasUser && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 6a4 4 0 0 0-4 4v2a4 4 0 0 0 8 0v-2a4 4 0 0 0-4-4Z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M6 14a6 6 0 0 0 12 0" />
              <line x1="12" y1="20" x2="12" y2="23" strokeLinecap="round" strokeWidth={1.5} />
            </svg>
          </div>
        </div>
      )}

      {/* Slot name – top */}
      <div className="relative z-10 px-4 pt-4">
        <span
          className={clsx(
            'text-xs font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full',
            'backdrop-blur-sm border',
            hasUser
              ? 'bg-black/30 border-white/20 text-white/80'
              : 'bg-surface-600/60 border-white/10 text-white/40',
          )}
          style={slot.color ? { borderColor: slot.color + '60', color: slot.color } : {}}
        >
          {slot.name}
        </span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Person name – bottom */}
      <div className="relative z-10 px-4 pb-5">
        {hasUser ? (
          <p
            className="text-3xl font-bold text-white leading-tight drop-shadow-lg"
            style={user?.color ? { color: user.color } : {}}
          >
            {user!.displayName}
          </p>
        ) : (
          <p className="text-lg text-white/25 font-medium">—</p>
        )}
      </div>

      {/* Bottom accent line */}
      {hasUser && (
        <div
          className="absolute bottom-0 left-0 right-0 h-0.5 opacity-60"
          style={{
            background: user?.color
              ? user.color
              : 'linear-gradient(90deg, transparent, #6366f1, transparent)',
          }}
        />
      )}
    </div>
  )
}
