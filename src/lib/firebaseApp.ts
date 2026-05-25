// ─────────────────────────────────────────────────────────────
// MicBoard – Firebase Singleton
// Initialised once; imported wherever db or auth is needed.
// ─────────────────────────────────────────────────────────────

import { initializeApp } from 'firebase/app'
import { getDatabase }   from 'firebase/database'
import { getAuth }       from 'firebase/auth'

const apiKey      = import.meta.env.VITE_FIREBASE_API_KEY      ?? ''
const projectId   = import.meta.env.VITE_FIREBASE_PROJECT_ID   ?? ''
const databaseURL = import.meta.env.VITE_FIREBASE_DATABASE_URL ?? ''

const firebaseConfig = {
  apiKey,
  authDomain:  projectId ? projectId + '.firebaseapp.com' : '',
  databaseURL,
  projectId,
}

/** True when all required env-vars are present */
export function isFirebaseConfigured(): boolean {
  return Boolean(apiKey && projectId && databaseURL)
}

// Only initialise Firebase when the config is complete.
// If env-vars are missing the app renders normally but Firebase calls throw a clear error.
export const app  = isFirebaseConfigured() ? initializeApp(firebaseConfig) : null
export const db   = app ? getDatabase(app) : null
export const auth = app ? getAuth(app)     : null
