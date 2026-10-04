import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { BABIES_COLLECTION, pb } from '@/lib/pocketbase'
import type { Baby, BabyInput } from '@/types/baby'

function toPayload(input: BabyInput) {
  return {
    name: input.name,
    due_date: input.due_date ? `${input.due_date} 00:00:00.000Z` : '',
    gender: input.gender,
  }
}

function sortByCreated(babies: Baby[]): Baby[] {
  return [...babies].sort((a, b) => a.created.localeCompare(b.created))
}

/** Lädt alle Babys (älteste zuerst) und hält sie geräteübergreifend per Realtime synchron. */
export function useBabies() {
  const [babies, setBabies] = useState<Baby[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isCancelled = false

    async function load() {
      try {
        const records = await pb
          .collection(BABIES_COLLECTION)
          .getFullList<Baby>({ requestKey: null })
        if (!isCancelled) setBabies(sortByCreated(records))
      } catch (err) {
        console.error('Babys konnten nicht geladen werden', err)
        toast.error('Babys konnten nicht geladen werden.')
      } finally {
        if (!isCancelled) setIsLoading(false)
      }
    }
    load()

    let unsubscribe: (() => void) | undefined
    pb.collection(BABIES_COLLECTION)
      .subscribe<Baby>('*', (e) => {
        setBabies((prev) => {
          const others = prev.filter((b) => b.id !== e.record.id)
          return e.action === 'delete' ? others : sortByCreated([...others, e.record])
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

  const createBaby = useCallback(async (input: BabyInput) => {
    try {
      const record = await pb
        .collection(BABIES_COLLECTION)
        .create<Baby>(toPayload(input), { requestKey: null })
      setBabies((prev) => sortByCreated([...prev.filter((b) => b.id !== record.id), record]))
      return record
    } catch (err) {
      console.error('Baby konnte nicht angelegt werden', err)
      toast.error('Baby konnte nicht angelegt werden.')
      throw err
    }
  }, [])

  const updateBaby = useCallback(async (id: string, input: BabyInput) => {
    try {
      const record = await pb
        .collection(BABIES_COLLECTION)
        .update<Baby>(id, toPayload(input), { requestKey: null })
      setBabies((prev) => sortByCreated(prev.map((b) => (b.id === id ? record : b))))
    } catch (err) {
      console.error('Baby konnte nicht gespeichert werden', err)
      toast.error('Baby konnte nicht gespeichert werden.')
      throw err
    }
  }, [])

  const deleteBaby = useCallback(async (id: string) => {
    try {
      await pb.collection(BABIES_COLLECTION).delete(id, { requestKey: null })
      setBabies((prev) => prev.filter((b) => b.id !== id))
    } catch (err) {
      console.error('Baby konnte nicht gelöscht werden', err)
      toast.error('Baby konnte nicht gelöscht werden.')
      throw err
    }
  }, [])

  return { babies, isLoading, createBaby, updateBaby, deleteBaby }
}
