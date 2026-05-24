import { memo } from 'react'
import clsx from 'clsx'
import type { Slot, User } from '../../types'
import { positionToCss, scaleToCss } from '../../lib/imageUtils'

interface Props {
  slot: Slot
  user?: User
  imageBaseUrl?: string
}

// memo prevents re-render when parent polls but data hasn't changed
const SlotCard = memo(function SlotCard({ slot, user, imageBaseUrl }: Props) {
  const hasUser = Boolean(user)
  const imgUrl  = user?.image ? `${imageBaseUrl ?? ''}/${user.image}` : null

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
      {imgUrl && (
        <>
          <div
            className="absolute inset-0 bg-cover"
            style={{ backgroundImage: `url(${imgUrl})`, backgroundPosition: bgPos, backgroundSize: bgSize }}
          />
          {/* Gradient: stronger at top and bottom for readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/60" />
        </>
      )}

      {/* Empty slot: subtle icon */}
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

      {/* Slot name – top left label */}
      <div className="relative z-10 px-3 pt-3 shrink-0">
        <span
          className={clsx(
            'inline-block text-[11px] font-semibold uppercase tracking-widest',
            'px-2 py-0.5 rounded-full backdrop-blur-sm border',
            hasUser
              ? 'bg-black/25 border-white/20 text-white/75'
              : 'bg-surface-600/50 border-white/10 text-white/35',
          )}
          style={slot.color ? { borderColor: slot.color + '50', color: slot.color } : {}}
        >
          {slot.name}
        </span>
      </div>

      {/* Person name – VERTICALLY AND HORIZONTALLY CENTERED */}
      <div className="absolute inset-0 flex items-center justify-center z-10 px-4">
        {hasUser ? (
          <p
            className="text-center font-bold leading-tight drop-shadow-lg"
            style={{
              fontSize: 'clamp(1.1rem, 3.5vw, 2.2rem)',
              color: user?.color ?? 'white',
            }}
          >
            {user!.displayName}
          </p>
        ) : null}
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
