# MicBoard – Notizen für Claude

## Branching-Workflow

**Wir arbeiten immer auf `dev`, nicht auf `main`.**

- `main` = stabile, öffentliche Version (GitHub Pages Live-Deployment)
- `dev` = aktiver Entwicklungsbranch – alle neuen Features und Fixes kommen hierhin
- `feature/xyz` = kurzlebige Branches für größere Einzelfeatures, abzweigen von `dev`

Vor jeder Arbeitssession sicherstellen:
```bash
git checkout dev
git pull origin dev
```

Commits pushen:
```bash
git add -A && git commit -m "typ: beschreibung"
git push origin dev
```

Wenn `dev` reif für Production:
```bash
git checkout main && git merge dev && git push origin main
```

---

## Git Push Befehl (mit Token)

```bash
git push https://DEIN_TOKEN@github.com/Floslis/Miceboard.git dev
# oder für main:
git push https://DEIN_TOKEN@github.com/Floslis/Miceboard.git main
```

---

## Projekt-Überblick

**MicBoard** – Live-Mikrofon & Positionsanzeige für Kirchen/Events.  
Tech: React 18 + TypeScript + Vite + TailwindCSS + **Firebase Realtime Database** als Daten-Backend.  
Bilder (Nutzerfotos) liegen weiterhin in einem privaten GitHub-Repo; alle strukturierten Daten (Nutzer, Displays, Rollen, Einstellungen) liegen in Firebase.

### Architektur: Firebase + GitHub

| Was | Wo | Warum |
|---|---|---|
| Nutzer, Displays, Rollen, Einstellungen | Firebase Realtime DB | < 100 ms Writes, WebSocket Echtzeit |
| Nutzerfotos / Bilder | GitHub Daten-Repo | Kostenlos, keine Firebase Storage nötig |
| Hosting / App | GitHub Pages | Kostenlos, einfaches Deploy via Actions |

Firebase Free Tier (Spark): 1 GB Speicher, 10 GB/Monat Transfer – für MicBoard völlig ausreichend.

### Required GitHub Secrets (Repository → Settings → Secrets → Actions)

```
VITE_ADMIN_PASSWORD         # Passwort für Admin-Login
VITE_GITHUB_TOKEN           # GitHub PAT (nur für Bild-Uploads nötig)
VITE_GITHUB_OWNER           # GitHub-Benutzername (für Bild-Uploads)
VITE_DATA_REPO              # Name des privaten Bild-Repos
VITE_DATA_BRANCH            # Branch des Bild-Repos (default: main)
VITE_FIREBASE_API_KEY       # Firebase Web API Key
VITE_FIREBASE_PROJECT_ID    # Firebase Project ID (z. B. icfb-miceboard)
VITE_FIREBASE_DATABASE_URL  # Realtime DB URL (z. B. https://xxx.europe-west1.firebasedatabase.app)
```

> **Hinweis:** Secrets haben immer Vorrang vor localStorage. Nach einer Secret-Änderung + Redeploy gilt sofort der neue Wert.

### Firebase Security Rules

Aktuell: Test-Modus (public read+write). Nach erfolgreicher Migration umstellen auf:

```json
{
  "rules": {
    ".read": true,
    ".write": "auth != null"
  }
}
```

Admin-Login löst `signInAnonymously()` aus → schreibberechtigt. Displays/Read-only-Clients lesen ohne Auth.

### Migration (einmalig, GitHub → Firebase)

`migrate.html` im Repo-Root öffnen → GitHub-Token + Firebase-Daten eingeben → Migrieren.  
Bilder werden dabei **nicht** migriert (sie bleiben auf GitHub und funktionieren weiterhin).

---

### Wichtige Dateien

- `src/lib/firebaseApp.ts` – Firebase-Singleton (App, Database, Auth)
- `src/lib/firebase.ts` – alle Firebase CRUD-Operationen + Echtzeit-Listener
- `src/hooks/useFirebase.ts` – React-Hooks (useUsers, useDisplays, useRoles, useSettings) mit Firebase
- `src/lib/github.ts` – GitHub API Calls **nur noch für Bilder** (uploadBinary, imageUrl, getFileSha)
- `src/pages/AdminPage.tsx` – Admin-Panel (Übersicht, Nutzer, Displays, Einstellungen)
- `src/components/display/DisplayView.tsx` – Live-Display mit Firebase Echtzeit-Listener (kein Polling)
- `src/components/admin/SlotAssignment.tsx` – Zuweisung per Modal (optimistisches UI)
- `src/components/admin/UserEditor.tsx` – Nutzer anlegen/bearbeiten
- `src/components/admin/DisplayPanel.tsx` – Display konfigurieren

### Echtzeit & Performance

- `DisplayView.tsx` verwendet `onValue()` (Firebase WebSocket) statt Polling → sofortige Updates
- Slot-Zuweisungen sind optimistisch: UI aktualisiert sofort, Firebase schreibt im Hintergrund
- `useFirebase.ts` Hooks geben `RemoteData<T>`-kompatible Objekte zurück (`sha: ''`) → alle Komponenten funktionieren ohne Änderungen

---

## Roadmap (geplante Features)
- Planning Center Online (PCO) Integration
- Shure Wireless Integration (Axient Digital, ULX-D, QLXD)
- Sennheiser Integration (Digital 6000, EW-DX)
