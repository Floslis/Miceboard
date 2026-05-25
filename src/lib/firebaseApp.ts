// ─────────────────────────────────────────────────────────────
// MicBoard – Firebase Singleton
// Initialised once; imported wherever db or auth is needed.
// ─────────────────────────────────────────────────────────────

import { initializeApp } from 'firebase/app'
import { getDatabase }   from 'firebase/database'
import { getAuth }       from 'firebase/auth'

const firebaseConfig = {
  apiKey:      import.meta.env.VITE_FIREBASE_API_KEY      ?? '',
  authDomain:  (import.meta.env.VITE_FIREBASE_PROJECT_ID  ?? '') + '.firebaseapp.com',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL ?? '',
  projectId:   import.meta.env.VITE_FIREBASE_PROJECT_ID   ?? '',
}

export const app  = initializeApp(firebaseConfig)
export const db   = getDatabase(app)
export const auth = getAuth(app)

/** True when all required env-vars are present */
export function isFirebaseConfigured(): boolean {
  return Boolean(
    import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_PROJECT_ID &&
    import.meta.env.VITE_FIREBASE_DATABASE_URL,
  )
}
