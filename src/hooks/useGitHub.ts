// ─────────────────────────────────────────────────────────────
// MicBoard – GitHub Data Hook
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import type { User, Display, AppSettings, RemoteData } from '../types'
import type { GitHubConfig } from '../lib/github'
import * as GH from '../lib/github'
import { loadConfig } from '../lib/config'

// ── Build config – STABLE reference via useMemo ──────────────
// CRITICAL: must NOT return a new object on every render.
// If it does, every hook that depends on cfg will re-run every
// render, creating an infinite API-call loop.

export function useGitHubConfig(): GitHubConfig | null {
  const cfg = loadConfig()

  // Stable string key derived from the actual values
  const key = cfg
    ? `${cfg.token}|${cfg.owner}|${cfg.dataRepo}|${cfg.dataBranch}`
    : null

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo<GitHubConfig | null>(() => {
    if (!cfg) return null
    return {
      token:  cfg.token,
      owner:  cfg.owner,
      repo:   cfg.dataRepo,
      branch: cfg.dataBranch,
    }
  // key is the stable dependency – only changes when values actually change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
}

// ── Domain hooks ─────────────────────────────────────────────
// Each hook receives cfg as a prop (not called inside) so the
// stable reference from useGitHubConfig flows through correctly.

export function useUsers(cfg: GitHubConfig | null) {
  const [users, setUsers]     = useState<RemoteData<User>[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  // Stable token to detect real cfg changes without object-reference churn
  const cfgKey = cfg ? `${cfg.token}|${cfg.owner}|${cfg.repo}|${cfg.branch}` : null

  const load = useCallback(async () => {
    if (!cfg) return
    setLoading(true)
    setError(null)
    try {
      const result = await GH.listUsers(cfg)
      setUsers(result)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  // Use cfgKey (string) instead of cfg (object) to prevent infinite loops
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfgKey])

  useEffect(() => { load() }, [load])

  const save = useCallback(async (user: User, sha?: string): Promise<string> => {
    if (!cfg) throw new Error('Nicht konfiguriert')
    const newSha = await GH.saveUser(cfg, user, sha)
    await load()
    return newSha
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfgKey, load])

  const remove = useCallback(async (id: string, sha: string): Promise<void> => {
    if (!cfg) throw new Error('Nicht konfiguriert')
    await GH.deleteUser(cfg, id, sha)
    setUsers((prev) => prev.filter((u) => u.data.id !== id))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfgKey])

  return { users, loading, error, reload: load, save, remove }
}

export function useDisplays(cfg: GitHubConfig | null) {
  const [displays, setDisplays] = useState<RemoteData<Display>[]>([])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const cfgKey = cfg ? `${cfg.token}|${cfg.owner}|${cfg.repo}|${cfg.branch}` : null

  const load = useCallback(async () => {
    if (!cfg) return
    setLoading(true)
    setError(null)
    try {
      const result = await GH.listDisplays(cfg)
      setDisplays(result)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfgKey])

  useEffect(() => { load() }, [load])

  const save = useCallback(async (display: Display, sha?: string): Promise<string> => {
    if (!cfg) throw new Error('Nicht konfiguriert')
    const newSha = await GH.saveDisplay(cfg, display, sha)
    await load()
    return newSha
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfgKey, load])

  return { displays, loading, error, reload: load, save }
}

export function useSettings(cfg: GitHubConfig | null) {
  const [settings, setSettings] = useState<RemoteData<AppSettings> | null>(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const cfgKey = cfg ? `${cfg.token}|${cfg.owner}|${cfg.repo}|${cfg.branch}` : null

  const load = useCallback(async () => {
    if (!cfg) return
    setLoading(true)
    setError(null)
    try {
      const result = await GH.getSettings(cfg)
      setSettings(result)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfgKey])

  useEffect(() => { load() }, [load])

  const shaRef = useRef<string | undefined>(undefined)
  useEffect(() => { shaRef.current = settings?.sha }, [settings])

  const save = useCallback(async (s: AppSettings): Promise<void> => {
    if (!cfg) throw new Error('Nicht konfiguriert')
    const sha = await GH.saveSettings(cfg, s, shaRef.current)
    setSettings({ data: s, sha, path: 'config/settings.json' })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfgKey])

  return { settings, loading, error, reload: load, save }
}
