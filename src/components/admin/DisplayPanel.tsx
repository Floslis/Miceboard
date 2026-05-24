import { useState, useCallback } from 'react'
import { Plus, ExternalLink, RefreshCw, Pencil, Trash2, Check, X } from 'lucide-react'
import clsx from 'clsx'
import type { Display, Slot, User, RemoteData } from '../../types'
import type { GitHubConfig } from '../../lib/github'
import * as GH from '../../lib/github'
import SlotAssignment from './SlotAssignment'

interface Props {
  displayData: RemoteData<Display>
  users: RemoteData<User>[]
  cfg: GitHubConfig
  onUpdated: () => void
  basePath?: string
}

function generateSlotId(): string {
  return 'slot-' + Date.now().toString(36)
}

// ── Inline slot name editor ───────────────────────────────────

function SlotNameEditor({
  slot, onSave, onCancel,
}: { slot: Slot; onSave: (name: string) => void; onCancel: () => void }) {
  const [name, setName] = useState(slot.name)
  return (
    <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSave(name.trim() || slot.name)
          if (e.key === 'Escape') onCancel()
        }}
        className="flex-1 text-xs bg-surface-600 border border-brand-500/60 rounded-lg px-2 py-1 text-white outline-none"
      />
      <button onClick={() => onSave(name.trim() || slot.name)}
        className="p-1 text-green-400 hover:text-green-300"><Check className="w-3.5 h-3.5" /></button>
      <button onClick={onCancel}
        className="p-1 text-white/40 hover:text-white/70"><X className="w-3.5 h-3.5" /></button>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────

export default function DisplayPanel({
  displayData, users, cfg, onUpdated, basePath = '/',
}: Props) {
  const display = displayData.data
  const [savingSlot, setSavingSlot]   = useState<string | null>(null)
  const [editingSlot, setEditingSlot] = useState<string | null>(null)
  const [refreshing, setRefreshing]   = useState(false)

  const imageBaseUrl = `https://raw.githubusercontent.com/${cfg.owner}/${cfg.repo}/${cfg.branch ?? 'main'}`
  const sortedSlots  = display.slots.slice().sort((a, b) => a.order - b.order)

  // ── Helpers ──────────────────────────────────────────────

  const saveDisplay = useCallback(async (updated: Display) => {
    await GH.saveDisplay(cfg, updated, displayData.sha)
    onUpdated()
  }, [cfg, displayData.sha, onUpdated])

  // ── Slot assignment ──────────────────────────────────────

  const handleAssign = useCallback(async (slotId: string, userId: string | undefined) => {
    setSavingSlot(slotId)
    try {
      await saveDisplay({
        ...display,
        slots: display.slots.map((s) => s.id === slotId ? { ...s, userId } : s),
      })
    } catch (err) {
      alert(`Fehler: ${(err as Error).message}`)
    } finally {
      setSavingSlot(null)
    }
  }, [display, saveDisplay])

  // ── Slot rename ───────────────────────────────────────────

  const handleRename = useCallback(async (slotId: string, newName: string) => {
    setEditingSlot(null)
    setSavingSlot(slotId)
    try {
      await saveDisplay({
        ...display,
        slots: display.slots.map((s) => s.id === slotId ? { ...s, name: newName } : s),
      })
    } catch (err) {
      alert(`Fehler: ${(err as Error).message}`)
    } finally {
      setSavingSlot(null)
    }
  }, [display, saveDisplay])

  // ── Slot delete ───────────────────────────────────────────

  const handleDeleteSlot = useCallback(async (slotId: string, slotName: string) => {
    if (!confirm(`Slot „${slotName}" wirklich löschen?`)) return
    setSavingSlot(slotId)
    try {
      await saveDisplay({
        ...display,
        slots: display.slots.filter((s) => s.id !== slotId),
      })
    } catch (err) {
      alert(`Fehler: ${(err as Error).message}`)
    } finally {
      setSavingSlot(null)
    }
  }, [display, saveDisplay])

  // ── Add slot ──────────────────────────────────────────────

  const addSlot = async () => {
    const name = prompt('Slot-Name (z. B. Prediger, Vox 1):')
    if (!name?.trim()) return
    const newSlot: Slot = { id: generateSlotId(), name: name.trim(), order: display.slots.length }
    await saveDisplay({ ...display, slots: [...display.slots, newSlot] })
  }

  // ── Refresh ───────────────────────────────────────────────

  const refresh = async () => {
    setRefreshing(true)
    try { await onUpdated() } finally { setRefreshing(false) }
  }

  const displayUrl = `${basePath}display/${display.id}`

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
        <div>
          <h2 className="text-lg font-bold text-white">{display.name}</h2>
          {display.description && <p className="text-sm text-white/40">{display.description}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refresh} disabled={refreshing}
            className="p-2 rounded-lg bg-surface-700 text-white/50 hover:bg-surface-600 hover:text-white transition-colors disabled:opacity-40"
            title="Aktualisieren">
            <RefreshCw className={clsx('w-4 h-4', refreshing && 'animate-spin')} />
          </button>
          <a href={displayUrl} target="_blank" rel="noreferrer"
            className="p-2 rounded-lg bg-surface-700 text-white/50 hover:bg-surface-600 hover:text-white transition-colors"
            title="Display öffnen">
            <ExternalLink className="w-4 h-4" />
          </a>
          <button onClick={addSlot}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm transition-colors">
            <Plus className="w-4 h-4" />
            Slot
          </button>
        </div>
      </div>

      {/* Slot grid */}
      <div className="flex-1 overflow-y-auto p-5">
        {sortedSlots.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-4 border-2 border-dashed border-white/10 rounded-2xl">
            <p className="text-white/40 text-sm">Noch keine Slots</p>
            <button onClick={addSlot}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm transition-colors">
              <Plus className="w-4 h-4" />
              Ersten Slot anlegen
            </button>
          </div>
        ) : (
          <div className="grid gap-3"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
            {sortedSlots.map((slot) => (
              <div key={slot.id} className="flex flex-col gap-1.5">
                {/* Slot label row – name + edit/delete */}
                <div className="flex items-center gap-1 min-h-[24px]">
                  {editingSlot === slot.id ? (
                    <SlotNameEditor
                      slot={slot}
                      onSave={(name) => handleRename(slot.id, name)}
                      onCancel={() => setEditingSlot(null)}
                    />
                  ) : (
                    <>
                      <span className="text-xs text-white/60 font-semibold uppercase tracking-wider truncate flex-1">
                        {slot.name}
                      </span>
                      <button
                        onClick={() => setEditingSlot(slot.id)}
                        className="p-1 rounded text-white/25 hover:text-white/70 hover:bg-white/5 transition-colors"
                        title="Umbenennen"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteSlot(slot.id, slot.name)}
                        className="p-1 rounded text-white/25 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Löschen"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>

                {/* Assignment tile – fixed height, not aspect ratio */}
                <div className="h-44">
                  <SlotAssignment
                    slot={slot}
                    users={users}
                    imageBaseUrl={imageBaseUrl}
                    onAssign={handleAssign}
                    saving={savingSlot === slot.id}
                  />
                </div>
              </div>
            ))}

            {/* Add slot tile */}
            <div className="flex flex-col gap-1.5">
              <div className="min-h-[24px]" />
              <button
                onClick={addSlot}
                className="h-44 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/10 hover:border-brand-500/40 hover:bg-brand-500/5 transition-all group"
              >
                <Plus className="w-5 h-5 text-white/20 group-hover:text-brand-400 transition-colors" />
                <span className="text-xs text-white/20 group-hover:text-brand-400 transition-colors font-medium">
                  Slot hinzufügen
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
