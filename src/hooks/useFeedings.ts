import { useRealtimeCollection } from '@/hooks/useRealtimeCollection'
import { FEEDINGS_COLLECTION } from '@/lib/pocketbase'
import type { Feeding, FeedingDraft } from '@/types/feeding'

const LABELS = { singular: 'Mahlzeit', plural: 'Mahlzeiten' }

/** Lädt alle Mahlzeiten des Stilltrackers, geräteübergreifend per Realtime synchron. */
export function useFeedings() {
  const { items, isLoading, create, update, remove } = useRealtimeCollection<Feeding, FeedingDraft>(
    FEEDINGS_COLLECTION,
    LABELS,
  )

  return {
    feedings: items,
    isLoading,
    createFeeding: create,
    updateFeeding: update,
    deleteFeeding: remove,
  }
}
