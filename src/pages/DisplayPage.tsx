import { useParams } from 'react-router-dom'
import { loadConfig } from '../lib/config'
import DisplayView from '../components/display/DisplayView'

export default function DisplayPage() {
  const { displayId } = useParams<{ displayId: string }>()
  const cfg = loadConfig()

  if (!cfg) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-surface-900">
        <div className="text-center space-y-3">
          <p className="text-2xl text-white/20">⚙</p>
          <p className="text-white/50">MicBoard ist noch nicht konfiguriert.</p>
          <a href="/" className="text-brand-400 hover:text-brand-300 text-sm underline">
            Zum Setup
          </a>
        </div>
      </div>
    )
  }

  if (!displayId) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-surface-900">
        <p className="text-white/40">Kein Display angegeben.</p>
      </div>
    )
  }

  return (
    <div className="w-full h-screen">
      <DisplayView
        displayId={displayId}
        cfg={{ token: cfg.token, owner: cfg.owner, repo: cfg.dataRepo, branch: cfg.dataBranch }}
        showClock
        pollInterval={cfg.pollInterval}
      />
    </div>
  )
}
