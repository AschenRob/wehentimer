import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { CONTRACTIONS_COLLECTION, pb } from '@/lib/pocketbase'
import type { Contraction, ContractionDraft } from '@/types/contraction'

function sortByStartDesc(items: Contraction[]): Contraction[] {
  return [...items].sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime())
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
            return sortByStartDesc([e.record, ...prev])
          }
          if (e.action === 'update') {
            return sortByStartDesc(prev.map((c) => (c.id === e.record.id ? e.record : c)))
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
    const optimisticId = `optimistic-${crypto.randomUUID()}`
    const now = new Date().toISOString()
    const optimistic: Contraction = { id: optimisticId, created: now, updated: now, ...draft }
    setContractions((prev) => sortByStartDesc([optimistic, ...prev]))
    try {
      const record = await pb
        .collection(CONTRACTIONS_COLLECTION)
        .create<Contraction>(draft, { requestKey: null })
      setContractions((prev) => sortByStartDesc(prev.map((c) => (c.id === optimisticId ? record : c))))
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
      sortByStartDesc(prev.map((c) => (c.id === id ? { ...c, ...draft } : c))),
    )
    try {
      const record = await pb
        .collection(CONTRACTIONS_COLLECTION)
        .update<Contraction>(id, draft, { requestKey: null })
      setContractions((prev) => sortByStartDesc(prev.map((c) => (c.id === id ? record : c))))
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
