import { memo } from 'react'
import clsx from 'clsx'
import type { Slot, User } from '../../types'
import type { GitHubConfig } from '../../lib/github'
import { positionToCss, scaleToCss } from '../../lib/imageUtils'
import { useAuthImage } from '../../hooks/useAuthImage'

interface Props {
  slot:         Slot
  user?:        User
  cfg:          GitHubConfig
  /** @deprecated pass cfg instead */
  imageBaseUrl?: string
}

// memo prevents re-render when parent polls but data hasn't changed
const SlotCard = memo(function SlotCard({ slot, user, cfg }: Props) {
  const hasUser = Boolean(user)

  // Authenticated image fetch – works for both private and public repos
  const bgUrl = useAuthImage(user?.image ? cfg : null, user?.image ?? null)

  const bgPos  = positionToCss(user?.imagePosition?.x, user?.imagePosition?.y)
  const bgSize = scaleToCss(user?.imageScale ?? 1.15)

  return (
    <div
      className={clsx(
        'relative flex flex-col overflow-hidden rounded-xl select-none h-full',
        'bg-surface-700 border border-white/5',
      )}
    >
      {/* Background image */}
      {bgUrl && (
        <>
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:    `url(${bgUrl})`,
              backgroundPosition: bgPos,
              backgroundSize:     bgSize,
              backgroundRepeat:   'no-repeat',
            }}
          />
          {/* Gradient: stronger top + bottom for readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/20 to-black/60" />
        </>
      )}

      {/* Empty slot: subtle mic icon */}
      {!hasUser && (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="w-10 h-10 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 6a4 4 0 0 0-4 4v2a4 4 0 0 0 8 0v-2a4 4 0 0 0-4-4Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 14a6 6 0 0 0 12 0" />
            <line x1="12" y1="20" x2="12" y2="23" strokeLinecap="round" />
          </svg>
        </div>
      )}

      {/* Slot name – TOP CENTER, large enough to read on a big screen */}
      <div className="relative z-10 w-full flex justify-center pt-4 shrink-0">
        <p
          className={clsx(
            'font-bold uppercase tracking-widest drop-shadow-md text-center px-3',
            hasUser ? 'text-white/80' : 'text-white/30',
          )}
          style={{
            fontSize: 'clamp(0.75rem, 1.4vw, 1.15rem)',
            color: slot.color ?? undefined,
          }}
        >
          {slot.name}
        </p>
      </div>

      {/* Person name – VERTICALLY AND HORIZONTALLY CENTERED */}
      <div className="absolute inset-0 flex items-center justify-center z-10 px-4">
        {hasUser && (
          <p
            className="text-center font-bold leading-tight drop-shadow-lg"
            style={{
              fontSize: 'clamp(1.1rem, 3.5vw, 2.4rem)',
              color: user?.color ?? 'white',
            }}
          >
            {user!.displayName}
          </p>
        )}
      </div>

      {/* Bottom accent line */}
      {hasUser && (
        <div
          className="absolute bottom-0 left-0 right-0 h-0.5 opacity-50"
          style={{
            background: user?.color
              ? user.color
              : 'linear-gradient(90deg,transparent,#6366f1,transparent)',
          }}
        />
      )}
    </div>
  )
})

export default SlotCard
