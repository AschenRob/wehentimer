import { useEffect, useState } from 'react'

/** Aktuelle Zeit, aktualisiert sich alle `intervalMs` (Default 30s) - damit
 * die 5-1-1-Bewertung auch ohne neue Eingabe mit der Zeit "mitläuft". */
export function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  return now
}
