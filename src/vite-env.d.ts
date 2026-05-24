/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GITHUB_TOKEN:   string
  readonly VITE_GITHUB_OWNER:   string
  readonly VITE_DATA_REPO:      string
  readonly VITE_DATA_BRANCH:    string
  readonly VITE_POLL_INTERVAL:  string
  readonly VITE_ADMIN_PASSWORD: string
  readonly VITE_BASE_PATH:      string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
