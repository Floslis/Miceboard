// ─────────────────────────────────────────────────────────────
// MicBoard – Polling Hook
// Drives automatic refresh for display pages
// ─────────────────────────────────────────────────────────────

import { useEffect, useRef, useCallback, useState } from 'react'

interface PollingOptions {
  interval?: number       // ms, default 8000
  enabled?: boolean       // pause when false
  onError?: (err: Error) => void
}

/** Calls `callback` immediately and then every `interval` milliseconds */
export function usePolling(
  callback: () => Promise<void> | void,
  options: PollingOptions = {},
) {
  const { interval = 8000, enabled = true, onError } = options
  const callbackRef = useRef(callback)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isPolling, setIsPolling]     = useState(false)

  useEffect(() => { callbackRef.current = callback }, [callback])

  const run = useCallback(async () => {
    setIsPolling(true)
    try {
      await callbackRef.current()
      setLastUpdated(new Date())
    } catch (err) {
      onError?.(err as Error)
    } finally {
      setIsPolling(false)
    }
  }, [onError])

  useEffect(() => {
    if (!enabled) return

    // Run immediately
    run()

    const id = setInterval(run, interval)
    return () => clearInterval(id)
  }, [enabled, interval, run])

  return { lastUpdated, isPolling, runNow: run }
}

/** Debounce helper for save operations */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  useEffect(() => {
    const id = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debouncedValue
}
