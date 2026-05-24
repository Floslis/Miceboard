import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { loadConfig } from '../lib/config'
import DisplayView from '../components/display/DisplayView'

export default function DisplayPage() {
  const { displayId } = useParams<{ displayId: string }>()
  const raw = loadConfig()

  // Stable reference – must not create a new object on every render
  // or DisplayView's poll callback will be recreated and trigger
  // a new setInterval on every render (= infinite API call storm).
  const cfg = useMemo(() => {
    if (!raw) return null
    return { token: raw.token, owner: raw.owner, repo: raw.dataRepo, branch: raw.dataBranch }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw?.token, raw?.owner, raw?.dataRepo, raw?.dataBranch])

  if (!cfg) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-surface-900">
        <div className="text-center space-y-3">
          <p className="text-2xl text-white/20">⚙</p>
          <p className="text-white/50">MicBoard ist noch nicht konfiguriert.</p>
          <a href="/" className="text-brand-400 hover:text-brand-300 text-sm underline">Zum Setup</a>
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
    <div className="w-full h-screen overflow-hidden">
      <DisplayView
        displayId={displayId}
        cfg={cfg}
        showClock
        pollInterval={raw?.pollInterval ?? 8000}
      />
    </div>
  )
}
