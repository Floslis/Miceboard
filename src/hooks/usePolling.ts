// ─────────────────────────────────────────────────────────────
// MicBoard – Polling Hook
// IMPORTANT: callback AND onError are stored in refs so they
// never appear as useCallback/useEffect dependencies.
// This prevents the common "new arrow function → new run →
// new setInterval → immediate API call → re-render → loop"
// pattern from causing infinite API call storms.
// ─────────────────────────────────────────────────────────────

import { useEffect, useRef, useCallback, useState } from 'react'

interface PollingOptions {
  interval?: number   // ms between polls, default 8000
  enabled?: boolean   // pause when false
  onError?: (err: Error) => void
}

export function usePolling(
  callback: () => Promise<void> | void,
  options: PollingOptions = {},
) {
  const { interval = 8000, enabled = true } = options

  // ── Stable refs – never trigger dependency changes ────────
  const callbackRef = useRef(callback)
  const onErrorRef  = useRef(options.onError)
  const intervalRef = useRef(interval)
  const enabledRef  = useRef(enabled)

  // Keep refs current every render (no deps needed on effects below)
  callbackRef.current  = callback
  onErrorRef.current   = options.onError
  intervalRef.current  = interval
  enabledRef.current   = enabled

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isPolling, setIsPolling]     = useState(false)

  // ── run is STABLE (empty dep array) ──────────────────────
  const run = useCallback(async () => {
    if (!enabledRef.current) return
    setIsPolling(true)
    try {
      await callbackRef.current()
      setLastUpdated(new Date())
    } catch (err) {
      onErrorRef.current?.(err as Error)
    } finally {
      setIsPolling(false)
    }
  }, []) // ← intentionally empty; refs handle everything

  // ── Single effect: runs once on mount, restarts if interval changes
  useEffect(() => {
    if (!enabled) return
    run() // immediate first poll
    const id = setInterval(() => run(), interval)
    return () => clearInterval(id)
    // interval and enabled are the only things that should restart the timer
  }, [enabled, interval, run])

  return { lastUpdated, isPolling, runNow: run }
}

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  useEffect(() => {
    const id = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debouncedValue
}
