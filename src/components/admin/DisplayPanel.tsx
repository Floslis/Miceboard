// ─────────────────────────────────────────────────────────────
// MicBoard – DisplayPanel
// Admin view for one display: shows all slots with quick assignment
// ─────────────────────────────────────────────────────────────

import { useState, useCallback } from 'react'
import { Plus, Settings, ExternalLink, RefreshCw } from 'lucide-react'
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
  onEditDisplay: () => void
  basePath?: string
}

function generateSlotId(): string {
  return 'slot-' + Date.now().toString(36)
}

export default function DisplayPanel({
  displayData, users, cfg, onUpdated, onEditDisplay, basePath = '/',
}: Props) {
  const display = displayData.data
  const [savingSlot, setSavingSlot] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const imageBaseUrl = `https://raw.githubusercontent.com/${cfg.owner}/${cfg.repo}/${cfg.branch ?? 'main'}`

  const sortedSlots = display.slots.slice().sort((a, b) => a.order - b.order)

  // ── Assign user to slot ──────────────────────────────────

  const handleAssign = useCallback(async (slotId: string, userId: string | undefined) => {
    setSavingSlot(slotId)
    try {
      const updated: Display = {
        ...display,
        slots: display.slots.map((s) =>
          s.id === slotId ? { ...s, userId } : s,
        ),
      }
      await GH.saveDisplay(cfg, updated, displayData.sha)
      onUpdated()
    } catch (err) {
      console.error(err)
      alert(`Fehler: ${(err as Error).message}`)
    } finally {
      setSavingSlot(null)
    }
  }, [cfg, display, displayData.sha, onUpdated])

  // ── Add slot ─────────────────────────────────────────────

  const addSlot = async () => {
    const name = prompt('Slot-Name (z. B. Prediger, Vox 1):')
    if (!name) return
    const newSlot: Slot = {
      id: generateSlotId(),
      name: name.trim(),
      order: display.slots.length,
    }
    const updated: Display = { ...display, slots: [...display.slots, newSlot] }
    await GH.saveDisplay(cfg, updated, displayData.sha)
    onUpdated()
  }

  // ── Refresh ──────────────────────────────────────────────

  const refresh = async () => {
    setRefreshing(true)
    await onUpdated()
    setRefreshing(false)
  }

  const displayUrl = `${basePath}display/${display.id}`

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div>
          <h2 className="text-lg font-bold text-white">{display.name}</h2>
          {display.description && (
            <p className="text-sm text-white/40">{display.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            disabled={refreshing}
            className="p-2 rounded-lg bg-surface-700 text-white/50 hover:bg-surface-600 hover:text-white transition-colors disabled:opacity-40"
            title="Aktualisieren"
          >
            <RefreshCw className={clsx('w-4 h-4', refreshing && 'animate-spin')} />
          </button>
          <a
            href={displayUrl}
            target="_blank"
            rel="noreferrer"
            className="p-2 rounded-lg bg-surface-700 text-white/50 hover:bg-surface-600 hover:text-white transition-colors"
            title="Display öffnen"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
          <button
            onClick={onEditDisplay}
            className="p-2 rounded-lg bg-surface-700 text-white/50 hover:bg-surface-600 hover:text-white transition-colors"
            title="Display konfigurieren"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Slot grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {sortedSlots.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-4 border-2 border-dashed border-white/10 rounded-2xl">
            <p className="text-white/40">Noch keine Slots</p>
            <button
              onClick={addSlot}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Ersten Slot anlegen
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {sortedSlots.map((slot) => (
              <SlotAssignment
                key={slot.id}
                slot={slot}
                users={users}
                imageBaseUrl={imageBaseUrl}
                onAssign={handleAssign}
                saving={savingSlot === slot.id}
              />
            ))}

            {/* Add slot button */}
            <button
              onClick={addSlot}
              className="aspect-[3/4] flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/15 hover:border-brand-500/50 hover:bg-brand-500/5 transition-all group"
            >
              <Plus className="w-6 h-6 text-white/25 group-hover:text-brand-400 transition-colors" />
              <span className="text-xs text-white/25 group-hover:text-brand-400 transition-colors font-medium">
                Slot
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
