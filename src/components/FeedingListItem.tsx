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
import { FeedingForm } from '@/components/FeedingForm'
import { formatDay, formatGrams, formatHoursMinutes, formatMl, formatTime } from '@/lib/format'
import type { Feeding, FeedingDraft } from '@/types/feeding'

interface FeedingListItemProps {
  feeding: Feeding
  intervalMin: number | null
  lastWeight: number
  onUpdate: (id: string, draft: Partial<FeedingDraft>) => Promise<unknown>
  onDelete: (id: string) => Promise<unknown>
}

export function FeedingListItem({
  feeding,
  intervalMin,
  lastWeight,
  onUpdate,
  onDelete,
}: FeedingListItemProps) {
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    setIsDeleting(true)
    try {
      await onDelete(feeding.id)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
          <span>
            {formatDay(feeding.start)} {formatTime(feeding.start)}–{formatTime(feeding.end)}
          </span>
          <span className="text-muted-foreground">·</span>
          <span>angelegt {feeding.latch_minutes} Min</span>
          {intervalMin != null && (
            <>
              <span className="text-muted-foreground">·</span>
              <span className="font-normal text-muted-foreground">
                Abstand {formatHoursMinutes(intervalMin)}
              </span>
            </>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className="gap-1">
            {feeding.is_manual ? <Pencil className="size-3" /> : <Clock className="size-3" />}
            {feeding.is_manual ? 'manuell' : 'Timer'}
          </Badge>
          <Badge variant="outline">{feeding.woke_self ? 'selbst aufgewacht' : 'geweckt'}</Badge>
          {feeding.supplement_mm_ml > 0 && (
            <Badge variant="outline">MM {formatMl(feeding.supplement_mm_ml)}</Badge>
          )}
          {feeding.supplement_em_ml > 0 && (
            <Badge variant="outline">EM {formatMl(feeding.supplement_em_ml)}</Badge>
          )}
          {feeding.urine && <Badge variant="outline">Urin</Badge>}
          {feeding.stool && <Badge variant="outline">Stuhl</Badge>}
          {feeding.weight_g > 0 && <Badge variant="outline">{formatGrams(feeding.weight_g)}</Badge>}
        </div>
        {feeding.note && <p className="truncate text-sm text-muted-foreground">{feeding.note}</p>}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <FeedingForm
          mode="edit"
          feeding={feeding}
          lastWeight={lastWeight}
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          onSubmit={(draft) => onUpdate(feeding.id, draft)}
          trigger={
            <Button variant="ghost" size="icon" aria-label="Mahlzeit bearbeiten">
              <Pencil className="size-4" />
            </Button>
          }
        />

        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button variant="ghost" size="icon" aria-label="Mahlzeit löschen">
                <Trash2 className="size-4" />
              </Button>
            }
          />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Mahlzeit löschen?</AlertDialogTitle>
              <AlertDialogDescription>
                Der Eintrag vom {formatDay(feeding.start)} um {formatTime(feeding.start)} wird
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
