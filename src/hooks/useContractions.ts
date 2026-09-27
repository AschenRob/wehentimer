import { useRealtimeCollection } from '@/hooks/useRealtimeCollection'
import { CONTRACTIONS_COLLECTION } from '@/lib/pocketbase'
import type { Contraction, ContractionDraft } from '@/types/contraction'

const LABELS = { singular: 'Wehe', plural: 'Wehen' }

/** Lädt alle Wehen, hält sie per Realtime-Subscription geräteübergreifend synchron. */
export function useContractions() {
  const { items, isLoading, create, update, remove } = useRealtimeCollection<
    Contraction,
    ContractionDraft
  >(CONTRACTIONS_COLLECTION, LABELS)

  return {
    contractions: items,
    isLoading,
    createContraction: create,
    updateContraction: update,
    deleteContraction: remove,
  }
}
