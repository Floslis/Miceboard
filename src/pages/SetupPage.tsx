import { useState, FormEvent } from 'react'
import { Mic, Github, Check, AlertCircle, ExternalLink, ChevronRight, FolderPlus } from 'lucide-react'
import { saveConfig, loadConfig } from '../lib/config'
import * as GH from '../lib/github'
import type { Config } from '../types'

interface Props {
  onDone: () => void
}

type Step = 'connect' | 'init' | 'done'

export default function SetupPage({ onDone }: Props) {
  const existing = loadConfig()

  const [form, setForm] = useState({
    token:      existing?.token      ?? '',
    owner:      existing?.owner      ?? '',
    dataRepo:   existing?.dataRepo   ?? '',
    dataBranch: existing?.dataBranch ?? 'main',
  })
  const [step, setStep]         = useState<Step>('connect')
  const [testing, setTesting]   = useState(false)
  const [testOk, setTestOk]     = useState(false)
  const [initing, setIniting]   = useState(false)
  const [initResult, setInitResult] = useState<GH.InitResult | null>(null)
  const [error, setError]       = useState<string | null>(null)

  const ghCfg = (): GH.GitHubConfig => ({
    token:  form.token,
    owner:  form.owner,
    repo:   form.dataRepo,
    branch: form.dataBranch,
  })

  // ── Test connection ───────────────────────────────────────

  const handleTest = async () => {
    if (!form.token || !form.owner || !form.dataRepo) {
      setError('Bitte alle Pflichtfelder ausfüllen.')
      return
    }
    setTesting(true)
    setError(null)
    setTestOk(false)
    try {
      const ok = await GH.testConnection(ghCfg())
      if (!ok) {
        setError('Verbindung fehlgeschlagen. Prüfe Token, Owner und Repo-Name.')
      } else {
        setTestOk(true)
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setTesting(false)
    }
  }

  // ── Save config + initialize repo ────────────────────────

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    const cfg: Config = {
      token:        form.token,
      owner:        form.owner,
      dataRepo:     form.dataRepo,
      dataBranch:   form.dataBranch,
      pollInterval: 8000,
      basePath:     '/',
    }
    saveConfig(cfg)

    setIniting(true)
    setStep('init')
    setError(null)
    try {
      const result = await GH.initializeDataRepo(ghCfg())
      setInitResult(result)
      setStep('done')
    } catch (err) {
      setError(`Repo-Initialisierung fehlgeschlagen: ${(err as Error).message}`)
      setStep('connect')
    } finally {
      setIniting(false)
    }
  }

  // ── Render ───────────────────────────────────────────────

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

        {/* ── Step: init in progress ── */}
        {step === 'init' && (
          <div className="bg-surface-800 border border-white/10 rounded-3xl p-8 flex flex-col items-center gap-5">
            <div className="w-12 h-12 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
            <div className="text-center">
              <p className="text-white font-semibold text-lg">Repo wird initialisiert …</p>
              <p className="text-white/40 text-sm mt-1">Erstelle Ordnerstruktur im privaten Repository</p>
            </div>
          </div>
        )}

        {/* ── Step: done ── */}
        {step === 'done' && initResult && (
          <div className="bg-surface-800 border border-white/10 rounded-3xl p-8 space-y-6">
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center">
                <Check className="w-7 h-7 text-green-400" />
              </div>
              <div className="text-center">
                <p className="text-white font-bold text-xl">Bereit!</p>
                <p className="text-white/50 text-sm mt-1">Repository wurde erfolgreich eingerichtet</p>
              </div>
            </div>

            {initResult.created.length > 0 && (
              <div className="bg-surface-700/60 rounded-2xl p-4 space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2 flex items-center gap-1.5">
                  <FolderPlus className="w-3.5 h-3.5" />
                  Erstellt
                </p>
                {initResult.created.map((f) => (
                  <p key={f} className="text-xs text-green-400 font-mono">{f}</p>
                ))}
              </div>
            )}

            {initResult.skipped.length > 0 && (
              <div className="bg-surface-700/40 rounded-2xl p-4 space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-2">
                  Bereits vorhanden
                </p>
                {initResult.skipped.map((f) => (
                  <p key={f} className="text-xs text-white/30 font-mono">{f}</p>
                ))}
              </div>
            )}

            <button
              onClick={onDone}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-lg transition-colors"
            >
              MicBoard öffnen
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* ── Step: connect form ── */}
        {step === 'connect' && (
          <div className="bg-surface-800 border border-white/10 rounded-3xl p-6 space-y-6">
            <p className="text-white/50 text-sm leading-relaxed">
              MicBoard speichert alle Daten in einem{' '}
              <strong className="text-white/70">privaten GitHub Repository</strong> deiner Wahl.
              Du benötigst einen Personal Access Token mit{' '}
              <code className="text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded text-xs">repo</code> Berechtigungen.
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
                  onChange={(e) => { setForm((p) => ({ ...p, token: e.target.value })); setTestOk(false) }}
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
                    onChange={(e) => { setForm((p) => ({ ...p, owner: e.target.value })); setTestOk(false) }}
                    placeholder="your-username"
                    required
                    className="w-full bg-surface-700 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-1.5 block">
                    Data Repository *
                  </span>
                  <input
                    type="text"
                    value={form.dataRepo}
                    onChange={(e) => { setForm((p) => ({ ...p, dataRepo: e.target.value })); setTestOk(false) }}
                    placeholder="micboard-data"
                    required
                    className="w-full bg-surface-700 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-1.5 block">
                  Branch
                </span>
                <input
                  type="text"
                  value={form.dataBranch}
                  onChange={(e) => { setForm((p) => ({ ...p, dataBranch: e.target.value })); setTestOk(false) }}
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

              {testOk && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-300 text-sm">
                  <Check className="w-4 h-4" />
                  Verbindung erfolgreich!
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={testing || initing}
                  className="flex-1 py-3 rounded-xl bg-surface-700 hover:bg-surface-600 text-white/70 hover:text-white font-semibold text-sm transition-colors disabled:opacity-50"
                >
                  {testing ? 'Teste …' : 'Verbindung testen'}
                </button>
                <button
                  type="submit"
                  disabled={!form.token || !form.owner || !form.dataRepo || initing}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Speichern & einrichten
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}

        <p className="text-center text-white/20 text-xs mt-6">
          Token wird nur lokal in deinem Browser gespeichert
        </p>
      </div>
    </div>
  )
}
