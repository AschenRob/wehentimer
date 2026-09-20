import { useState } from 'react'
import { Clock, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { ContractionForm } from '@/components/ContractionForm'
import { formatDurationClock, formatMinutes, formatTime } from '@/lib/format'
import type { Contraction, ContractionDraft } from '@/types/contraction'

interface ContractionListItemProps {
  contraction: Contraction
  intervalMin: number | null
  onUpdate: (id: string, draft: Partial<ContractionDraft>) => Promise<unknown>
  onDelete: (id: string) => Promise<unknown>
}

export function ContractionListItem({
  contraction,
  intervalMin,
  onUpdate,
  onDelete,
}: ContractionListItemProps) {
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    setIsDeleting(true)
    try {
      await onDelete(contraction.id)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
          <span>{formatTime(contraction.start)}</span>
          <span className="text-muted-foreground">·</span>
          <span className="font-mono tabular-nums">{formatDurationClock(contraction.duration_sec)}</span>
          {intervalMin != null && (
            <>
              <span className="text-muted-foreground">·</span>
              <span className="font-normal text-muted-foreground">
                Abstand {formatMinutes(intervalMin)}
              </span>
            </>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className="gap-1">
            {contraction.is_manual ? <Pencil className="size-3" /> : <Clock className="size-3" />}
            {contraction.is_manual ? 'manuell' : 'Timer'}
          </Badge>
          {contraction.intensity != null && contraction.intensity > 0 && (
            <Badge variant="outline">Stärke {contraction.intensity}/5</Badge>
          )}
        </div>
        {contraction.note && (
          <p className="truncate text-sm text-muted-foreground">{contraction.note}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <ContractionForm
          mode="edit"
          contraction={contraction}
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          onSubmit={(draft) => onUpdate(contraction.id, draft)}
          trigger={
            <Button variant="ghost" size="icon" aria-label="Wehe bearbeiten">
              <Pencil className="size-4" />
            </Button>
          }
        />

        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button variant="ghost" size="icon" aria-label="Wehe löschen">
                <Trash2 className="size-4" />
              </Button>
            }
          />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Wehe löschen?</AlertDialogTitle>
              <AlertDialogDescription>
                Der Eintrag um {formatTime(contraction.start)} wird endgültig gelöscht.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                Löschen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </li>
  )
}
