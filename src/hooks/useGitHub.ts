// ─────────────────────────────────────────────────────────────
// MicBoard – GitHub Data Hook
// Provides reactive access to users, displays, and settings
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from 'react'
import type { User, Display, AppSettings, RemoteData } from '../types'
import type { GitHubConfig } from '../lib/github'
import * as GH from '../lib/github'
import { loadConfig } from '../lib/config'

// ── Build config from the stored runtime config ──────────────

export function useGitHubConfig(): GitHubConfig | null {
  const cfg = loadConfig()
  if (!cfg) return null
  return {
    token:  cfg.token,
    owner:  cfg.owner,
    repo:   cfg.dataRepo,
    branch: cfg.dataBranch,
  }
}

// ── Generic fetch hook ───────────────────────────────────────

interface FetchState<T> {
  data: T | null
  loading: boolean
  error: string | null
  refresh: () => void
}

export function useFetch<T>(
  fetcher: (() => Promise<T>) | null,
  deps: unknown[] = [],
): FetchState<T> {
  const [data, setData]       = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const abortRef              = useRef<AbortController | null>(null)

  const fetch = useCallback(async () => {
    if (!fetcher) return
    abortRef.current?.abort()
    abortRef.current = new AbortController()
    setLoading(true)
    setError(null)
    try {
      const result = await fetcher()
      setData(result)
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError((err as Error).message ?? 'Unbekannter Fehler')
      }
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher, ...deps])

  useEffect(() => {
    fetch()
    return () => abortRef.current?.abort()
  }, [fetch])

  return { data, loading, error, refresh: fetch }
}

// ── Domain hooks ─────────────────────────────────────────────

export function useUsers(cfg: GitHubConfig | null) {
  const [users, setUsers]     = useState<RemoteData<User>[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

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
  }, [cfg])

  useEffect(() => { load() }, [load])

  const save = useCallback(async (user: User, sha?: string): Promise<string> => {
    if (!cfg) throw new Error('Nicht konfiguriert')
    const newSha = await GH.saveUser(cfg, user, sha)
    await load()
    return newSha
  }, [cfg, load])

  const remove = useCallback(async (id: string, sha: string): Promise<void> => {
    if (!cfg) throw new Error('Nicht konfiguriert')
    await GH.deleteUser(cfg, id, sha)
    setUsers((prev) => prev.filter((u) => u.data.id !== id))
  }, [cfg])

  return { users, loading, error, reload: load, save, remove }
}

export function useDisplays(cfg: GitHubConfig | null) {
  const [displays, setDisplays] = useState<RemoteData<Display>[]>([])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

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
  }, [cfg])

  useEffect(() => { load() }, [load])

  const save = useCallback(async (display: Display, sha?: string): Promise<string> => {
    if (!cfg) throw new Error('Nicht konfiguriert')
    const newSha = await GH.saveDisplay(cfg, display, sha)
    await load()
    return newSha
  }, [cfg, load])

  return { displays, loading, error, reload: load, save }
}

export function useSettings(cfg: GitHubConfig | null) {
  const [settings, setSettings] = useState<RemoteData<AppSettings> | null>(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

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
  }, [cfg])

  useEffect(() => { load() }, [load])

  const save = useCallback(async (s: AppSettings): Promise<void> => {
    if (!cfg) throw new Error('Nicht konfiguriert')
    const sha = await GH.saveSettings(cfg, s, settings?.sha)
    setSettings({ data: s, sha, path: 'config/settings.json' })
  }, [cfg, settings])

  return { settings, loading, error, reload: load, save }
}
