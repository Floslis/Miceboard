import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'
import clsx from 'clsx'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastMessage {
  id: string
  type: ToastType
  message: string
}

interface Props {
  toasts: ToastMessage[]
  onDismiss: (id: string) => void
}

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const show = setTimeout(() => setVisible(true), 10)
    const hide = setTimeout(() => {
      setVisible(false)
      setTimeout(onDismiss, 300)
    }, 3500)
    return () => { clearTimeout(show); clearTimeout(hide) }
  }, [onDismiss])

  const Icon = toast.type === 'success' ? CheckCircle
    : toast.type === 'error' ? XCircle
    : AlertCircle

  const colors = {
    success: 'border-green-500/40 bg-green-500/10 text-green-300',
    error:   'border-red-500/40 bg-red-500/10 text-red-300',
    info:    'border-brand-500/40 bg-brand-500/10 text-brand-300',
  }

  return (
    <div
      className={clsx(
        'flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-sm',
        'transition-all duration-300 max-w-sm w-full shadow-xl',
        colors[toast.type],
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
      )}
    >
      <Icon className="w-5 h-5 shrink-0 mt-0.5" />
      <p className="text-sm font-medium flex-1">{toast.message}</p>
      <button onClick={() => { setVisible(false); setTimeout(onDismiss, 300) }}
        className="opacity-60 hover:opacity-100 transition-opacity">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export default function ToastContainer({ toasts, onDismiss }: Props) {
  if (toasts.length === 0) return null
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 items-end">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  )
}

// ── Hook ────────────────────────────────────────────────────

export function useToasts() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const add = (message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, type, message }])
  }

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return {
    toasts,
    toast: {
      success: (msg: string) => add(msg, 'success'),
      error:   (msg: string) => add(msg, 'error'),
      info:    (msg: string) => add(msg, 'info'),
    },
    dismiss,
  }
}
