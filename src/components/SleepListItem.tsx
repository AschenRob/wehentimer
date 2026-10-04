import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
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
import { SleepForm } from '@/components/SleepForm'
import { formatDay, formatHoursMinutes, formatTime } from '@/lib/format'
import {
  AFTER_REM_LABELS,
  SLEEP_METHOD_LABELS,
  isNightSleep,
  sleepMinutes,
  type Sleep,
  type SleepDraft,
} from '@/types/sleep'

interface SleepListItemProps {
  sleep: Sleep
  onUpdate: (id: string, draft: Partial<SleepDraft>) => Promise<unknown>
  onDelete: (id: string) => Promise<unknown>
}

export function SleepListItem({ sleep, onUpdate, onDelete }: SleepListItemProps) {
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    setIsDeleting(true)
    try {
      await onDelete(sleep.id)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
          <span>
            {formatDay(sleep.start)} {formatTime(sleep.start)}–{formatTime(sleep.end)}
          </span>
          <span className="text-muted-foreground">·</span>
          <span>{formatHoursMinutes(sleepMinutes(sleep))}</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline">{isNightSleep(sleep) ? 'Nacht' : 'Tag'}</Badge>
          {sleep.method && <Badge variant="outline">{SLEEP_METHOD_LABELS[sleep.method]}</Badge>}
          {sleep.relax_minutes > 0 && (
            <Badge variant="outline">entspannt nach {sleep.relax_minutes} Min</Badge>
          )}
          {sleep.deep_minutes > 0 && (
            <Badge variant="outline">Tiefschlaf nach {sleep.deep_minutes} Min</Badge>
          )}
          {sleep.rem_minutes > 0 && (
            <Badge variant="outline">REM nach {sleep.rem_minutes} Min</Badge>
          )}
          {sleep.after_rem && <Badge variant="outline">{AFTER_REM_LABELS[sleep.after_rem]}</Badge>}
        </div>
        {sleep.note && <p className="truncate text-sm text-muted-foreground">{sleep.note}</p>}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <SleepForm
          mode="edit"
          sleep={sleep}
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          onSubmit={(draft) => onUpdate(sleep.id, draft)}
          trigger={
            <Button variant="ghost" size="icon" aria-label="Schlaf bearbeiten">
              <Pencil className="size-4" />
            </Button>
          }
        />

        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button variant="ghost" size="icon" aria-label="Schlaf löschen">
                <Trash2 className="size-4" />
              </Button>
            }
          />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Schlaf löschen?</AlertDialogTitle>
              <AlertDialogDescription>
                Der Eintrag vom {formatDay(sleep.start)} um {formatTime(sleep.start)} wird
                endgültig gelöscht.
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
