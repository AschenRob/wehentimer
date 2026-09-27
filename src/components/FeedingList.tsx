import { Loader2 } from 'lucide-react'
import { FeedingListItem } from '@/components/FeedingListItem'
import type { Feeding, FeedingDraft } from '@/types/feeding'

interface FeedingListProps {
  feedings: Feeding[]
  isLoading: boolean
  lastWeight: number
  onUpdate: (id: string, draft: Partial<FeedingDraft>) => Promise<unknown>
  onDelete: (id: string) => Promise<unknown>
}

export function FeedingList({
  feedings,
  isLoading,
  lastWeight,
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
        Noch keine Mahlzeiten erfasst. Starte oben den Timer oder trage eine Mahlzeit nach.
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-2">
      {feedings.map((f, i) => {
        // Liste ist neueste zuerst -> "vorherige" Mahlzeit steht ein Index weiter hinten.
        const previous = feedings[i + 1]
        const intervalMin = previous
          ? (new Date(f.start).getTime() - new Date(previous.start).getTime()) / 60_000
          : null
        return (
          <FeedingListItem
            key={f.id}
            feeding={f}
            intervalMin={intervalMin}
            lastWeight={lastWeight}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        )
      })}
    </ul>
  )
}
