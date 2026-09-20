import { useEffect, useState } from 'react'

function secondsSince(date: Date): number {
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000))
}

/** Sekunden seit `startedAt`, tickt sekündlich solange `startedAt` gesetzt ist. */
export function useElapsedSeconds(startedAt: Date | null): number {
  const [elapsed, setElapsed] = useState(() => (startedAt ? secondsSince(startedAt) : 0))

  useEffect(() => {
    if (!startedAt) {
      setElapsed(0)
      return
    }
    setElapsed(secondsSince(startedAt))
    const interval = setInterval(() => setElapsed(secondsSince(startedAt)), 1000)
    return () => clearInterval(interval)
  }, [startedAt])

  return elapsed
}
