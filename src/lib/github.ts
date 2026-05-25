// ─────────────────────────────────────────────────────────────
// MicBoard – GitHub API Service
// All data read/write operations go through this module.
// ─────────────────────────────────────────────────────────────

import type { GitHubFile, RemoteData, User, Display, AppSettings } from '../types'

const API = 'https://api.github.com'

// ── Config ──────────────────────────────────────────────────

export interface GitHubConfig {
  token: string
  owner: string
  repo: string
  branch?: string
}

function headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  }
}

// ── Low-level helpers ────────────────────────────────────────

/** Fetch a single file from the data repo and decode its JSON content */
export async function getFile<T>(
  cfg: GitHubConfig,
  path: string,
): Promise<RemoteData<T>> {
  const ref = cfg.branch ?? 'main'
  const url = `${API}/repos/${cfg.owner}/${cfg.repo}/contents/${path}?ref=${ref}&t=${Date.now()}`
  const res = await fetch(url, { headers: headers(cfg.token) })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message ?? `HTTP ${res.status}`)
  }
  const file: GitHubFile = await res.json()
  if (!file.content) throw new Error(`File ${path} has no content`)

  // atob() returns a binary string; special chars (ü, ä, ö …) are stored
  // as raw UTF-8 bytes.  We must reverse the unescape(encodeURIComponent())
  // encoding used in putFile to get a proper JS string before JSON.parse.
  const binaryStr = atob(file.content.replace(/\n/g, ''))
  const text = decodeURIComponent(escape(binaryStr))
  const decoded = JSON.parse(text) as T
  return { data: decoded, sha: file.sha, path }
}

/** List all entries in a directory */
export async function listDir(
  cfg: GitHubConfig,
  path: string,
): Promise<GitHubFile[]> {
  const ref = cfg.branch ?? 'main'
  const url = `${API}/repos/${cfg.owner}/${cfg.repo}/contents/${path}?ref=${ref}&t=${Date.now()}`
  const res = await fetch(url, { headers: headers(cfg.token) })
  if (!res.ok) {
    if (res.status === 404) return []
    throw new Error(`HTTP ${res.status}`)
  }
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

/** Create or update a JSON file in the data repo */
export async function putFile<T>(
  cfg: GitHubConfig,
  path: string,
  data: T,
  sha?: string,           // Required when updating an existing file
  commitMessage?: string,
): Promise<string> {
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))))
  const body: Record<string, unknown> = {
    message: commitMessage ?? `chore: update ${path}`,
    content,
    branch: cfg.branch ?? 'main',
  }
  if (sha) body.sha = sha

  const url = `${API}/repos/${cfg.owner}/${cfg.repo}/contents/${path}`
  const res = await fetch(url, {
    method: 'PUT',
    headers: headers(cfg.token),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message ?? `HTTP ${res.status}`)
  }
  const result = await res.json()
  return (result as { content: { sha: string } }).content.sha
}

/** Delete a file from the data repo */
export async function deleteFile(
  cfg: GitHubConfig,
  path: string,
  sha: string,
  commitMessage?: string,
): Promise<void> {
  const url = `${API}/repos/${cfg.owner}/${cfg.repo}/contents/${path}`
  const res = await fetch(url, {
    method: 'DELETE',
    headers: headers(cfg.token),
    body: JSON.stringify({
      message: commitMessage ?? `chore: delete ${path}`,
      sha,
      branch: cfg.branch ?? 'main',
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message ?? `HTTP ${res.status}`)
  }
}

/** Upload a binary file (e.g. image) encoded as base64 */
export async function uploadBinary(
  cfg: GitHubConfig,
  path: string,
  base64Content: string,   // Raw base64 without data-URL prefix
  sha?: string,
  commitMessage?: string,
): Promise<string> {
  const body: Record<string, unknown> = {
    message: commitMessage ?? `chore: upload ${path}`,
    content: base64Content,
    branch: cfg.branch ?? 'main',
  }
  if (sha) body.sha = sha

  const url = `${API}/repos/${cfg.owner}/${cfg.repo}/contents/${path}`
  const res = await fetch(url, {
    method: 'PUT',
    headers: headers(cfg.token),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message ?? `HTTP ${res.status}`)
  }
  const result = await res.json()
  return (result as { content: { sha: string } }).content.sha
}

/** Validate that the token can reach the data repo */
export async function testConnection(cfg: GitHubConfig): Promise<boolean> {
  try {
    const url = `${API}/repos/${cfg.owner}/${cfg.repo}`
    const res = await fetch(url, { headers: headers(cfg.token) })
    return res.ok
  } catch {
    return false
  }
}

// ── Domain helpers ───────────────────────────────────────────

export async function getUser(cfg: GitHubConfig, id: string) {
  return getFile<User>(cfg, `users/${id}.json`)
}

export async function saveUser(
  cfg: GitHubConfig,
  user: User,
  sha?: string,
): Promise<string> {
  const updated = { ...user, updatedAt: new Date().toISOString() }
  return putFile<User>(
    cfg,
    `users/${user.id}.json`,
    updated,
    sha,
    `chore: update user ${user.displayName}`,
  )
}

export async function deleteUser(
  cfg: GitHubConfig,
  id: string,
  sha: string,
): Promise<void> {
  return deleteFile(cfg, `users/${id}.json`, sha, `chore: delete user ${id}`)
}

export async function listUsers(cfg: GitHubConfig): Promise<RemoteData<User>[]> {
  const files = await listDir(cfg, 'users')
  const jsonFiles = files.filter((f) => f.name.endsWith('.json'))
  const results = await Promise.allSettled(
    jsonFiles.map((f) => getFile<User>(cfg, f.path)),
  )
  return results
    .filter((r): r is PromiseFulfilledResult<RemoteData<User>> => r.status === 'fulfilled')
    .map((r) => r.value)
}

/** Get just the SHA of a file without decoding content (for binary files like images) */
export async function getFileSha(cfg: GitHubConfig, path: string): Promise<string | null> {
  try {
    const ref = cfg.branch ?? 'main'
    const url = `${API}/repos/${cfg.owner}/${cfg.repo}/contents/${path}?ref=${ref}&t=${Date.now()}`
    const res = await fetch(url, { headers: headers(cfg.token) })
    if (!res.ok) return null
    const file = await res.json() as { sha: string }
    return file.sha ?? null
  } catch {
    return null
  }
}

export async function getDisplay(cfg: GitHubConfig, id: string) {
  return getFile<Display>(cfg, `displays/${id}.json`)
}

export async function saveDisplay(
  cfg: GitHubConfig,
  display: Display,
  sha?: string,
): Promise<string> {
  const updated = { ...display, updatedAt: new Date().toISOString() }
  return putFile<Display>(
    cfg,
    `displays/${display.id}.json`,
    updated,
    sha,
    `chore: update display ${display.name}`,
  )
}

export async function deleteDisplay(
  cfg: GitHubConfig,
  id: string,
  sha: string,
): Promise<void> {
  return deleteFile(cfg, `displays/${id}.json`, sha, `chore: delete display ${id}`)
}

export async function listDisplays(cfg: GitHubConfig): Promise<RemoteData<Display>[]> {
  const files = await listDir(cfg, 'displays')
  const jsonFiles = files.filter((f) => f.name.endsWith('.json'))
  const results = await Promise.allSettled(
    jsonFiles.map((f) => getFile<Display>(cfg, f.path)),
  )
  return results
    .filter((r): r is PromiseFulfilledResult<RemoteData<Display>> => r.status === 'fulfilled')
    .map((r) => r.value)
}

// ── Roles ────────────────────────────────────────────────────

const ROLES_PATH = 'config/roles.json'

/** Load the role list. Returns an empty list if the file doesn't exist yet. */
export async function loadRoles(cfg: GitHubConfig): Promise<RemoteData<string[]>> {
  try {
    return await getFile<string[]>(cfg, ROLES_PATH)
  } catch {
    return { data: [], sha: '', path: ROLES_PATH }
  }
}

export async function saveRoles(
  cfg: GitHubConfig,
  roles: string[],
  sha?: string,
): Promise<string> {
  return putFile<string[]>(cfg, ROLES_PATH, roles, sha || undefined, 'chore: update roles')
}

export async function getSettings(cfg: GitHubConfig) {
  try {
    return await getFile<AppSettings>(cfg, 'config/settings.json')
  } catch {
    // Return defaults if settings file doesn't exist yet
    const defaults: AppSettings = {
      pollInterval: 8000,
      theme: 'dark',
      appTitle: 'MicBoard',
      showClock: true,
      animateTransitions: true,
      defaultLayout: 'grid',
    }
    return { data: defaults, sha: '', path: 'config/settings.json' }
  }
}

export async function saveSettings(
  cfg: GitHubConfig,
  settings: AppSettings,
  sha?: string,
): Promise<string> {
  const updated = { ...settings, updatedAt: new Date().toISOString() }
  return putFile<AppSettings>(
    cfg,
    'config/settings.json',
    updated,
    sha || undefined,
    'chore: update settings',
  )
}

/** Build the raw GitHub user-content URL for an image in the data repo */
export function imageUrl(cfg: GitHubConfig, imagePath: string): string {
  const branch = cfg.branch ?? 'main'
  return `https://raw.githubusercontent.com/${cfg.owner}/${cfg.repo}/${branch}/${imagePath}`
}

// ── Auto-Init ────────────────────────────────────────────────

export interface InitResult {
  created: string[]
  skipped: string[]
}

/**
 * Check whether a file exists in the repo.
 * Returns the SHA if it does, null if not.
 */
async function fileExists(cfg: GitHubConfig, path: string): Promise<string | null> {
  try {
    const f = await getFile<unknown>(cfg, path)
    return f.sha
  } catch {
    return null
  }
}

/**
 * First-run setup: create all required files in the private data repo
 * if they don't already exist. Safe to call multiple times.
 */
export async function initializeDataRepo(cfg: GitHubConfig): Promise<InitResult> {
  const created: string[] = []
  const skipped: string[] = []

  const ensure = async <T>(path: string, data: T, message: string) => {
    const exists = await fileExists(cfg, path)
    if (exists) {
      skipped.push(path)
    } else {
      await putFile(cfg, path, data, undefined, message)
      created.push(path)
    }
  }

  // Default settings
  await ensure('config/settings.json', {
    pollInterval: 8000,
    theme: 'dark',
    appTitle: 'MicBoard',
    showClock: true,
    animateTransitions: true,
    defaultLayout: 'grid',
    updatedAt: new Date().toISOString(),
  }, 'chore: init settings')

  // Default display
  await ensure('displays/main-stage.json', {
    id: 'main-stage',
    name: 'Main Stage',
    description: 'Default display – rename and configure as needed',
    layout: 'grid',
    slots: [
      { id: 'slot-1', name: 'Speaker',   order: 0 },
      { id: 'slot-2', name: 'Moderator', order: 1 },
      { id: 'slot-3', name: 'Worship',   order: 2 },
      { id: 'slot-4', name: 'Vox 1',     order: 3 },
    ],
    updatedAt: new Date().toISOString(),
  }, 'chore: init default display')

  // Placeholder .gitkeep so the images/ folder shows up in the repo tree
  await ensure('images/.gitkeep', {}, 'chore: init images folder')

  return { created, skipped }
}

/**
 * Hard reset: delete ALL users, displays, images, and settings,
 * then re-run initializeDataRepo with defaults.
 * Use this to recover from a corrupted state.
 */
export async function resetDataRepo(cfg: GitHubConfig): Promise<InitResult> {
  // Delete all users
  const userFiles = (await listDir(cfg, 'users')).filter((f) => f.name.endsWith('.json'))
  for (const f of userFiles) {
    await deleteFile(cfg, f.path, f.sha, 'chore: reset – delete user').catch(() => {/* ignore */})
  }

  // Delete all displays
  const displayFiles = (await listDir(cfg, 'displays')).filter((f) => f.name.endsWith('.json'))
  for (const f of displayFiles) {
    await deleteFile(cfg, f.path, f.sha, 'chore: reset – delete display').catch(() => {/* ignore */})
  }

  // Delete all uploaded images (keep .gitkeep)
  const imageFiles = (await listDir(cfg, 'images')).filter(
    (f) => !f.name.startsWith('.') && f.name !== '.gitkeep',
  )
  for (const f of imageFiles) {
    await deleteFile(cfg, f.path, f.sha, 'chore: reset – delete image').catch(() => {/* ignore */})
  }

  // Delete settings
  try {
    const sha = await getFileSha(cfg, 'config/settings.json')
    if (sha) await deleteFile(cfg, 'config/settings.json', sha, 'chore: reset – delete settings')
  } catch { /* file didn't exist */ }

  // Re-create only the bare folder structure – no display, no slots.
  // The user can add displays and slots themselves after a fresh start.
  const created: string[] = []
  const skipped: string[] = []

  const ensure = async <T>(path: string, data: T, message: string) => {
    const exists = await fileExists(cfg, path)
    if (exists) { skipped.push(path) } else { await putFile(cfg, path, data, undefined, message); created.push(path) }
  }

  await ensure('config/settings.json', {
    pollInterval: 8000, theme: 'dark', appTitle: 'MicBoard',
    showClock: true, animateTransitions: true, defaultLayout: 'grid',
    updatedAt: new Date().toISOString(),
  }, 'chore: reset – init settings')

  await ensure('images/.gitkeep', {}, 'chore: reset – init images folder')

  return { created, skipped }
}
