// ─────────────────────────────────────────────────────────────
// MicBoard – useAuthImage hook
// Returns a cached data-URL for a repo image (works for both
// public and private repos via the authenticated GitHub API).
// Returns '' while loading / on error.
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import type { GitHubConfig } from '../lib/github'
import { getAuthImageUrl } from '../lib/imageCache'

export function useAuthImage(
  cfg: GitHubConfig | null,
  imagePath: string | null | undefined,
): string {
  const [url, setUrl] = useState('')

  // Use primitive values as deps to avoid object-reference churn
  const token  = cfg?.token
  const owner  = cfg?.owner
  const repo   = cfg?.repo
  const branch = cfg?.branch

  useEffect(() => {
    if (!cfg || !imagePath) { setUrl(''); return }
    let active = true
    getAuthImageUrl(cfg, imagePath).then((u) => {
      if (active) setUrl(u)
    })
    return () => { active = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, owner, repo, branch, imagePath])

  return url
}
