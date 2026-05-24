// ─────────────────────────────────────────────────────────────
// MicBoard – Runtime Config
// Reads from env-vars (build-time) with localStorage override
// ─────────────────────────────────────────────────────────────

import type { Config } from '../types'

const LS_KEY = 'micboard_config'

const ENV: Partial<Config> = {
  token:       import.meta.env.VITE_GITHUB_TOKEN  ?? '',
  owner:       import.meta.env.VITE_GITHUB_OWNER  ?? '',
  dataRepo:    import.meta.env.VITE_DATA_REPO      ?? '',
  dataBranch:  import.meta.env.VITE_DATA_BRANCH    ?? 'main',
  pollInterval: Number(import.meta.env.VITE_POLL_INTERVAL ?? 8000),
  basePath:    import.meta.env.VITE_BASE_PATH      ?? '/',
}

export function loadConfig(): Config | null {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) {
      const stored = JSON.parse(raw) as Partial<Config>
      const merged: Config = { ...ENV, ...stored } as Config
      if (merged.token && merged.owner && merged.dataRepo) return merged
    }
  } catch { /* ignore */ }

  // Fall back to pure env-var config
  if (ENV.token && ENV.owner && ENV.dataRepo) {
    return ENV as Config
  }
  return null
}

export function saveConfig(cfg: Config): void {
  localStorage.setItem(LS_KEY, JSON.stringify(cfg))
}

export function clearConfig(): void {
  localStorage.removeItem(LS_KEY)
}

export function isConfigured(): boolean {
  return loadConfig() !== null
}

export const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD ?? ''
