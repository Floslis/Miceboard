# 🎤 MicBoard

**Live microphone & position display for churches, events, and stage productions.**  
**Live-Mikrofon & Positionsanzeige für Kirchen, Events und Bühnenproduktionen.**

---

<!-- SCREENSHOT PLACEHOLDER – replace with real screenshot once deployed -->
<!-- ![MicBoard Admin Panel](docs/screenshot-admin.png) -->
<!-- ![MicBoard Display View](docs/screenshot-display.png) -->

> **Note / Hinweis:** Screenshots werden nach dem ersten Live-Einsatz ergänzt.

---

## 🌍 Language / Sprache

- [🇩🇪 Deutsch](#deutsch)
- [🇬🇧 English](#english)

---

<a id="deutsch"></a>
# 🇩🇪 Deutsch

## Was ist MicBoard?

MicBoard ist ein webbasiertes Display-System das in Echtzeit anzeigt, welche Person welches Mikrofon oder welche Bühnenposition belegt. Es ist speziell für den Einsatz in:

- ⛪ Kirchen und Gottesdiensten
- 🎤 Moderationen und Events
- 🎸 Bühnenproduktionen und Konzerten
- 📡 Streams und Online-Übertragungen
- 🎬 Theater und Showproduktionen

### Warum MicBoard?

Das Soundteam weiß immer genau, wer gerade welches Mikrofon trägt – ohne Zuruferei, ohne Zettel, ohne Missverständnisse. Displays können auf TVs, Beamern oder als OBS Browser Source laufen.

### Technischer Ansatz: 100 % GitHub-nativ

MicBoard braucht keinen eigenen Server, keine Datenbank und keine externen Dienste.  
Alle Daten liegen als JSON-Dateien in einem **privaten GitHub Repository**.  
Die App läuft kostenlos auf **GitHub Pages**.

---

## Schnellstart (5 Minuten)

### Schritt 1 – Repository forken

Klicke oben rechts auf **Fork** und erstelle deine eigene Kopie des Repositories.

### Schritt 2 – GitHub Pages aktivieren

In deinem geforkten Repo: **Settings → Pages → Source: GitHub Actions** → Speichern.

### Schritt 3 – Privates Datenrepository erstellen

Erstelle ein **neues privates** Repository, z. B. `micboard-data`.  
Aktiviere beim Erstellen „Add a README file" (damit das Repo nicht leer ist).

### Schritt 4 – GitHub Token erstellen

Gehe zu **GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens**.

Berechtigungen für das **Datenrepository**:
- **Contents** – Read and write
- **Metadata** – Read

Oder: Classic Token mit `repo` Scope.

### Schritt 5 – Secrets eintragen

In deinem **öffentlichen** Fork-Repo: **Settings → Secrets and variables → Actions**

| Secret | Beschreibung |
|--------|-------------|
| `VITE_GITHUB_TOKEN` | Dein Personal Access Token |
| `VITE_GITHUB_OWNER` | Dein GitHub-Benutzername |
| `VITE_DATA_REPO` | Name des Daten-Repos (z. B. `micboard-data`) |
| `VITE_DATA_BRANCH` | Branch des Daten-Repos (meistens `main`) |
| `VITE_ADMIN_PASSWORD` | Dein Admin-Passwort |

Unter **Variables** (nicht Secrets!):

| Variable | Wert |
|----------|------|
| `VITE_BASE_PATH` | `/dein-repo-name/` – z. B. `/Miceboard/` |

### Schritt 6 – Deployment starten

**Actions → Deploy to GitHub Pages → Run workflow**

Nach ca. 1–2 Minuten ist die App live.

### Schritt 7 – Ersteinrichtung

Öffne `https://DEIN-USERNAME.github.io/REPO-NAME/`

1. Gib Token, Owner und Datenrepository ein
2. Klicke **Speichern & einrichten** – die App erstellt alle nötigen Dateien automatisch
3. Logge dich mit deinem Admin-Passwort ein
4. Lege Nutzer an, lade Fotos hoch, konfiguriere Displays

---

## Displays aufrufen

Jedes Display hat eine eigene URL:

```
https://DEIN-USERNAME.github.io/REPO-NAME/display/DISPLAY-ID
```

Beispiel: `.../display/main-stage`, `.../display/backstage`

Diese URLs können direkt als **OBS Browser Source** oder auf einem **TV/Beamer** geöffnet werden.

---

## Updates aus dem Original-Repository ziehen

Wenn im Original-Repository (Floslis/Miceboard) Updates erscheinen, kannst du diese in deinen Fork übernehmen:

**Per GitHub-Weboberfläche (einfachste Methode):**
1. Gehe zu deinem Fork auf GitHub
2. Klicke auf **"Sync fork"** → **"Update branch"**

**Per Terminal:**
```bash
git remote add upstream https://github.com/Floslis/Miceboard.git
git fetch upstream
git merge upstream/main
git push
```

> ⚠️ Eigene Anpassungen am Code solltest du in einem separaten Branch oder per Fork-Commit sichern, damit Merges reibungslos laufen.

---

## Datenstruktur

```
micboard-data/          ← privates GitHub-Repo
├── config/
│   ├── settings.json   ← globale Einstellungen
│   └── logo.webp       ← dein Logo (optional)
├── displays/
│   └── main-stage.json ← Display-Konfiguration
├── images/
│   └── user-xyz.webp   ← Profilbilder
└── users/
    └── user-1.json     ← Nutzerdaten
```

---

## Lokale Entwicklung

```bash
git clone https://github.com/DEIN-USERNAME/Miceboard.git
cd Miceboard
npm install
cp .env.example .env.local
# .env.local mit deinen Werten füllen
npm run dev
```

---

<a id="english"></a>
# 🇬🇧 English

## What is MicBoard?

MicBoard is a web-based display system that shows in real time which person is using which microphone or stage position. It's built for:

- ⛪ Churches and worship services
- 🎤 Events and moderated shows
- 🎸 Stage productions and concerts
- 📡 Live streams and broadcasts
- 🎬 Theater and live TV productions

### Why MicBoard?

The sound team always knows who's wearing which mic — no shouting across the room, no sticky notes, no confusion. Displays work on TVs, projectors, or as OBS browser sources.

### Technical approach: 100 % GitHub-native

MicBoard needs no server, no database, no third-party services.  
All data is stored as JSON files in a **private GitHub repository**.  
The app runs for free on **GitHub Pages**.

---

## Quick Start (5 minutes)

### Step 1 – Fork the repository

Click **Fork** in the top-right corner to create your own copy.

### Step 2 – Enable GitHub Pages

In your fork: **Settings → Pages → Source: GitHub Actions** → Save.

### Step 3 – Create a private data repository

Create a **new private** repository, e.g. `micboard-data`.  
Enable "Add a README file" during creation so the repo isn't empty.

### Step 4 – Create a GitHub token

Go to **GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens**.

Required permissions on the **data repository**:
- **Contents** – Read and write
- **Metadata** – Read

Or: Classic token with `repo` scope.

### Step 5 – Set up secrets

In your **public** fork: **Settings → Secrets and variables → Actions**

| Secret | Description |
|--------|-------------|
| `VITE_GITHUB_TOKEN` | Your personal access token |
| `VITE_GITHUB_OWNER` | Your GitHub username |
| `VITE_DATA_REPO` | Name of the data repo (e.g. `micboard-data`) |
| `VITE_DATA_BRANCH` | Branch of the data repo (usually `main`) |
| `VITE_ADMIN_PASSWORD` | Your admin password |

Under **Variables** (not Secrets!):

| Variable | Value |
|----------|-------|
| `VITE_BASE_PATH` | `/your-repo-name/` – e.g. `/Miceboard/` |

### Step 6 – Trigger deployment

**Actions → Deploy to GitHub Pages → Run workflow**

After about 1–2 minutes the app is live.

### Step 7 – First-run setup

Open `https://YOUR-USERNAME.github.io/REPO-NAME/`

1. Enter your token, owner and data repository
2. Click **Save & initialize** – the app creates all required files automatically
3. Log in with your admin password
4. Create users, upload photos, configure displays

---

## Opening displays

Each display has its own URL:

```
https://YOUR-USERNAME.github.io/REPO-NAME/display/DISPLAY-ID
```

Example: `.../display/main-stage`, `.../display/backstage`

Open these URLs directly as an **OBS Browser Source** or on a **TV/projector**.

---

## Pulling updates from the original repository

When updates appear in the original repo (Floslis/Miceboard), you can merge them into your fork:

**Via GitHub web interface (easiest):**
1. Go to your fork on GitHub
2. Click **"Sync fork"** → **"Update branch"**

**Via terminal:**
```bash
git remote add upstream https://github.com/Floslis/Miceboard.git
git fetch upstream
git merge upstream/main
git push
```

> ⚠️ If you've made custom code changes, save them in a separate branch first so merges go smoothly.

---

## Data structure

```
micboard-data/          ← private GitHub repo
├── config/
│   ├── settings.json   ← global settings
│   └── logo.webp       ← your logo (optional)
├── displays/
│   └── main-stage.json ← display configuration
├── images/
│   └── user-xyz.webp   ← profile images
└── users/
    └── user-1.json     ← user data
```

---

## Local development

```bash
git clone https://github.com/YOUR-USERNAME/Miceboard.git
cd Miceboard
npm install
cp .env.example .env.local
# fill in .env.local with your values
npm run dev
```

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript |
| Build tool | Vite |
| Styling | TailwindCSS |
| Routing | React Router v6 |
| Data storage | GitHub REST API |
| Hosting | GitHub Pages |
| CI/CD | GitHub Actions |

---

## License

MIT – fork, adapt, use freely.

---

*Built for live production teams that need fast, reliable, and simple microphone tracking.*
