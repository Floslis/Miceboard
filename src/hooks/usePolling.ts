// ─────────────────────────────────────────────────────────────
// MicBoard – Polling Hook
// IMPORTANT: callback AND onError are stored in refs so they
// never appear as useCallback/useEffect dependencies.
// This prevents the common "new arrow function → new run →
// new setInterval → immediate API call → re-render → loop"
// pattern from causing infinite API call storms.
//
// Rate-limit protection: consecutive errors trigger exponential
// backoff (30 s → 60 s → 120 s … max 5 min).  The interval
// keeps ticking normally; run() simply skips execution while
// the backoff window is active.
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
  const callbackRef    = useRef(callback)
  const onErrorRef     = useRef(options.onError)
  const intervalRef    = useRef(interval)
  const enabledRef     = useRef(enabled)

  // Backoff state (not React state – updating these must not cause re-renders)
  const errorCountRef  = useRef(0)
  const nextAllowedRef = useRef(0)   // epoch ms: don't poll before this time

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

    // Backoff guard – silently skip until the window expires
    if (Date.now() < nextAllowedRef.current) return

    setIsPolling(true)
    try {
      await callbackRef.current()
      setLastUpdated(new Date())
      // Success – reset backoff
      errorCountRef.current  = 0
      nextAllowedRef.current = 0
    } catch (err) {
      errorCountRef.current += 1
      // Exponential backoff: 30 s, 60 s, 120 s … capped at 5 min
      const backoffMs = Math.min(30_000 * Math.pow(2, errorCountRef.current - 1), 300_000)
      nextAllowedRef.current = Date.now() + backoffMs
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
