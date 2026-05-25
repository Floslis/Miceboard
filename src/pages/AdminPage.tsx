// ─────────────────────────────────────────────────────────────
// MicBoard – AdminPage
// Main admin panel: sidebar nav + content area
// ─────────────────────────────────────────────────────────────

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  Mic, Users, Monitor, Settings, LogOut, Plus, RefreshCw,
  Upload, X, LayoutDashboard, ChevronRight, AlertTriangle,
  LayoutGrid, List as ListIcon, ExternalLink,
} from 'lucide-react'
import clsx from 'clsx'
import type { User, Display, RemoteData } from '../types'
import { useAuth } from '../hooks/useAuth'
import { useGitHubConfig, useUsers, useDisplays } from '../hooks/useGitHub'
import { loadConfig, saveConfig, clearConfig } from '../lib/config'
import * as GH from '../lib/github'
import { fileToWebP, isValidImageFile } from '../lib/imageUtils'
import { useLogo, LOGO_PATH } from '../hooks/useLogo'
import DisplayPanel from '../components/admin/DisplayPanel'
import UserEditor from '../components/admin/UserEditor'
import ToastContainer, { useToasts } from '../components/common/Toast'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { useAuthImage } from '../hooks/useAuthImage'
import type { GitHubConfig } from '../lib/github'

type Section = 'overview' | 'displays' | 'users' | 'settings'

// ── User card in the grid (needs its own component to call useAuthImage) ──

function UserCard({
  user, cfg, onClick,
}: { user: RemoteData<User>; cfg: GitHubConfig; onClick: () => void }) {
  const bgUrl = useAuthImage(user.data.image ? cfg : null, user.data.image ?? null)
  const u = user.data
  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-surface-700 border border-white/10 hover:border-brand-500/40 transition-all aspect-[3/4]"
    >
      {u.image && bgUrl && (
        <>
          <div className="absolute inset-0 overflow-hidden">
            <img
              src={bgUrl}
              alt=""
              className="w-full h-full object-cover select-none pointer-events-none"
              draggable={false}
              style={{
                objectPosition: `${u.imagePosition?.x ?? 50}% ${u.imagePosition?.y ?? 25}%`,
                transform: (u.imageScale ?? 1.0) !== 1 ? `scale(${u.imageScale})` : undefined,
                transformOrigin: `${u.imagePosition?.x ?? 50}% ${u.imagePosition?.y ?? 25}%`,
              }}
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/0" />
        </>
      )}
      <div className="flex-1" />
      <div className="relative z-10 px-3 pb-3">
        <p className="text-base font-bold text-white leading-tight"
          style={u.color ? { color: u.color } : {}}>
          {u.displayName}
        </p>
        {u.role && <p className="text-xs text-white/40 mt-0.5 truncate">{u.role}</p>}
      </div>
      <div className="absolute inset-0 bg-brand-600/0 group-hover:bg-brand-600/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
        <span className="bg-black/60 text-white text-xs font-semibold px-3 py-1.5 rounded-full">Bearbeiten</span>
      </div>
    </button>
  )
}

// ── Overview card – one display with tile OR list view ─────────
// Handles its own slot-assignment saves (SHA ref pattern).

function OverviewAvatar({ user, cfg }: { user: User; cfg: GitHubConfig }) {
  const raw = user.image
    ? `https://raw.githubusercontent.com/${cfg.owner}/${cfg.repo}/${cfg.branch ?? 'main'}/${user.image}`
    : null
  const [src, setSrc] = useState<string | null>(raw)
  const handleError = async () => {
    if (!user.image) return
    const { getAuthImageUrl } = await import('../lib/imageCache')
    const url = await getAuthImageUrl(cfg, user.image)
    if (url) setSrc(url)
  }
  if (!src) return (
    <div className="w-full h-full flex items-center justify-center text-white/30 text-xs font-bold"
      style={user.color ? { color: user.color } : {}}>
      {user.displayName.charAt(0).toUpperCase()}
    </div>
  )
  return (
    <img src={src} alt={user.displayName} className="w-full h-full object-cover"
      style={{ objectPosition: `${user.imagePosition?.x ?? 50}% ${user.imagePosition?.y ?? 30}%` }}
      onError={handleError} />
  )
}

import SlotAssignment from '../components/admin/SlotAssignment'

function DisplayOverviewCard({
  displayData, users, cfg, onUpdated, viewMode, basePath,
}: {
  displayData: RemoteData<Display>
  users:       RemoteData<User>[]
  cfg:         GitHubConfig
  onUpdated:   () => Promise<void>
  viewMode:    'tile' | 'list'
  basePath:    string
}) {
  const display     = displayData.data
  const sorted      = display.slots.slice().sort((a, b) => a.order - b.order)
  const [saving, setSaving] = useState<string | null>(null)
  const shaRef = useRef(displayData.sha)
  useEffect(() => { shaRef.current = displayData.sha }, [displayData.sha])

  const handleAssign = async (slotId: string, userId: string | undefined) => {
    setSaving(slotId)
    try {
      const newSha = await GH.saveDisplay(cfg, {
        ...display,
        slots: display.slots.map((s) => s.id === slotId ? { ...s, userId } : s),
      }, shaRef.current)
      shaRef.current = newSha
      await onUpdated()
    } catch (err) {
      alert(`Fehler: ${(err as Error).message}`)
    } finally {
      setSaving(null)
    }
  }

  const displayUrl = `${basePath}display/${display.id}`

  return (
    <div className="bg-surface-800 border border-white/10 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-white/40" />
          <span className="font-semibold text-white">{display.name}</span>
          <span className="text-white/30 text-xs">{sorted.length} Slots</span>
        </div>
        <a href={displayUrl} target="_blank" rel="noreferrer"
          className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
          öffnen <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Tile view */}
      {viewMode === 'tile' && (
        <div className="p-4 flex gap-3 overflow-x-auto">
          {sorted.length === 0 ? (
            <p className="text-white/25 text-sm py-2">Keine Slots – im Display anlegen</p>
          ) : sorted.map((slot) => (
            <div key={slot.id} className="flex flex-col gap-1.5 flex-1" style={{ minWidth: 120 }}>
              <p className="text-[10px] text-white/40 font-semibold uppercase tracking-wider truncate text-center">
                {slot.name}
              </p>
              <div className="h-48">
                <SlotAssignment
                  slot={slot}
                  users={users}
                  cfg={cfg}
                  onAssign={handleAssign}
                  saving={saving === slot.id}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List view */}
      {viewMode === 'list' && (
        <div className="divide-y divide-white/5">
          {sorted.length === 0 && (
            <p className="px-5 py-4 text-white/25 text-sm">Keine Slots</p>
          )}
          {sorted.map((slot) => {
            const user = slot.userId ? users.find((u) => u.data.id === slot.userId)?.data : null
            return (
              <div key={slot.id} className="flex items-center gap-4 px-5 py-3">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-surface-700 shrink-0 border border-white/10">
                  {user
                    ? <OverviewAvatar user={user} cfg={cfg} />
                    : <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">—</div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/80 font-medium" style={user?.color ? { color: user.color } : {}}>
                    {user?.displayName ?? <span className="text-white/25">Niemand</span>}
                  </p>
                  {user?.fullName && user.fullName !== user.displayName && (
                    <p className="text-xs text-white/35 truncate">{user.fullName}</p>
                  )}
                </div>
                <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-white/40 bg-surface-700 px-2.5 py-1 rounded-full border border-white/10">
                  {slot.name}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function AdminPage() {
  const { logout }                  = useAuth()
  const cfg                         = useGitHubConfig()
  const logoUrl                     = useLogo(cfg)
  const { users, loading: ul, error: ue, reload: reloadUsers, save: saveUser, remove: removeUser } = useUsers(cfg)
  const { displays, loading: dl, error: de, reload: reloadDisplays } = useDisplays(cfg)

  const [section, setSection]           = useState<Section>('overview')
  const [overviewMode, setOverviewMode] = useState<'tile' | 'list'>('tile')
  const [activeDisplayId, setActiveDisplayId] = useState<string | null>(null)
  const [editingUser, setEditingUser]   = useState<RemoteData<User> | 'new' | null>(null)
  const { toasts, toast, dismiss }      = useToasts()

  const activeDisplay = displays.find((d) => d.data.id === activeDisplayId)
  const runtimeCfg    = loadConfig()

  // ── Select first display automatically ──────────────────
  // Must be in useEffect – calling setState during render causes infinite loops

  useEffect(() => {
    if (!activeDisplayId && displays.length > 0) {
      setActiveDisplayId(displays[0].data.id)
    }
  }, [activeDisplayId, displays])

  // ── Add display ──────────────────────────────────────────

  const addDisplay = useCallback(async () => {
    if (!cfg) return
    const name = prompt('Display-Name (z. B. Hauptbühne):')
    if (!name) return
    const id = 'display-' + Date.now().toString(36)
    const newDisplay: Display = { id, name: name.trim(), slots: [], layout: 'grid' }
    try {
      await GH.saveDisplay(cfg, newDisplay)
      await reloadDisplays()
      setActiveDisplayId(id)
      toast.success(`Display „${name}" erstellt.`)
    } catch (err) {
      toast.error((err as Error).message)
    }
  }, [cfg, reloadDisplays, toast])

  // ── Display updated (slot assignment / rename changed) ──────

  const handleDisplayUpdated = useCallback(async () => {
    await reloadDisplays()
  }, [reloadDisplays])

  // ── Display deleted ──────────────────────────────────────

  const handleDisplayDeleted = useCallback((deletedId: string) => {
    // Move selection to another display (or null)
    if (activeDisplayId === deletedId) {
      const remaining = displays.filter((d) => d.data.id !== deletedId)
      setActiveDisplayId(remaining.length > 0 ? remaining[0].data.id : null)
    }
    reloadDisplays()
    toast.success('Display gelöscht.')
  }, [activeDisplayId, displays, reloadDisplays, toast])

  // ── Repo reset ───────────────────────────────────────────

  const [resetting, setResetting] = useState(false)

  const handleRepoReset = useCallback(async () => {
    if (!cfg) return
    const confirmed = confirm(
      '⚠️ ALLE Nutzer, Displays und Bilder werden unwiderruflich gelöscht!\n' +
      'Das Repo wird danach mit Standard-Daten neu initialisiert.\n\n' +
      'Wirklich fortfahren?',
    )
    if (!confirmed) return
    setResetting(true)
    try {
      await GH.resetDataRepo(cfg)
      await Promise.all([reloadDisplays(), reloadUsers()])
      setActiveDisplayId(null)
      toast.success('Repo zurückgesetzt und neu initialisiert.')
    } catch (err) {
      toast.error(`Fehler beim Reset: ${(err as Error).message}`)
    } finally {
      setResetting(false)
    }
  }, [cfg, reloadDisplays, reloadUsers, toast])

  // ── Auto-refresh when tab becomes visible again ──────────
  // Ensures the admin shows fresh data after the user switches tabs
  // or comes back from the display page.

  const lastLoadRef = useRef(0)
  useEffect(() => {
    const handleVisible = () => {
      if (document.visibilityState !== 'visible') return
      if (Date.now() - lastLoadRef.current < 15_000) return  // debounce 15 s
      lastLoadRef.current = Date.now()
      reloadDisplays()
      reloadUsers()
    }
    document.addEventListener('visibilitychange', handleVisible)
    return () => document.removeEventListener('visibilitychange', handleVisible)
  }, [reloadDisplays, reloadUsers])

  useEffect(() => { lastLoadRef.current = Date.now() }, [])

  // ── User saved ───────────────────────────────────────────

  const handleUserSaved = useCallback(async (user: User) => {
    await reloadUsers()
    setEditingUser(null)
    toast.success(`Nutzer „${user.displayName}" gespeichert.`)
  }, [reloadUsers, toast])

  // ── User deleted ─────────────────────────────────────────

  const handleUserDeleted = useCallback(async () => {
    await reloadUsers()
    setEditingUser(null)
    toast.success('Nutzer gelöscht.')
  }, [reloadUsers, toast])

  // ── Settings section ─────────────────────────────────────

  const [settingsForm, setSettingsForm] = useState({
    owner:      runtimeCfg?.owner      ?? '',
    dataRepo:   runtimeCfg?.dataRepo   ?? '',
    dataBranch: runtimeCfg?.dataBranch ?? 'main',
    pollInterval: String(runtimeCfg?.pollInterval ?? 8000),
  })

  const saveSettings = () => {
    if (!runtimeCfg) return
    saveConfig({
      ...runtimeCfg,
      owner:       settingsForm.owner,
      dataRepo:    settingsForm.dataRepo,
      dataBranch:  settingsForm.dataBranch,
      pollInterval: Number(settingsForm.pollInterval),
    })
    toast.success('Einstellungen gespeichert. Bitte Seite neu laden.')
  }

  // ── Logo upload ───────────────────────────────────────────

  const logoInputRef             = useRef<HTMLInputElement>(null)
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoPreview, setLogoPreview]     = useState<string | null>(null)

  const handleLogoUpload = useCallback(async (file: File) => {
    if (!cfg) return
    if (!isValidImageFile(file)) { toast.error('Nur Bilddateien erlaubt.'); return }
    setLogoUploading(true)
    try {
      const { base64 } = await fileToWebP(file, 512, 0.9)
      await GH.uploadBinary(cfg, LOGO_PATH, base64, undefined, 'chore: update logo')
      const preview = `data:image/webp;base64,${base64}`
      setLogoPreview(preview)
      // Also update the favicon immediately
      const link = document.querySelector<HTMLLinkElement>("link[rel~='icon']")
      if (link) link.href = preview
      toast.success('Logo gespeichert.')
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setLogoUploading(false)
    }
  }, [cfg, toast])

  // ── Render ───────────────────────────────────────────────

  if (!cfg) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-900 text-white">
        <p>Nicht konfiguriert. <a href="/" className="text-brand-400 underline">Setup öffnen</a></p>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-surface-900 overflow-hidden">
      {/* ── Sidebar ────────────────────────────────────────── */}
      <aside className="w-64 shrink-0 flex flex-col bg-surface-800 border-r border-white/10">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg bg-brand-600/30 border border-brand-500/40 flex items-center justify-center overflow-hidden shrink-0">
            {(logoPreview ?? logoUrl) ? (
              <img src={logoPreview ?? logoUrl!} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <Mic className="w-4 h-4 text-brand-400" />
            )}
          </div>
          <span className="font-bold text-white text-lg">MicBoard</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {/* Displays section */}
          <div className="mb-4">
            <div className="flex items-center justify-between px-3 mb-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Displays</p>
              <button onClick={addDisplay}
                className="w-5 h-5 rounded flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-colors">
                <Plus className="w-3 h-3" />
              </button>
            </div>

            {dl && <p className="px-3 py-2 text-xs text-white/30">Lädt …</p>}
            {de && <p className="px-3 py-2 text-xs text-red-400">{de}</p>}

            {displays.map((d) => (
              <button
                key={d.data.id}
                onClick={() => { setSection('displays'); setActiveDisplayId(d.data.id) }}
                className={clsx(
                  'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors group',
                  section === 'displays' && activeDisplayId === d.data.id
                    ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30'
                    : 'text-white/60 hover:bg-white/5 hover:text-white',
                )}
              >
                <Monitor className="w-4 h-4 shrink-0" />
                <span className="text-sm font-medium truncate">{d.data.name}</span>
                <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>

          {/* Other sections */}
          {([
            { id: 'overview'  as Section, icon: LayoutDashboard, label: 'Übersicht' },
            { id: 'users'     as Section, icon: Users,           label: 'Nutzer' },
            { id: 'settings'  as Section, icon: Settings,        label: 'Einstellungen' },
          ] as const).map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setSection(id)}
              className={clsx(
                'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors',
                section === id
                  ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30'
                  : 'text-white/60 hover:bg-white/5 hover:text-white',
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-white/40 hover:text-red-400 hover:bg-red-500/5 transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            Ausloggen
          </button>
        </div>
      </aside>

      {/* ── Main content ───────────────────────────────────── */}
      <main className="flex-1 flex overflow-hidden">
        {/* Displays section */}
        {section === 'displays' && activeDisplay && (
          <DisplayPanel
            key={activeDisplay.data.id}
            displayData={activeDisplay}
            users={users}
            cfg={cfg}
            onUpdated={handleDisplayUpdated}
            onDeleted={handleDisplayDeleted}
            basePath={runtimeCfg?.basePath ?? '/'}
          />
        )}

        {section === 'displays' && !activeDisplay && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6">
            {dl ? (
              <LoadingSpinner label="Displays werden geladen …" />
            ) : (
              <>
                <Monitor className="w-16 h-16 text-white/10" />
                <div className="text-center">
                  <p className="text-white/50 font-medium">Noch kein Display vorhanden</p>
                  <p className="text-white/25 text-sm mt-1">Erstelle dein erstes Display über das + oben links</p>
                </div>
                <button onClick={addDisplay}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold transition-colors">
                  <Plus className="w-4 h-4" />
                  Display erstellen
                </button>
              </>
            )}
          </div>
        )}

        {/* ── Overview section ───────────────────────────── */}
        {section === 'overview' && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">Gesamtübersicht</h2>
              <div className="flex items-center gap-2">
                {/* Tile / List toggle */}
                <div className="flex items-center bg-surface-700 rounded-lg p-1 gap-1">
                  <button
                    onClick={() => setOverviewMode('tile')}
                    className={clsx('p-1.5 rounded-md transition-colors', overviewMode === 'tile' ? 'bg-brand-600 text-white' : 'text-white/40 hover:text-white')}
                    title="Kachelansicht"
                  ><LayoutGrid className="w-4 h-4" /></button>
                  <button
                    onClick={() => setOverviewMode('list')}
                    className={clsx('p-1.5 rounded-md transition-colors', overviewMode === 'list' ? 'bg-brand-600 text-white' : 'text-white/40 hover:text-white')}
                    title="Listenansicht"
                  ><ListIcon className="w-4 h-4" /></button>
                </div>
                <button onClick={() => { reloadDisplays(); reloadUsers() }} disabled={dl || ul}
                  className="p-2 rounded-lg bg-surface-700 text-white/50 hover:bg-surface-600 transition-colors">
                  <RefreshCw className={clsx('w-4 h-4', (dl || ul) && 'animate-spin')} />
                </button>
              </div>
            </div>
            {(dl || ul) && <LoadingSpinner label="Lädt …" className="mt-12" />}
            <div className="space-y-6">
              {displays.map((d) => (
                <DisplayOverviewCard
                  key={d.data.id}
                  displayData={d}
                  users={users}
                  cfg={cfg}
                  onUpdated={handleDisplayUpdated}
                  viewMode={overviewMode}
                  basePath={runtimeCfg?.basePath ?? '/'}
                />
              ))}
            </div>
          </div>
        )}

        {/* Users section */}
        {section === 'users' && !editingUser && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h2 className="text-lg font-bold text-white">Nutzer</h2>
              <div className="flex items-center gap-2">
                <button onClick={reloadUsers} disabled={ul}
                  className="p-2 rounded-lg bg-surface-700 text-white/50 hover:bg-surface-600 transition-colors">
                  <RefreshCw className={clsx('w-4 h-4', ul && 'animate-spin')} />
                </button>
                <button onClick={() => setEditingUser('new')}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm transition-colors">
                  <Plus className="w-4 h-4" />
                  Neuer Nutzer
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {ul && <LoadingSpinner label="Nutzer laden …" className="mt-12" />}
              {ue && <p className="text-red-400 text-sm">{ue}</p>}

              {!ul && users.length === 0 && (
                <div className="flex flex-col items-center justify-center h-48 gap-4">
                  <Users className="w-12 h-12 text-white/10" />
                  <p className="text-white/40">Noch keine Nutzer vorhanden.</p>
                  <button onClick={() => setEditingUser('new')}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm transition-colors">
                    <Plus className="w-4 h-4" />
                    Ersten Nutzer anlegen
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {users.map((u) => (
                  <UserCard
                    key={u.data.id}
                    user={u}
                    cfg={cfg}
                    onClick={() => setEditingUser(u)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {section === 'users' && editingUser && (
          <div className="flex-1 overflow-hidden">
            <UserEditor
              existing={editingUser === 'new' ? undefined : editingUser}
              cfg={cfg}
              displays={displays}
              onSaved={handleUserSaved}
              onDeleted={editingUser !== 'new' ? handleUserDeleted : undefined}
              onCancel={() => setEditingUser(null)}
            />
          </div>
        )}

        {/* Settings section */}
        {section === 'settings' && (
          <div className="flex-1 overflow-y-auto p-8">
            <h2 className="text-xl font-bold text-white mb-6">Einstellungen</h2>

            <div className="max-w-lg space-y-5">
              {/* Logo upload */}
              <div className="bg-surface-800 border border-white/10 rounded-2xl p-5 space-y-4">
                <p className="text-sm font-semibold text-white/70 uppercase tracking-wider">Logo</p>
                <p className="text-xs text-white/40">
                  Wird als Favicon und Sidebar-Icon verwendet. Empfohlen: quadratisches Bild, min. 256×256 px.
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-surface-700 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                    {(logoPreview ?? logoUrl) ? (
                      <img src={logoPreview ?? logoUrl!} alt="Logo" className="w-full h-full object-contain p-1" />
                    ) : (
                      <Mic className="w-7 h-7 text-white/20" />
                    )}
                  </div>
                  <div className="flex-1">
                    <button
                      onClick={() => logoInputRef.current?.click()}
                      disabled={logoUploading}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-700 hover:bg-surface-600 text-white/70 hover:text-white border border-white/10 text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      <Upload className="w-4 h-4" />
                      {logoUploading ? 'Wird hochgeladen …' : 'Logo hochladen'}
                    </button>
                    <p className="text-xs text-white/30 mt-1.5">PNG, JPEG oder WebP</p>
                  </div>
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f) }}
                />
              </div>
              <div className="bg-surface-800 border border-white/10 rounded-2xl p-5 space-y-4">
                <p className="text-sm font-semibold text-white/70 uppercase tracking-wider">GitHub-Verbindung</p>

                {(['owner', 'dataRepo', 'dataBranch'] as const).map((key) => (
                  <label key={key} className="block">
                    <span className="text-xs text-white/40 mb-1 block">
                      {key === 'owner' ? 'GitHub Owner' : key === 'dataRepo' ? 'Data Repository' : 'Branch'}
                    </span>
                    <input
                      type="text"
                      value={settingsForm[key]}
                      onChange={(e) => setSettingsForm((p) => ({ ...p, [key]: e.target.value }))}
                      className="w-full bg-surface-700 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-brand-500 transition-colors"
                    />
                  </label>
                ))}

                <label className="block">
                  <span className="text-xs text-white/40 mb-1 block">Poll-Intervall (ms)</span>
                  <input
                    type="number"
                    value={settingsForm.pollInterval}
                    min={2000}
                    max={60000}
                    step={1000}
                    onChange={(e) => setSettingsForm((p) => ({ ...p, pollInterval: e.target.value }))}
                    className="w-full bg-surface-700 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </label>

                <button
                  onClick={saveSettings}
                  className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold transition-colors"
                >
                  Einstellungen speichern
                </button>
              </div>

              <div className="bg-surface-800 border border-red-500/20 rounded-2xl p-5 space-y-3">
                <p className="text-sm font-semibold text-red-400/80 uppercase tracking-wider">Gefahrenbereich</p>

                {/* Repo hard-reset */}
                <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                  <AlertTriangle className="w-5 h-5 text-red-400/70 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-white/70 font-medium mb-1">Repo zurücksetzen (Hard Reset)</p>
                    <p className="text-xs text-white/35 mb-3">
                      Löscht ALLE Nutzer, Displays und Bilder im privaten Daten-Repo und erstellt
                      Standard-Daten neu. Nicht rückgängig zu machen.
                    </p>
                    <button
                      onClick={handleRepoReset}
                      disabled={resetting}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/15 border border-red-500/40 text-red-400 hover:bg-red-500/25 text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {resetting
                        ? <><div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" /> Wird zurückgesetzt …</>
                        : <><AlertTriangle className="w-3.5 h-3.5" /> Alles löschen & neu starten</>
                      }
                    </button>
                  </div>
                </div>

                {/* Local config reset */}
                <button
                  onClick={() => { if (confirm('Lokale Konfiguration (Token, Repo) wirklich löschen?')) { clearConfig(); window.location.reload() } }}
                  className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-sm font-medium transition-colors"
                >
                  Lokale Konfiguration zurücksetzen
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}
