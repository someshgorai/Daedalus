import { useState, useEffect, useCallback } from "react"
import { extractContext, refreshCodeContext } from "~/utils/leetcode"
import type { LCContext } from "~/utils/types"

export function useLeetCode() {
  const [context, setContext] = useState<LCContext | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [isRescanning, setIsRescanning] = useState(false)

  // LeetCode mounts the editor late, so a few delayed scans are safer.
  useEffect(() => {
    let cancelled = false
    const timers: number[] = []
    const delays = [0, 400, 1200, 2500]

    for (const delay of delays) {
      const timer = window.setTimeout(() => {
        if (cancelled) return
        const ctx = extractContext()
        setContext((current) => {
          if (current?.code && !ctx.code) return current
          return ctx
        })
        setLoaded(true)
      }, delay)
      timers.push(timer)
    }

    return () => {
      cancelled = true
      timers.forEach(window.clearTimeout)
    }
  }, [])

  const rescanCode = useCallback(async (): Promise<LCContext> => {
    setIsRescanning(true)
    try {
      // Give Monaco a beat to commit the latest keystroke.
      await new Promise((resolve) => window.setTimeout(resolve, 80))
      const updated = context
        ? refreshCodeContext(context)
        : extractContext()
      setContext(updated)
      return updated
    } finally {
      setIsRescanning(false)
    }
  }, [context])

  return {
    context,
    loaded,
    isRescanning,
    rescanCode,
  }
}
