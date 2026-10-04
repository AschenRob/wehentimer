import { useRealtimeCollection } from '@/hooks/useRealtimeCollection'
import { SLEEPS_COLLECTION } from '@/lib/pocketbase'
import type { Sleep, SleepDraft } from '@/types/sleep'

const LABELS = { singular: 'Schlaf', plural: 'Schlaf-Einträge' }

/** Lädt alle Schlaf-Einträge eines Babys, geräteübergreifend per Realtime synchron. */
export function useSleeps(babyId: string) {
  const { items, isLoading, create, update, remove } = useRealtimeCollection<Sleep, SleepDraft>(
    SLEEPS_COLLECTION,
    babyId,
    LABELS,
  )

  return {
    sleeps: items,
    isLoading,
    createSleep: create,
    updateSleep: update,
    deleteSleep: remove,
  }
}
