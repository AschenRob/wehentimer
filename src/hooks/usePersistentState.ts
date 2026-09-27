import { useCallback, useState } from 'react'

const PREFIX = 'wehentimer.'

function read<T>(key: string, fallback: T, isValid?: (value: unknown) => value is T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (raw === null) return fallback
    const parsed: unknown = JSON.parse(raw)
    if (isValid && !isValid(parsed)) return fallback
    return parsed as T
  } catch {
    return fallback
  }
}

/** useState, dessen Wert pro Gerät im localStorage überdauert (App-Schließen, Neuladen). */
export function usePersistentState<T>(
  key: string,
  fallback: T,
  isValid?: (value: unknown) => value is T,
): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => read(key, fallback, isValid))

  const update = useCallback(
    (next: T) => {
      setValue(next)
      try {
        localStorage.setItem(PREFIX + key, JSON.stringify(next))
      } catch {
        // Privater Modus/voller Speicher: Wert gilt dann nur bis zum Neuladen.
      }
    },
    [key],
  )

  return [value, update]
}

/** Typ-Guard-Fabrik für String-Unions aus einer Optionsliste. */
export function oneOf<T extends string | number>(options: readonly T[]) {
  return (value: unknown): value is T => options.includes(value as T)
}

export function isIsoStringOrNull(value: unknown): value is string | null {
  return value === null || (typeof value === 'string' && !Number.isNaN(Date.parse(value)))
}
