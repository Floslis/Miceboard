// ─────────────────────────────────────────────────────────────
// MicBoard – UserEditor
// Create / edit a user with live slot preview
// ─────────────────────────────────────────────────────────────

import { useState, useRef, useCallback } from 'react'
import { Upload, X, Save, Trash2, Eye, RefreshCw } from 'lucide-react'
import clsx from 'clsx'
import type { User, RemoteData } from '../../types'
import type { GitHubConfig } from '../../lib/github'
import * as GH from '../../lib/github'
import {
  fileToWebP,
  isValidImageFile,
  generateImageFilename,
  positionToCss,
  scaleToCss,
} from '../../lib/imageUtils'

interface Props {
  existing?: RemoteData<User>
  cfg: GitHubConfig
  onSaved: (user: User) => void
  onDeleted?: () => void
  onCancel: () => void
}

function generateId(): string {
  return 'user-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

// ── Color palettes ────────────────────────────────────────────

const PALETTES = {
  Pastell: ['#f0abfc','#a5b4fc','#86efac','#fcd34d','#fb923c','#f9a8d4','#7dd3fc','#6ee7b7','#c4b5fd','#fdba74'],
  Kräftig: ['#ec4899','#6366f1','#10b981','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#14b8a6','#f97316','#84cc16'],
  Neutral: ['#ffffff','#e2e8f0','#94a3b8','#64748b','#475569','#334155','#1e293b','#f1f5f9','#cbd5e1','#e7e5e4'],
} as const

type PaletteName = keyof typeof PALETTES

function ColorPicker({ value, onChange }: { value?: string; onChange: (c: string | undefined) => void }) {
  const [palette, setPalette] = useState<PaletteName>('Kräftig')
  const colors = PALETTES[palette]

  const cycle = () => {
    const idx = (colors as readonly string[]).indexOf(value ?? '')
    const next = colors[(idx + 1) % colors.length]
    onChange(next)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-white/50">
          Akzentfarbe
        </span>
        <div className="flex items-center gap-1">
          {(Object.keys(PALETTES) as PaletteName[]).map((p) => (
            <button
              key={p}
              onClick={() => setPalette(p)}
              className={clsx(
                'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
                palette === p
                  ? 'bg-brand-600 text-white'
                  : 'bg-surface-600 text-white/50 hover:text-white hover:bg-surface-500',
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Swatch grid */}
      <div className="flex flex-wrap gap-2">
        {colors.map((c) => (
          <button
            key={c}
            onClick={() => onChange(value === c ? undefined : c)}
            title={c}
            className={clsx(
              'w-7 h-7 rounded-lg transition-all',
              value === c
                ? 'ring-2 ring-white ring-offset-2 ring-offset-surface-800 scale-110'
                : 'hover:scale-110',
            )}
            style={{ background: c }}
          />
        ))}
      </div>

      {/* Row: color input + hex + cycle + clear */}
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value ?? '#6366f1'}
          onChange={(e) => onChange(e.target.value)}
          className="w-9 h-9 rounded-lg cursor-pointer border-0 bg-transparent p-0.5 shrink-0"
        />
        <input
          type="text"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value || undefined)}
          placeholder="z. B. #6366f1"
          className="flex-1 bg-surface-700 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/25 font-mono text-xs focus:outline-none focus:border-brand-500 transition-colors"
        />
        <button
          onClick={cycle}
          title="Nächste Farbe"
          className="p-2 rounded-lg bg-surface-700 text-white/50 hover:text-white hover:bg-surface-600 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
        {value && (
          <button
            onClick={() => onChange(undefined)}
            title="Farbe entfernen"
            className="p-2 rounded-lg bg-surface-700 text-white/40 hover:text-white/70 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

// ── Toggle ────────────────────────────────────────────────────

function Toggle({
  label, description, checked, onChange,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div
      className="flex items-center justify-between gap-4 cursor-pointer"
      onClick={() => onChange(!checked)}
    >
      <div>
        <p className="text-sm text-white/80 font-medium select-none">{label}</p>
        {description && <p className="text-xs text-white/35 mt-0.5 select-none">{description}</p>}
      </div>

      {/* Track */}
      <div
        className={clsx(
          'relative shrink-0 rounded-full transition-colors duration-200',
          'w-12 h-6',
          checked ? 'bg-brand-600' : 'bg-surface-500',
        )}
      >
        {/* Thumb */}
        <span
          className={clsx(
            'absolute top-0.5 bottom-0.5 w-5 rounded-full bg-white shadow-md',
            'transition-transform duration-200',
            checked ? 'translate-x-6' : 'translate-x-0.5',
          )}
        />
      </div>
    </div>
  )
}

export default function UserEditor({ existing, cfg, onSaved, onDeleted, onCancel }: Props) {
  const isNew = !existing

  const [form, setForm] = useState<User>(
    existing?.data ?? {
      id: generateId(),
      displayName: '',
      fullName: '',
      active: true,
    },
  )
  const [previewImg, setPreviewImg]     = useState<string | null>(null)
  const [uploading, setUploading]       = useState(false)
  const [saving, setSaving]             = useState(false)
  const [deleting, setDeleting]         = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [showPreview, setShowPreview]   = useState(false)
  const fileRef                         = useRef<HTMLInputElement>(null)

  const imgSrc = previewImg
    ?? (form.image
      ? GH.imageUrl(cfg, form.image)
      : null)

  // ── Image upload ─────────────────────────────────────────

  const handleFile = useCallback(async (file: File) => {
    if (!isValidImageFile(file)) {
      setError('Nur Bilddateien erlaubt (JPEG, PNG, WebP, GIF)')
      return
    }
    setError(null)
    setUploading(true)
    try {
      const { base64 } = await fileToWebP(file, 900, 0.85)
      const path = generateImageFilename(form.id)

      // Upload to GitHub
      await GH.uploadBinary(cfg, path, base64, undefined, `chore: upload image for ${form.displayName}`)

      // Show local preview
      setPreviewImg(`data:image/webp;base64,${base64}`)
      setForm((prev) => ({ ...prev, image: path }))
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setUploading(false)
    }
  }, [cfg, form.id, form.displayName])

  const onFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  // ── Save ─────────────────────────────────────────────────

  const handleSave = async () => {
    if (!form.displayName.trim()) {
      setError('Anzeigename darf nicht leer sein.')
      return
    }
    setError(null)
    setSaving(true)
    try {
      await GH.saveUser(cfg, form, existing?.sha)
      onSaved(form)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  // ── Delete ───────────────────────────────────────────────

  const handleDelete = async () => {
    if (!existing) return
    if (!confirm(`Nutzer „${form.displayName}" wirklich löschen?`)) return
    setDeleting(true)
    try {
      await GH.deleteUser(cfg, form.id, existing.sha)
      onDeleted?.()
    } catch (err) {
      setError((err as Error).message)
      setDeleting(false)
    }
  }

  // ── Render ───────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full overflow-hidden bg-surface-800">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <h2 className="text-lg font-semibold text-white">
          {isNew ? 'Neuen Nutzer anlegen' : `${form.displayName || 'Nutzer'} bearbeiten`}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview((p) => !p)}
            className={clsx(
              'p-2 rounded-lg transition-colors',
              showPreview ? 'bg-brand-600 text-white' : 'bg-surface-700 text-white/60 hover:bg-surface-600',
            )}
            title="Vorschau"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button onClick={onCancel} className="p-2 rounded-lg bg-surface-700 text-white/60 hover:bg-surface-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Form */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Names */}
          <div className="space-y-3">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-1.5 block">
                Anzeigename *
              </span>
              <input
                type="text"
                value={form.displayName}
                onChange={(e) => setForm((p) => ({ ...p, displayName: e.target.value }))}
                placeholder="z. B. Max"
                className="w-full bg-surface-700 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-1.5 block">
                Vollständiger Name
              </span>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                placeholder="z. B. Max Mustermann"
                className="w-full bg-surface-700 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-1.5 block">
                Rolle (optional)
              </span>
              <input
                type="text"
                value={form.role ?? ''}
                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                placeholder="z. B. Prediger, Worship, Moderator"
                className="w-full bg-surface-700 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
              />
            </label>
          </div>

          {/* Accent Color */}
          <ColorPicker
            value={form.color}
            onChange={(c) => setForm((p) => ({ ...p, color: c }))}
          />

          {/* Image upload */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-1.5 block">
              Profilbild
            </span>
            <div
              onClick={() => fileRef.current?.click()}
              onDrop={onDrop}
              onDragOver={(e) => e.preventDefault()}
              className={clsx(
                'relative border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-colors',
                uploading
                  ? 'border-brand-400 bg-brand-500/5'
                  : 'border-white/15 hover:border-white/30 bg-surface-700/50',
              )}
            >
              {imgSrc ? (
                <div className="flex items-center gap-4">
                  <img
                    src={imgSrc}
                    alt=""
                    className="w-20 h-20 rounded-xl object-cover shrink-0"
                    style={{
                      objectPosition: positionToCss(form.imagePosition?.x, form.imagePosition?.y),
                    }}
                  />
                  <div className="text-left">
                    <p className="text-white/70 text-sm font-medium">Bild hochgeladen</p>
                    <p className="text-white/40 text-xs mt-0.5">{form.image}</p>
                    <p className="text-brand-400 text-xs mt-2">Klicken um zu ersetzen</p>
                  </div>
                </div>
              ) : (
                <div className="py-4 space-y-2">
                  <Upload className="w-8 h-8 text-white/30 mx-auto" />
                  <p className="text-white/50 text-sm">
                    {uploading ? 'Wird hochgeladen …' : 'Klicken oder ziehen für Profilbild'}
                  </p>
                  <p className="text-white/30 text-xs">JPEG, PNG oder WebP · wird zu WebP konvertiert</p>
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-surface-900/60 rounded-2xl flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFilePick} />
          </div>

          {/* Image position / scale (shown only when image exists) */}
          {imgSrc && (
            <div className="space-y-4 bg-surface-700/40 rounded-2xl p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Bildposition</p>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs text-white/40 mb-1 block">Horizontal ({form.imagePosition?.x ?? 50}%)</span>
                  <input type="range" min={0} max={100} step={1}
                    value={form.imagePosition?.x ?? 50}
                    onChange={(e) => setForm((p) => ({
                      ...p, imagePosition: { x: Number(e.target.value), y: p.imagePosition?.y ?? 30 },
                    }))}
                    className="w-full accent-brand-500"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-white/40 mb-1 block">Vertikal ({form.imagePosition?.y ?? 30}%)</span>
                  <input type="range" min={0} max={100} step={1}
                    value={form.imagePosition?.y ?? 30}
                    onChange={(e) => setForm((p) => ({
                      ...p, imagePosition: { x: p.imagePosition?.x ?? 50, y: Number(e.target.value) },
                    }))}
                    className="w-full accent-brand-500"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-xs text-white/40 mb-1 block">Zoom ({((form.imageScale ?? 1.15) * 100).toFixed(0)}%)</span>
                <input type="range" min={100} max={300} step={5}
                  value={Math.round((form.imageScale ?? 1.15) * 100)}
                  onChange={(e) => setForm((p) => ({ ...p, imageScale: Number(e.target.value) / 100 }))}
                  className="w-full accent-brand-500"
                />
              </label>
            </div>
          )}

          {/* Active toggle */}
          <Toggle
            label="Aktiv / verfügbar"
            description="Person wird in der Zuweisung angezeigt"
            checked={form.active !== false}
            onChange={(v) => setForm((p) => ({ ...p, active: v }))}
          />
        </div>

        {/* Live preview panel */}
        {showPreview && (
          <div className="w-60 shrink-0 border-l border-white/10 p-4 bg-surface-900/50 flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Slot-Vorschau</p>

            <div className="relative flex flex-col overflow-hidden rounded-2xl bg-surface-700 border border-white/5 aspect-[3/4]">
              {imgSrc && (
                <>
                  <div
                    className="absolute inset-0 bg-cover"
                    style={{
                      backgroundImage: `url(${imgSrc})`,
                      backgroundPosition: positionToCss(form.imagePosition?.x, form.imagePosition?.y),
                      backgroundSize: scaleToCss(form.imageScale ?? 1.15),
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
                </>
              )}
              <div className="relative z-10 px-3 pt-3">
                <span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full bg-black/30 border border-white/20 text-white/80">
                  Prediger
                </span>
              </div>
              <div className="flex-1" />
              <div className="relative z-10 px-3 pb-4">
                <p className="text-xl font-bold text-white leading-tight drop-shadow-lg"
                  style={form.color ? { color: form.color } : {}}>
                  {form.displayName || '—'}
                </p>
              </div>
              {form.color && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 opacity-60" style={{ background: form.color }} />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-surface-900/50">
        <div>
          {!isNew && onDeleted && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50 text-sm font-medium"
            >
              <Trash2 className="w-4 h-4" />
              {deleting ? 'Wird gelöscht …' : 'Löschen'}
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onCancel}
            className="px-4 py-2 rounded-xl text-white/50 hover:text-white/80 transition-colors text-sm">
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold transition-colors disabled:opacity-50 text-sm"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Wird gespeichert …' : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  )
}
