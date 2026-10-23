import { Loader2 } from 'lucide-react'
import { FeedingListItem } from '@/components/FeedingListItem'
import { gapMinutes } from '@/lib/feedingStats'
import { isMeal, type Feeding, type FeedingDraft } from '@/types/feeding'

interface FeedingListProps {
  feedings: Feeding[]
  isLoading: boolean
  lastWeight: number
  lastHeight: number
  onUpdate: (id: string, draft: Partial<FeedingDraft>) => Promise<unknown>
  onDelete: (id: string) => Promise<unknown>
}

export function FeedingList({
  feedings,
  isLoading,
  lastWeight,
  lastHeight,
  onUpdate,
  onDelete,
}: FeedingListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Mahlzeiten werden geladen ...
      </div>
    )
  }

  if (feedings.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Noch keine Einträge erfasst. Starte oben den Timer oder trage über + eine Mahlzeit bzw.
        Größe / Gewicht nach.
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-2">
      {feedings.map((f, i) => {
        // Liste ist neueste zuerst -> "vorherige" Mahlzeit ist der nächste Mahlzeit-Eintrag weiter hinten.
        const previous = isMeal(f) ? feedings.slice(i + 1).find(isMeal) : undefined
        const intervalMin = previous ? gapMinutes(previous, f) : null
        return (
          <FeedingListItem
            key={f.id}
            feeding={f}
            intervalMin={intervalMin}
            lastWeight={lastWeight}
            lastHeight={lastHeight}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        )
      })}
    </ul>
  )
}
