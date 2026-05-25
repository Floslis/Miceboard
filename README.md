# MicBoard

**Live microphone & position display for churches and events.**  
Assign wireless microphones to people in real time — displayed on any screen or as an OBS Browser Source.

{Foto (Hero-Shot: das fertige Display auf einem großen Bildschirm oder TV, mehrere Slots mit Personenfotos und Namen sichtbar, dunkler Hintergrund)}

---

## What it does

MicBoard shows which microphone belongs to which person — live, with no page refresh needed. A sound engineer or volunteer assigns mics in the admin panel; every connected display updates instantly.

{Foto (Split-Screen: links das Admin-Panel mit Slot-Zuweisung, rechts gleichzeitig das Display wie es sich in Echtzeit aktualisiert)}

---

## Features

- **Real-time sync** — Firebase Realtime Database pushes updates in under 100 ms
- **Optimistic UI** — Assignments show on screen the moment you click, before the server even confirms
- **Multiple displays** — Run separate screens for main stage, side stage, livestream OBS scene, etc.
- **Flexible slots** — Add, rename and reorder slots per display (Preacher, Vox 1, Vox 2, Moderator …)
- **Aspect ratio per display** — 16:9, 21:9 and 32:9 for ultrawide and multi-screen setups
- **User photos** — Upload a photo per person; shown on both the display and the admin panel
- **Password-protected admin** — Simple password login, no user accounts required
- **100 % free to run** — GitHub Pages for hosting, Firebase free tier for the database, GitHub for image storage

---

## Screenshots

### Admin panel

{Foto (Admin-Panel Gesamtansicht: linke Sidebar mit Nutzer-/Display-Liste, rechts das aktive Display mit mehreren Slots, einige belegt mit Personenfotos)}

{Foto (Nahaufnahme Slot-Zuweisung: Klick auf einen leeren Slot öffnet die Personenauswahl mit Fotos)}

### Display screen

{Foto (Display-Ansicht auf TV oder Beamer: 4–6 Slots mit großen Personenfotos, Namen und Rollenbeschriftung, cleaner dunkler Look)}

{Foto (Display in OBS als Browser Source: erkennbares OBS-Interface mit eingebetteter MicBoard-Ansicht)}

### Mobile

{Foto (Admin-Panel auf dem Smartphone: Slots gut bedienbar, Zuweisung per Tap)}

---

## Architecture

| What | Where | Why |
|---|---|---|
| Users, displays, roles, settings | Firebase Realtime Database | < 100 ms writes, WebSocket real-time sync |
| User photos / images | Private GitHub repo | Free, no Firebase Storage needed |
| App hosting | GitHub Pages | Free, auto-deploy via GitHub Actions |

Images stay on GitHub and are referenced by URL — Firebase Storage is not used and not required.  
The Firebase free tier (Spark plan) covers everything MicBoard needs: 1 GB storage, 10 GB/month transfer.

---

## Setup

### 1 · Fork & clone

Click **Fork** at the top right, then:

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_FORK.git
cd YOUR_FORK
npm install
```

### 2 · Create a Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) → **Add project**
2. In the project: **Build → Realtime Database → Create database** → choose a region → start in **test mode**
3. Note your **Database URL** (e.g. `https://your-project-default-rtdb.europe-west1.firebasedatabase.app`)
4. Go to **Project settings → General → Your apps → Add app (Web)** → note the config values

{Foto (Firebase Console: Realtime Database Übersicht mit Datenbankinhalt – users, displays, config als Baumstruktur sichtbar)}

### 2a · Enable Anonymous Authentication

MicBoard uses Firebase Anonymous Auth so the admin can write to the database.  
**This step is required — without it all writes will fail with PERMISSION_DENIED.**

1. In your Firebase project: **Build → Authentication**
2. If you see a **"Get started"** button, click it first
3. Go to the **Sign-in method** tab
4. Click **Anonymous** → toggle **Enable** → **Save**

{Foto (Firebase Console: Authentication → Sign-in method, Anonymous-Eintrag mit aktiviertem Toggle)}

### 3 · Create a private GitHub repo for images

Create a new **private** repository (e.g. `micboard-data`) — this is where user photos will be stored.  
Generate a **Personal Access Token** (PAT) with `repo` scope under  
**Settings → Developer settings → Personal access tokens → Fine-grained tokens**.

### 4 · Set GitHub Secrets

In your forked repository: **Settings → Secrets and variables → Actions → New repository secret**

| Secret | Value |
|---|---|
| `VITE_ADMIN_PASSWORD` | Password for the admin login |
| `VITE_FIREBASE_API_KEY` | From Firebase project settings |
| `VITE_FIREBASE_PROJECT_ID` | e.g. `my-project-12345` |
| `VITE_FIREBASE_DATABASE_URL` | e.g. `https://my-project-default-rtdb.europe-west1.firebasedatabase.app` |
| `VITE_GITHUB_TOKEN` | Your PAT (for image uploads) |
| `VITE_GITHUB_OWNER` | Your GitHub username |
| `VITE_DATA_REPO` | Name of the private image repo |
| `VITE_DATA_BRANCH` | Branch name, usually `main` |

Also add this **variable** (not a secret — it can be public):

| Variable | Value |
|---|---|
| `VITE_BASE_PATH` | `/YOUR_REPO_NAME/` — e.g. `/Miceboard/` |

{Foto (GitHub Repository Settings: Secrets and Variables Seite mit den eingetragenen Secrets, Werte geschwärzt)}

### 5 · Enable GitHub Pages

**Settings → Pages → Source: GitHub Actions** → Save.

### 6 · Deploy

Push anything to `main` — GitHub Actions builds and deploys automatically.  
Your app will be live at `https://YOUR_USERNAME.github.io/YOUR_REPO/`

{Foto (GitHub Actions: grüner Haken bei Build und Deploy Job nach erfolgreichem Deployment)}

### 7 · Migrate existing data (optional)

Coming from the old GitHub-based MicBoard backend? Open `migrate.html` from the repo root in your browser, enter your old GitHub credentials and new Firebase credentials — all users, displays, roles and settings transfer in one click.

---

## Tighten security after setup

Once everything works, update the Firebase rules under **Realtime Database → Rules**:

```json
{
  "rules": {
    ".read": true,
    ".write": "auth != null"
  }
}
```

The admin login triggers anonymous Firebase auth — only logged-in admins can write. Display screens read without auth.

> **Prerequisite:** Anonymous Authentication must be enabled (see step 2a). If you get `PERMISSION_DENIED` after setting these rules, that is the cause.

---

## Opening displays

Each display has its own URL:

```
https://YOUR_USERNAME.github.io/YOUR_REPO/#/display/DISPLAY_ID
```

Open these directly as an **OBS Browser Source** or on any **TV / projector**.  
The display updates in real time — no refresh needed, ever.

---

## Pulling updates from the original repo

When new versions appear in [Floslis/Miceboard](https://github.com/Floslis/Miceboard), sync your fork:

**Via GitHub (easiest):** Go to your fork → click **Sync fork → Update branch**

**Via terminal:**
```bash
git remote add upstream https://github.com/Floslis/Miceboard.git
git fetch upstream
git merge upstream/main
git push
```

---

## Local development

Create a `.env.local` file:

```env
VITE_ADMIN_PASSWORD=yourpassword
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.europe-west1.firebasedatabase.app
VITE_GITHUB_TOKEN=ghp_...
VITE_GITHUB_OWNER=your-username
VITE_DATA_REPO=your-image-repo
VITE_DATA_BRANCH=main
VITE_BASE_PATH=/
```

Then:

```bash
npm run dev
```

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript |
| Build | Vite |
| Styling | TailwindCSS |
| Routing | React Router v6 (HashRouter) |
| Real-time data | Firebase Realtime Database |
| Auth | Firebase Anonymous Auth |
| Image storage | GitHub REST API |
| Hosting | GitHub Pages |
| CI/CD | GitHub Actions |

---

## Roadmap

- **Planning Center Online (PCO)** — import service plans and team members automatically
- **Shure Wireless** — live battery, RF and mute status from Axient Digital, ULX-D, QLXD
- **Sennheiser Wireless** — live status from Digital 6000 and EW-DX systems

---

## License

MIT — fork, adapt, use freely.

---

*Built for live production teams that need fast, reliable, zero-fuss microphone tracking.*
