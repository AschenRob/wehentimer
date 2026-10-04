import { Loader2 } from 'lucide-react'
import { SleepListItem } from '@/components/SleepListItem'
import type { Sleep, SleepDraft } from '@/types/sleep'

interface SleepListProps {
  sleeps: Sleep[]
  isLoading: boolean
  onUpdate: (id: string, draft: Partial<SleepDraft>) => Promise<unknown>
  onDelete: (id: string) => Promise<unknown>
}

export function SleepList({ sleeps, isLoading, onUpdate, onDelete }: SleepListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Schlaf wird geladen ...
      </div>
    )
  }

  if (sleeps.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Noch kein Schlaf erfasst. Starte oben den Timer oder trage Schlaf nach.
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-2">
      {sleeps.map((s) => (
        <SleepListItem key={s.id} sleep={s} onUpdate={onUpdate} onDelete={onDelete} />
      ))}
    </ul>
  )
}
