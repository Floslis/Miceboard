# 🎤 MicBoard

**Live microphone & position display system for churches, events, and stage productions.**

MicBoard runs 100 % on GitHub – no server, no database, no extra services needed.
All you need is a GitHub account and two repositories.

---

## Features

- **Multiple displays** – each with its own URL (stage left, backstage, stream, …)
- **Live polling** – displays refresh automatically every few seconds
- **User management** – profiles with photos, names, and accent colours
- **Slot assignment** – quick single-click assignment during live events
- **Image optimisation** – photos are auto-converted to WebP in-browser
- **Fullscreen ready** – works on TVs, beamers, and OBS browser sources
- **GitHub-native** – fork, configure, and host for free in minutes

---

## Quick start (5 minutes)

### 1 — Fork the public repo

Click **Fork** on this repository. This gives you your own copy of MicBoard.

### 2 — Create a private data repository

Create a **new private** GitHub repository (e.g. `micboard-data`).

Initialise it with the following folder structure (you can commit example files from `example-data/`):

```
micboard-data/
├── users/
│   └── user-1.json
├── displays/
│   └── main-stage.json
├── config/
│   └── settings.json
└── images/
```

### 3 — Generate a GitHub Personal Access Token

Go to **GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens**.

Required permissions on your **private data repository**:
- **Contents** – Read and write
- **Metadata** – Read

Or use a classic token with the `repo` scope.

### 4 — Configure secrets in your public repo

Go to your forked repo → **Settings → Secrets and variables → Actions**:

| Secret | Value |
|--------|-------|
| `VITE_GITHUB_TOKEN` | Your personal access token |
| `VITE_GITHUB_OWNER` | Your GitHub username |
| `VITE_DATA_REPO` | Name of your data repo (e.g. `micboard-data`) |
| `VITE_DATA_BRANCH` | Branch name (usually `main`) |
| `VITE_ADMIN_PASSWORD` | A strong password for the admin panel |

Optional variable (under **Variables**, not Secrets):

| Variable | Value |
|----------|-------|
| `VITE_BASE_PATH` | `/micboard/` (if deploying to `username.github.io/micboard`) or `/` for custom domains |

### 5 — Enable GitHub Pages

Go to **Settings → Pages**:
- **Source**: GitHub Actions

Now push any commit (or trigger the workflow manually) to deploy.

### 6 — Done!

Your MicBoard is live at:
- `https://your-username.github.io/micboard/` — admin panel
- `https://your-username.github.io/micboard/display/main-stage` — display page

---

## Development

```bash
# Install dependencies
npm install

# Copy the example env file
cp .env.example .env.local
# → Edit .env.local with your real values

# Start the dev server
npm run dev

# Build for production
npm run build
```

---

## Architecture

```
Browser (React + Vite + TailwindCSS)
         │
         │  GitHub REST API
         ▼
Private data repository (JSON files + images)
         │
         └── users/user-*.json
         └── displays/display-*.json
         └── config/settings.json
         └── images/*.webp
```

### Why GitHub as a database?

- No server costs
- No vendor lock-in
- Full version history of every change
- Easy to backup, export, and self-host
- Works within GitHub's free tier

### Live updates

Display pages poll the GitHub API every 8 seconds (configurable).
Because GitHub's raw content URLs include ETags, unchanged files incur almost no bandwidth.

---

## Data format

### User (`users/{id}.json`)

```jsonc
{
  "id": "user-1",
  "displayName": "Max",          // Short name on the display
  "fullName": "Max Mustermann",  // Full name in admin panel
  "role": "Prediger",            // Optional role tag
  "image": "images/user-1.webp", // Path inside data repo
  "imagePosition": { "x": 50, "y": 25 }, // % for background-position
  "imageScale": 1.2,             // Zoom factor (1.0 = 100%)
  "color": "#6366f1",            // Optional accent hex colour
  "tags": ["worship"],           // Optional tags
  "active": true
}
```

### Display (`displays/{id}.json`)

```jsonc
{
  "id": "main-stage",
  "name": "Hauptbühne",
  "description": "...",
  "layout": "grid",              // "grid" | "row" | "column"
  "slots": [
    {
      "id": "slot-prediger",
      "name": "Prediger",        // Slot label shown on display
      "userId": "user-1",        // Assigned user (omit for empty slot)
      "order": 0,                // Sort order
      "color": "#6366f1"         // Optional slot accent colour
    }
  ]
}
```

### Settings (`config/settings.json`)

```jsonc
{
  "pollInterval": 8000,          // ms between display refreshes
  "theme": "dark",
  "appTitle": "MicBoard",
  "showClock": true,
  "animateTransitions": true,
  "defaultLayout": "grid"
}
```

---

## Display URLs

Each display gets its own URL:

```
/display/{displayId}
```

Examples:
- `/display/main-stage`
- `/display/backstage`
- `/display/stream-control`

Open the URL in full-screen on any browser, TV, or as an OBS browser source.

---

## Extending MicBoard

The codebase is intentionally modular. Planned or easy-to-add features:

- **Drag & drop** slot reordering
- **Multiple themes** (cinema, light, custom brand)
- **OBS integration** via browser source parameters
- **QR codes** on display pages for quick setup
- **Transition animations** between assignments
- **User status** (online/offline/on-stage)
- **Multiple productions/teams** with separate display sets

---

## Troubleshooting

**Display not updating?**
Check the small green dot in the top-right of the display page. If it's gone, the API may be rate-limited. Increase the poll interval in Settings.

**"Connection failed" in setup?**
Verify the token has `repo` (classic) or `Contents: read+write` (fine-grained) permissions, and that the owner + repo name are correct (case-sensitive).

**Images not showing?**
Images are served from `raw.githubusercontent.com`. Your data repo must be accessible with the token you configured.

**GitHub Pages 404 on direct URL?**
The `public/404.html` file handles SPA routing redirects. Make sure it was deployed correctly.

---

## License

MIT – fork, adapt, use freely.

---

*Built for live production teams who need reliable, fast, and simple microphone tracking.*
