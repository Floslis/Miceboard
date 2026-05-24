// ─────────────────────────────────────────────────────────────
// MicBoard – Authenticated Image Cache
//
// raw.githubusercontent.com returns 404 for private repos.
// This module fetches images via the authenticated GitHub
// Contents API and caches them as data-URLs in memory so
// display components work for both public AND private repos.
// ─────────────────────────────────────────────────────────────

import type { GitHubConfig } from './github'

const cache = new Map<string, Promise<string>>()

function cacheKey(cfg: GitHubConfig, imagePath: string): string {
  return `${cfg.owner}/${cfg.repo}/${cfg.branch ?? 'main'}/${imagePath}`
}

async function fetchDataUrl(cfg: GitHubConfig, imagePath: string): Promise<string> {
  try {
    const ref  = cfg.branch ?? 'main'
    const url  = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${imagePath}?ref=${ref}&t=${Date.now()}`
    const res  = await fetch(url, {
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    })
    if (!res.ok) return ''
    const json = await res.json() as { content: string }
    const b64  = json.content.replace(/\n/g, '')
    const ext  = (imagePath.split('.').pop() ?? 'webp').toLowerCase()
    const mime = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : 'image/webp'
    return `data:${mime};base64,${b64}`
  } catch {
    return ''
  }
}

/** Get a data-URL for an image, fetching it via auth API if needed. Cached for session lifetime. */
export function getAuthImageUrl(cfg: GitHubConfig, imagePath: string): Promise<string> {
  const key = cacheKey(cfg, imagePath)
  if (!cache.has(key)) {
    cache.set(key, fetchDataUrl(cfg, imagePath))
  }
  return cache.get(key)!
}

/** Bust the cache for a specific image (call after uploading a new version) */
export function invalidateAuthImage(cfg: GitHubConfig, imagePath: string): void {
  cache.delete(cacheKey(cfg, imagePath))
}
