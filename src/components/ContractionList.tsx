import { Loader2 } from 'lucide-react'
import { ContractionListItem } from '@/components/ContractionListItem'
import type { Contraction, ContractionDraft } from '@/types/contraction'

interface ContractionListProps {
  contractions: Contraction[]
  isLoading: boolean
  onUpdate: (id: string, draft: Partial<ContractionDraft>) => Promise<unknown>
  onDelete: (id: string) => Promise<unknown>
}

export function ContractionList({
  contractions,
  isLoading,
  onUpdate,
  onDelete,
}: ContractionListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Wehen werden geladen ...
      </div>
    )
  }

  if (contractions.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Noch keine Wehen erfasst. Starte oben den Timer oder trage eine Wehe manuell nach.
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-2">
      {contractions.map((c, i) => {
        // Liste ist neueste zuerst -> "vorherige" Wehe steht ein Index weiter hinten.
        const previous = contractions[i + 1]
        const intervalMin = previous
          ? (new Date(c.start).getTime() - new Date(previous.start).getTime()) / 60_000
          : null
        return (
          <ContractionListItem
            key={c.id}
            contraction={c}
            intervalMin={intervalMin}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        )
      })}
    </ul>
  )
}
