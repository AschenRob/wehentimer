import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { pb } from '@/lib/pocketbase'

interface TimedRecord {
  id: string
  start: string
  created: string
  updated: string
}

// Sortiert nach Startzeit absteigend UND entfernt dabei doppelte IDs (erstes
// Vorkommen gewinnt) - reine Absicherung gegen ein einmalig beobachtetes
// StrictMode-Timing (zwei kurzzeitig parallele Realtime-Subscriptions beim
// Doppel-Mount), das denselben Datensatz zweimal in den State einfügen
// konnte. Die Datenbank selbst hatte dabei nie doppelte Zeilen.
function dedupeAndSort<T extends TimedRecord>(items: T[]): T[] {
  const seen = new Set<string>()
  const unique: T[] = []
  for (const item of items) {
    if (seen.has(item.id)) continue
    seen.add(item.id)
    unique.push(item)
  }
  return unique.sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime())
}

// `crypto.randomUUID()` gibt es nur in "secure contexts" (HTTPS oder
// localhost). Im lokalen Netzwerk wird die App aber bewusst per einfachem
// HTTP über die LAN-IP aufgerufen (Smartphone-Zugriff, siehe PROJECT_STATUS.md)
// - dort würde `crypto.randomUUID` fehlen und synchron werfen, wodurch das
// Anlegen komplett fehlschlägt, bevor überhaupt ein Request rausgeht.
// Deshalb hier ein Fallback ohne Web-Crypto-Abhängigkeit.
function randomId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

interface Labels {
  /** z.B. "Wehe" */
  singular: string
  /** z.B. "Wehen" */
  plural: string
}

/**
 * Lädt alle Datensätze einer Collection (neueste zuerst) und hält sie per
 * Realtime-Subscription geräteübergreifend synchron, inkl. optimistischer Updates.
 */
export function useRealtimeCollection<T extends TimedRecord, D extends object>(
  collectionName: string,
  labels: Labels,
) {
  const [items, setItems] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const itemsRef = useRef<T[]>([])

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  useEffect(() => {
    let isCancelled = false

    async function load() {
      try {
        const records = await pb.collection(collectionName).getFullList<T>({
          sort: '-start',
          requestKey: null,
        })
        if (!isCancelled) setItems(records)
      } catch (err) {
        console.error(`${labels.plural} konnten nicht geladen werden`, err)
        toast.error(`${labels.plural} konnten nicht geladen werden.`)
      } finally {
        if (!isCancelled) setIsLoading(false)
      }
    }
    load()

    let unsubscribe: (() => void) | undefined
    pb.collection(collectionName)
      .subscribe<T>('*', (e) => {
        setItems((prev) => {
          if (e.action === 'create') {
            if (prev.some((c) => c.id === e.record.id)) return prev
            return dedupeAndSort([e.record, ...prev])
          }
          if (e.action === 'update') {
            return dedupeAndSort(prev.map((c) => (c.id === e.record.id ? e.record : c)))
          }
          if (e.action === 'delete') {
            return prev.filter((c) => c.id !== e.record.id)
          }
          return prev
        })
      })
      .then((unsub) => {
        if (isCancelled) unsub()
        else unsubscribe = unsub
      })

    return () => {
      isCancelled = true
      unsubscribe?.()
    }
  }, [collectionName, labels.plural])

  const create = useCallback(
    async (draft: D) => {
      const optimisticId = `optimistic-${randomId()}`
      const now = new Date().toISOString()
      const optimistic = { id: optimisticId, created: now, updated: now, ...draft } as unknown as T
      setItems((prev) => dedupeAndSort([optimistic, ...prev]))
      try {
        const record = await pb.collection(collectionName).create<T>(draft, { requestKey: null })
        setItems((prev) => {
          // Die Realtime-Subscription kann den neuen Datensatz per SSE schneller
          // liefern als diese HTTP-Antwort zurückkommt. Ist das passiert, steht
          // der echte Datensatz bereits in der Liste -> Platzhalter nur entfernen
          // statt ihn zusätzlich durch den Datensatz zu ersetzen (sonst Duplikat).
          if (prev.some((c) => c.id === record.id)) {
            return dedupeAndSort(prev.filter((c) => c.id !== optimisticId))
          }
          return dedupeAndSort(prev.map((c) => (c.id === optimisticId ? record : c)))
        })
        return record
      } catch (err) {
        setItems((prev) => prev.filter((c) => c.id !== optimisticId))
        console.error(`${labels.singular} konnte nicht gespeichert werden`, err)
        toast.error(`${labels.singular} konnte nicht gespeichert werden.`)
        throw err
      }
    },
    [collectionName, labels.singular],
  )

  const update = useCallback(
    async (id: string, draft: Partial<D>) => {
      const previous = itemsRef.current
      setItems((prev) => dedupeAndSort(prev.map((c) => (c.id === id ? { ...c, ...draft } : c))))
      try {
        const record = await pb
          .collection(collectionName)
          .update<T>(id, draft, { requestKey: null })
        setItems((prev) => dedupeAndSort(prev.map((c) => (c.id === id ? record : c))))
        return record
      } catch (err) {
        setItems(previous)
        console.error(`${labels.singular} konnte nicht aktualisiert werden`, err)
        toast.error(`${labels.singular} konnte nicht aktualisiert werden.`)
        throw err
      }
    },
    [collectionName, labels.singular],
  )

  const remove = useCallback(
    async (id: string) => {
      const previous = itemsRef.current
      setItems((prev) => prev.filter((c) => c.id !== id))
      try {
        await pb.collection(collectionName).delete(id, { requestKey: null })
      } catch (err) {
        setItems(previous)
        console.error(`${labels.singular} konnte nicht gelöscht werden`, err)
        toast.error(`${labels.singular} konnte nicht gelöscht werden.`)
        throw err
      }
    },
    [collectionName, labels.singular],
  )

  return { items, isLoading, create, update, remove }
}
