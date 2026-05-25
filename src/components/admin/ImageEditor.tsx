// ─────────────────────────────────────────────────────────────
// MicBoard – ImageEditor
// Visual slot-preview image editor: drag to pan, slider to zoom.
// The preview mirrors the exact slot proportions of the target display.
// ─────────────────────────────────────────────────────────────

import { useRef, useCallback } from 'react'
import { Move, ZoomIn } from 'lucide-react'
import type { DisplayAspectRatio } from '../../types'

// ── Display geometry ─────────────────────────────────────────

export const DISPLAY_ASPECT_RATIOS: Record<DisplayAspectRatio, number> = {
  '16:9':  16 / 9,
  '21:9':  21 / 9,
  '32:9':  32 / 9,
}

/**
 * Compute the width-to-height ratio of a single slot on a display.
 *   slotRatio = (displayWidth / slotCount) / displayHeight
 *   e.g. 16:9 with 4 slots → (16/4)/9 = 0.444 (portrait)
 */
export function computeSlotRatio(aspectRatio: DisplayAspectRatio, slotCount: number): number {
  return DISPLAY_ASPECT_RATIOS[aspectRatio] / Math.max(1, slotCount)
}

// ── Props ──────────────────────────────────────────────────

interface Props {
  imgSrc:       string
  position:     { x: number; y: number }
  scale:        number
  aspectRatio:  DisplayAspectRatio
  slotCount:    number
  onPositionChange: (pos: { x: number; y: number }) => void
  onScaleChange:    (scale: number) => void
}

// ── Component ──────────────────────────────────────────────

const PREVIEW_H = 260  // fixed preview height in px

export default function ImageEditor({
  imgSrc, position, scale, aspectRatio, slotCount,
  onPositionChange, onScaleChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const dragRef      = useRef<{
    startX: number; startY: number
    startPosX: number; startPosY: number
  } | null>(null)

  // ── Drag-to-pan ─────────────────────────────────────────
  // Dragging right moves the image right → focal point shifts left (x decreases)
  // Dragging down  moves the image down  → focal point shifts up  (y decreases)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragRef.current = {
      startX: e.clientX, startY: e.clientY,
      startPosX: position.x, startPosY: position.y,
    }

    const onMove = (me: MouseEvent) => {
      if (!dragRef.current || !containerRef.current) return
      const W = containerRef.current.clientWidth
      const H = containerRef.current.clientHeight
      const dx = me.clientX - dragRef.current.startX
      const dy = me.clientY - dragRef.current.startY
      const newX = Math.max(0, Math.min(100, dragRef.current.startPosX - (dx / W) * 100))
      const newY = Math.max(0, Math.min(100, dragRef.current.startPosY - (dy / H) * 100))
      onPositionChange({ x: Math.round(newX * 10) / 10, y: Math.round(newY * 10) / 10 })
    }

    const onUp = () => {
      dragRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [position.x, position.y, onPositionChange])

  // ── Touch support ────────────────────────────────────────

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    dragRef.current = {
      startX: touch.clientX, startY: touch.clientY,
      startPosX: position.x, startPosY: position.y,
    }
  }, [position.x, position.y])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragRef.current || !containerRef.current) return
    e.preventDefault()
    const touch = e.touches[0]
    const W = containerRef.current.clientWidth
    const H = containerRef.current.clientHeight
    const dx = touch.clientX - dragRef.current.startX
    const dy = touch.clientY - dragRef.current.startY
    const newX = Math.max(0, Math.min(100, dragRef.current.startPosX - (dx / W) * 100))
    const newY = Math.max(0, Math.min(100, dragRef.current.startPosY - (dy / H) * 100))
    onPositionChange({ x: Math.round(newX * 10) / 10, y: Math.round(newY * 10) / 10 })
  }, [onPositionChange])

  const handleTouchEnd = useCallback(() => { dragRef.current = null }, [])

  // ── Geometry ─────────────────────────────────────────────

  const slotRatio  = computeSlotRatio(aspectRatio, slotCount)
  const previewH   = PREVIEW_H
  const previewW   = Math.round(previewH * slotRatio)

  // ── Render ───────────────────────────────────────────────

  return (
    <div className="flex flex-col items-center gap-4 select-none">

      {/* Slot preview */}
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-xl border border-white/15 bg-surface-900 cursor-grab active:cursor-grabbing"
        style={{ width: previewW, height: previewH, touchAction: 'none' }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        title="Ziehen zum Verschieben"
      >
        {/* Image – object-fit cover, same render logic as SlotCard */}
        <img
          src={imgSrc}
          alt=""
          className="w-full h-full object-cover pointer-events-none"
          draggable={false}
          style={{
            objectPosition: `${position.x}% ${position.y}%`,
            transform: scale !== 1 ? `scale(${scale})` : undefined,
            transformOrigin: `${position.x}% ${position.y}%`,
          }}
        />

        {/* Overlay gradient matching SlotCard */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/15 to-black/55 pointer-events-none" />

        {/* Focal-point crosshair */}
        <div
          className="absolute w-5 h-5 pointer-events-none"
          style={{
            left:      `${position.x}%`,
            top:       `${position.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Circle */}
          <div className="absolute inset-0 rounded-full border-2 border-white/80 shadow-lg" />
          {/* Vertical bar */}
          <div className="absolute left-1/2 -top-2 -bottom-2 w-px bg-white/50" style={{ transform: 'translateX(-50%)' }} />
          {/* Horizontal bar */}
          <div className="absolute top-1/2 -left-2 -right-2 h-px bg-white/50" style={{ transform: 'translateY(-50%)' }} />
        </div>

        {/* Slot label preview (top) */}
        <div className="absolute top-0 left-0 right-0 flex justify-center pt-2.5 pointer-events-none z-10">
          <span
            className="font-bold uppercase tracking-widest text-white/80 drop-shadow-md text-center"
            style={{ fontSize: 'clamp(0.6rem, 1.2vw, 0.9rem)' }}
          >
            Vorschau
          </span>
        </div>

        {/* Move hint */}
        <div className="absolute bottom-2 right-2 pointer-events-none">
          <Move className="w-3.5 h-3.5 text-white/30" />
        </div>
      </div>

      {/* Coordinates readout */}
      <div className="flex gap-4 text-xs font-mono text-white/30">
        <span>x: {position.x.toFixed(0)}%</span>
        <span>y: {position.y.toFixed(0)}%</span>
        <span>zoom: {Math.round(scale * 100)}%</span>
      </div>

      {/* Scale slider */}
      <div className="w-full space-y-1.5 max-w-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-white/50">
            <ZoomIn className="w-3.5 h-3.5" />
            <span>Zoom</span>
          </div>
          <span className="text-xs text-white/40 font-mono">{Math.round(scale * 100)}%</span>
        </div>
        <input
          type="range"
          min={100} max={300} step={5}
          value={Math.round(scale * 100)}
          onChange={(e) => onScaleChange(Number(e.target.value) / 100)}
          className="w-full accent-brand-500"
        />
        <div className="flex justify-between text-[10px] text-white/20">
          <span>100%</span>
          <span>300%</span>
        </div>
      </div>
    </div>
  )
}
