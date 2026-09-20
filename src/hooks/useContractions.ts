import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { CONTRACTIONS_COLLECTION, pb } from '@/lib/pocketbase'
import type { Contraction, ContractionDraft } from '@/types/contraction'

// Sortiert nach Startzeit absteigend UND entfernt dabei doppelte IDs (erstes
// Vorkommen gewinnt) - reine Absicherung gegen ein einmalig beobachtetes
// StrictMode-Timing (zwei kurzzeitig parallele Realtime-Subscriptions beim
// Doppel-Mount), das denselben Datensatz zweimal in den State einfügen
// konnte. Die Datenbank selbst hatte dabei nie doppelte Zeilen.
function dedupeAndSort(items: Contraction[]): Contraction[] {
  const seen = new Set<string>()
  const unique: Contraction[] = []
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
// Anlegen einer Wehe komplett fehlschlägt, bevor überhaupt ein Request
// rausgeht. Deshalb hier ein Fallback ohne Web-Crypto-Abhängigkeit.
function randomId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

/** Lädt alle Wehen, hält sie per Realtime-Subscription geräteübergreifend synchron. */
export function useContractions() {
  const [contractions, setContractions] = useState<Contraction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const contractionsRef = useRef<Contraction[]>([])

  useEffect(() => {
    contractionsRef.current = contractions
  }, [contractions])

  useEffect(() => {
    let isCancelled = false

    async function load() {
      try {
        const records = await pb.collection(CONTRACTIONS_COLLECTION).getFullList<Contraction>({
          sort: '-start',
          requestKey: null,
        })
        if (!isCancelled) setContractions(records)
      } catch (err) {
        console.error('Wehen konnten nicht geladen werden', err)
        toast.error('Wehen konnten nicht geladen werden.')
      } finally {
        if (!isCancelled) setIsLoading(false)
      }
    }
    load()

    let unsubscribe: (() => void) | undefined
    pb.collection(CONTRACTIONS_COLLECTION)
      .subscribe<Contraction>('*', (e) => {
        setContractions((prev) => {
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
  }, [])

  const createContraction = useCallback(async (draft: ContractionDraft) => {
    const optimisticId = `optimistic-${randomId()}`
    const now = new Date().toISOString()
    const optimistic: Contraction = { id: optimisticId, created: now, updated: now, ...draft }
    setContractions((prev) => dedupeAndSort([optimistic, ...prev]))
    try {
      const record = await pb
        .collection(CONTRACTIONS_COLLECTION)
        .create<Contraction>(draft, { requestKey: null })
      setContractions((prev) => {
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
      setContractions((prev) => prev.filter((c) => c.id !== optimisticId))
      console.error('Wehe konnte nicht gespeichert werden', err)
      toast.error('Wehe konnte nicht gespeichert werden.')
      throw err
    }
  }, [])

  const updateContraction = useCallback(async (id: string, draft: Partial<ContractionDraft>) => {
    const previous = contractionsRef.current
    setContractions((prev) =>
      dedupeAndSort(prev.map((c) => (c.id === id ? { ...c, ...draft } : c))),
    )
    try {
      const record = await pb
        .collection(CONTRACTIONS_COLLECTION)
        .update<Contraction>(id, draft, { requestKey: null })
      setContractions((prev) => dedupeAndSort(prev.map((c) => (c.id === id ? record : c))))
      return record
    } catch (err) {
      setContractions(previous)
      console.error('Wehe konnte nicht aktualisiert werden', err)
      toast.error('Wehe konnte nicht aktualisiert werden.')
      throw err
    }
  }, [])

  const deleteContraction = useCallback(async (id: string) => {
    const previous = contractionsRef.current
    setContractions((prev) => prev.filter((c) => c.id !== id))
    try {
      await pb.collection(CONTRACTIONS_COLLECTION).delete(id, { requestKey: null })
    } catch (err) {
      setContractions(previous)
      console.error('Wehe konnte nicht gel\u00f6scht werden', err)
      toast.error('Wehe konnte nicht gel\u00f6scht werden.')
      throw err
    }
  }, [])

  return { contractions, isLoading, createContraction, updateContraction, deleteContraction }
}
