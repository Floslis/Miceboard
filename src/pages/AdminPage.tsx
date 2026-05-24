// ─────────────────────────────────────────────────────────────
// MicBoard – AdminPage
// Main admin panel: sidebar nav + content area
// ─────────────────────────────────────────────────────────────

import { useState, useCallback, useEffect } from 'react'
import {
  Mic, Users, Monitor, Settings, LogOut, Plus, RefreshCw,
  ChevronRight, X
} from 'lucide-react'
import clsx from 'clsx'
import type { User, Display, RemoteData } from '../types'
import { useAuth } from '../hooks/useAuth'
import { useGitHubConfig, useUsers, useDisplays } from '../hooks/useGitHub'
import { loadConfig, saveConfig, clearConfig } from '../lib/config'
import * as GH from '../lib/github'
import DisplayPanel from '../components/admin/DisplayPanel'
import UserEditor from '../components/admin/UserEditor'
import ToastContainer, { useToasts } from '../components/common/Toast'
import LoadingSpinner from '../components/common/LoadingSpinner'

type Section = 'displays' | 'users' | 'settings'

export default function AdminPage() {
  const { logout }                  = useAuth()
  const cfg                         = useGitHubConfig()
  const { users, loading: ul, error: ue, reload: reloadUsers, save: saveUser, remove: removeUser } = useUsers(cfg)
  const { displays, loading: dl, error: de, reload: reloadDisplays, save: saveDisplay } = useDisplays(cfg)

  const [section, setSection]           = useState<Section>('displays')
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

  // ── Display updated (slot assignment changed) ────────────

  const handleDisplayUpdated = useCallback(async () => {
    await reloadDisplays()
  }, [reloadDisplays])

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
          <div className="w-8 h-8 rounded-lg bg-brand-600/30 border border-brand-500/40 flex items-center justify-center">
            <Mic className="w-4 h-4 text-brand-400" />
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
            { id: 'users' as Section,   icon: Users,    label: 'Nutzer' },
            { id: 'settings' as Section, icon: Settings, label: 'Einstellungen' },
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
            onEditDisplay={() => {/* TODO: display config modal */}}
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
                {users.map((u) => {
                  const imageBaseUrl = `https://raw.githubusercontent.com/${cfg.owner}/${cfg.repo}/${cfg.branch ?? 'main'}`
                  return (
                    <button
                      key={u.data.id}
                      onClick={() => setEditingUser(u)}
                      className="group relative flex flex-col overflow-hidden rounded-2xl bg-surface-700 border border-white/10 hover:border-brand-500/40 transition-all aspect-[3/4]"
                    >
                      {u.data.image && (
                        <>
                          <div
                            className="absolute inset-0 bg-cover"
                            style={{
                              backgroundImage: `url(${imageBaseUrl}/${u.data.image})`,
                              backgroundPosition: `${u.data.imagePosition?.x ?? 50}% ${u.data.imagePosition?.y ?? 30}%`,
                              backgroundSize: `${Math.round((u.data.imageScale ?? 1.15) * 100)}%`,
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/0" />
                        </>
                      )}
                      <div className="flex-1" />
                      <div className="relative z-10 px-3 pb-3">
                        <p className="text-base font-bold text-white leading-tight"
                          style={u.data.color ? { color: u.data.color } : {}}>
                          {u.data.displayName}
                        </p>
                        {u.data.role && (
                          <p className="text-xs text-white/40 mt-0.5 truncate">{u.data.role}</p>
                        )}
                      </div>
                      <div className="absolute inset-0 bg-brand-600/0 group-hover:bg-brand-600/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <span className="bg-black/60 text-white text-xs font-semibold px-3 py-1.5 rounded-full">Bearbeiten</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {section === 'users' && editingUser && (
          <div className="flex-1 overflow-hidden">
            <UserEditor
              existing={editingUser === 'new' ? undefined : editingUser}
              cfg={cfg}
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

              <div className="bg-surface-800 border border-red-500/20 rounded-2xl p-5">
                <p className="text-sm font-semibold text-red-400/80 uppercase tracking-wider mb-3">Gefahrenbereich</p>
                <button
                  onClick={() => { if (confirm('Konfiguration wirklich löschen?')) { clearConfig(); window.location.reload() } }}
                  className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-sm font-medium transition-colors"
                >
                  Konfiguration zurücksetzen
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
