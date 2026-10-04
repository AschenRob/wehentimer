import { useRealtimeCollection } from '@/hooks/useRealtimeCollection'
import { CONTRACTIONS_COLLECTION } from '@/lib/pocketbase'
import type { Contraction, ContractionDraft } from '@/types/contraction'

const LABELS = { singular: 'Wehe', plural: 'Wehen' }

/** Lädt alle Wehen eines Babys, hält sie per Realtime-Subscription geräteübergreifend synchron. */
export function useContractions(babyId: string) {
  const { items, isLoading, create, update, remove } = useRealtimeCollection<
    Contraction,
    ContractionDraft
  >(CONTRACTIONS_COLLECTION, babyId, LABELS)

  return {
    contractions: items,
    isLoading,
    createContraction: create,
    updateContraction: update,
    deleteContraction: remove,
  }
}
