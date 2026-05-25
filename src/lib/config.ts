// ─────────────────────────────────────────────────────────────
// MicBoard – Runtime Config
// Firebase handles all structured data (users, displays, etc).
// GitHub is used only for image storage (uploadBinary / imageUrl).
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
  // If all required env-vars are present, treat them as the single source of
  // truth and ignore any localStorage override. This ensures that updating a
  // GitHub Secret and redeploying immediately takes effect – no stale token
  // from a previous manual setup can shadow the build-time configuration.
  if (ENV.token && ENV.owner && ENV.dataRepo) {
    return ENV as Config
  }

  // No env-vars → fall back to whatever the user saved via the Setup page.
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) {
      const stored = JSON.parse(raw) as Partial<Config>
      const merged: Config = { ...ENV, ...stored } as Config
      if (merged.token && merged.owner && merged.dataRepo) return merged
    }
  } catch { /* ignore */ }

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
