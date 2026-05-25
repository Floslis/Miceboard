// ─────────────────────────────────────────────────────────────
// MicBoard – Firebase Data Service
// Replaces github.ts for all structured data (users, displays,
// roles, settings).  GitHub is still used for images only.
// ─────────────────────────────────────────────────────────────

import {
  ref, get, set, remove, onValue, off,
  type DatabaseReference, type DataSnapshot,
} from 'firebase/database'
import {
  signInAnonymously, signOut as fbSignOut,
} from 'firebase/auth'
import { db, auth } from './firebaseApp'
import type { User, Display, AppSettings } from '../types'

// ── Guard helper ─────────────────────────────────────────────

function requireDb() {
  if (!db) throw new Error('Firebase not configured – set VITE_FIREBASE_* secrets and redeploy.')
  return db
}
function requireAuth() {
  if (!auth) throw new Error('Firebase not configured – set VITE_FIREBASE_* secrets and redeploy.')
  return auth
}

// ── Path helpers ─────────────────────────────────────────────

const userRef    = (id: string)  => ref(requireDb(), `users/${id}`)
const usersRef   = ()            => ref(requireDb(), 'users')
const displayRef = (id: string)  => ref(requireDb(), `displays/${id}`)
const displaysRef = ()           => ref(requireDb(), 'displays')
const rolesRef   = ()            => ref(requireDb(), 'config/roles')
const settingsRef = ()           => ref(requireDb(), 'config/settings')

// ── Auth helpers ─────────────────────────────────────────────

/** Call this when the admin enters the correct password */
export async function signInAdmin(): Promise<void> {
  await signInAnonymously(requireAuth())
}

/** Call this on logout */
export async function signOutAdmin(): Promise<void> {
  await fbSignOut(requireAuth())
}

// ── Users ────────────────────────────────────────────────────

export async function saveUser(user: User): Promise<void> {
  const updated = { ...user, updatedAt: new Date().toISOString() }
  await set(userRef(user.id), updated)
}

export async function deleteUser(id: string): Promise<void> {
  await remove(userRef(id))
}

export async function listUsers(): Promise<User[]> {
  const snap = await get(usersRef())
  if (!snap.exists()) return []
  return Object.values(snap.val() as Record<string, User>)
}

/** Subscribe to users with a real-time listener. Returns unsubscribe fn. */
export function onUsersChange(callback: (users: User[]) => void): () => void {
  const r = usersRef()
  const handler = (snap: DataSnapshot) => {
    if (!snap.exists()) { callback([]); return }
    callback(Object.values(snap.val() as Record<string, User>))
  }
  onValue(r, handler)
  return () => off(r, 'value', handler)
}

// ── Displays ─────────────────────────────────────────────────

export async function saveDisplay(display: Display): Promise<void> {
  const updated = { ...display, updatedAt: new Date().toISOString() }
  await set(displayRef(display.id), updated)
}

export async function deleteDisplay(id: string): Promise<void> {
  await remove(displayRef(id))
}

export async function listDisplays(): Promise<Display[]> {
  const snap = await get(displaysRef())
  if (!snap.exists()) return []
  return Object.values(snap.val() as Record<string, Display>)
}

/** Subscribe to a single display. Returns unsubscribe fn. */
export function onDisplayChange(
  id: string,
  callback: (display: Display | null) => void,
): () => void {
  const r = displayRef(id)
  const handler = (snap: DataSnapshot) => {
    callback(snap.exists() ? (snap.val() as Display) : null)
  }
  onValue(r, handler)
  return () => off(r, 'value', handler)
}

/** Subscribe to all displays. Returns unsubscribe fn. */
export function onDisplaysChange(callback: (displays: Display[]) => void): () => void {
  const r = displaysRef()
  const handler = (snap: DataSnapshot) => {
    if (!snap.exists()) { callback([]); return }
    callback(Object.values(snap.val() as Record<string, Display>))
  }
  onValue(r, handler)
  return () => off(r, 'value', handler)
}

// ── Roles ────────────────────────────────────────────────────

export async function loadRoles(): Promise<string[]> {
  const snap = await get(rolesRef())
  if (!snap.exists()) return []
  const val = snap.val()
  return Array.isArray(val) ? val : []
}

export async function saveRoles(roles: string[]): Promise<void> {
  await set(rolesRef(), roles)
}

/** Subscribe to roles. Returns unsubscribe fn. */
export function onRolesChange(callback: (roles: string[]) => void): () => void {
  const r = rolesRef()
  const handler = (snap: DataSnapshot) => {
    if (!snap.exists()) { callback([]); return }
    const val = snap.val()
    callback(Array.isArray(val) ? val : [])
  }
  onValue(r, handler)
  return () => off(r, 'value', handler)
}

// ── Settings ─────────────────────────────────────────────────

const DEFAULT_SETTINGS: AppSettings = {
  pollInterval: 8000,
  theme: 'dark',
  appTitle: 'MicBoard',
  showClock: true,
  animateTransitions: true,
  defaultLayout: 'grid',
}

export async function getSettings(): Promise<AppSettings> {
  const snap = await get(settingsRef())
  if (!snap.exists()) return DEFAULT_SETTINGS
  return { ...DEFAULT_SETTINGS, ...(snap.val() as Partial<AppSettings>) }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const updated = { ...settings, updatedAt: new Date().toISOString() }
  await set(settingsRef(), updated)
}

// ── First-run init ────────────────────────────────────────────

/**
 * Creates default settings if the database is completely empty.
 * Safe to call on every app start.
 */
export async function initIfEmpty(): Promise<void> {
  const snap = await get(settingsRef())
  if (!snap.exists()) {
    await set(settingsRef(), { ...DEFAULT_SETTINGS, updatedAt: new Date().toISOString() })
  }
}

// ── Ref export (for advanced use) ────────────────────────────

export { displayRef, displaysRef, usersRef, rolesRef, settingsRef }
export type { DatabaseReference }
