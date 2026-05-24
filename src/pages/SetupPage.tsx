// ─────────────────────────────────────────────────────────────
// MicBoard – SetupPage
// First-run wizard: enter GitHub token, owner, and data repo
// ─────────────────────────────────────────────────────────────

import { useState, FormEvent } from 'react'
import { Mic, Github, Check, AlertCircle, ExternalLink, ChevronRight } from 'lucide-react'
import { saveConfig, loadConfig } from '../lib/config'
import * as GH from '../lib/github'
import type { Config } from '../types'

interface Props {
  onDone: () => void
}

export default function SetupPage({ onDone }: Props) {
  const existing = loadConfig()

  const [form, setForm] = useState({
    token:      existing?.token      ?? '',
    owner:      existing?.owner      ?? '',
    dataRepo:   existing?.dataRepo   ?? '',
    dataBranch: existing?.dataBranch ?? 'main',
  })
  const [testing, setTesting]   = useState(false)
  const [tested, setTested]     = useState(false)
  const [testOk, setTestOk]     = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const handleTest = async () => {
    if (!form.token || !form.owner || !form.dataRepo) {
      setError('Bitte alle Pflichtfelder ausfüllen.')
      return
    }
    setTesting(true)
    setError(null)
    setTested(false)
    try {
      const ok = await GH.testConnection({
        token:  form.token,
        owner:  form.owner,
        repo:   form.dataRepo,
        branch: form.dataBranch,
      })
      setTestOk(ok)
      setTested(true)
      if (!ok) setError('Verbindung fehlgeschlagen. Prüfe Token, Owner und Repo-Name.')
    } catch (err) {
      setError((err as Error).message)
      setTested(true)
      setTestOk(false)
    } finally {
      setTesting(false)
    }
  }

  const handleSave = (e: FormEvent) => {
    e.preventDefault()
    const cfg: Config = {
      token:       form.token,
      owner:       form.owner,
      dataRepo:    form.dataRepo,
      dataBranch:  form.dataBranch,
      pollInterval: 8000,
      basePath:    '/',
    }
    saveConfig(cfg)
    onDone()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-900 px-4 py-10">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-brand-600/8 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Header */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center mb-4">
            <Mic className="w-8 h-8 text-brand-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">MicBoard Setup</h1>
          <p className="text-white/40 text-sm mt-1 text-center max-w-xs">
            Verbinde dein privates GitHub-Datenrepository
          </p>
        </div>

        {/* Steps */}
        <div className="bg-surface-800 border border-white/10 rounded-3xl p-6 space-y-6">
          <p className="text-white/50 text-sm leading-relaxed">
            MicBoard speichert alle Daten in einem <strong className="text-white/70">privaten GitHub Repository</strong> deiner Wahl.
            Du benötigst einen Personal Access Token mit <code className="text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded text-xs">repo</code> Berechtigungen.
          </p>

          <a
            href="https://github.com/settings/tokens/new?scopes=repo&description=MicBoard"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-brand-400 hover:text-brand-300 text-sm transition-colors"
          >
            <Github className="w-4 h-4" />
            Token auf GitHub erstellen
            <ExternalLink className="w-3 h-3" />
          </a>

          <form onSubmit={handleSave} className="space-y-4">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-1.5 block">
                GitHub Personal Access Token *
              </span>
              <input
                type="password"
                value={form.token}
                onChange={(e) => { setForm((p) => ({ ...p, token: e.target.value })); setTested(false) }}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                required
                className="w-full bg-surface-700 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm placeholder-white/20 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-1.5 block">
                  GitHub Owner *
                </span>
                <input
                  type="text"
                  value={form.owner}
                  onChange={(e) => { setForm((p) => ({ ...p, owner: e.target.value })); setTested(false) }}
                  placeholder="dein-username"
                  required
                  className="w-full bg-surface-700 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-brand-500 transition-colors"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-1.5 block">
                  Datenrepository *
                </span>
                <input
                  type="text"
                  value={form.dataRepo}
                  onChange={(e) => { setForm((p) => ({ ...p, dataRepo: e.target.value })); setTested(false) }}
                  placeholder="micboard-data"
                  required
                  className="w-full bg-surface-700 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-brand-500 transition-colors"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-1.5 block">
                Branch (Standard: main)
              </span>
              <input
                type="text"
                value={form.dataBranch}
                onChange={(e) => { setForm((p) => ({ ...p, dataBranch: e.target.value })); setTested(false) }}
                placeholder="main"
                className="w-full bg-surface-700 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-brand-500 transition-colors"
              />
            </label>

            {error && (
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            {tested && testOk && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-300 text-sm">
                <Check className="w-4 h-4" />
                Verbindung erfolgreich! Repository erreichbar.
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleTest}
                disabled={testing}
                className="flex-1 py-3 rounded-xl bg-surface-700 hover:bg-surface-600 text-white/70 hover:text-white font-semibold text-sm transition-colors disabled:opacity-50"
              >
                {testing ? 'Teste …' : 'Verbindung testen'}
              </button>
              <button
                type="submit"
                disabled={!form.token || !form.owner || !form.dataRepo}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Speichern & starten
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          Token wird nur lokal in deinem Browser gespeichert
        </p>
      </div>
    </div>
  )
}
