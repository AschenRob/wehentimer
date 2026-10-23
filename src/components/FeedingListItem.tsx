import { useState } from 'react'
import { Milk, Pencil, Ruler, Trash2 } from 'lucide-react'
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
import { MeasurementForm } from '@/components/MeasurementForm'
import {
  formatCm,
  formatDay,
  formatGrams,
  formatHoursMinutes,
  formatMl,
  formatTime,
} from '@/lib/format'
import {
  BREAST_LABELS,
  breastUsage,
  isMeal,
  lastBreast,
  type Feeding,
  type FeedingDraft,
} from '@/types/feeding'

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

interface FeedingListItemProps {
  feeding: Feeding
  intervalMin: number | null
  lastWeight: number
  lastHeight: number
  onUpdate: (id: string, draft: Partial<FeedingDraft>) => Promise<unknown>
  onDelete: (id: string) => Promise<unknown>
}

export function FeedingListItem({
  feeding,
  intervalMin,
  lastWeight,
  lastHeight,
  onUpdate,
  onDelete,
}: FeedingListItemProps) {
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const meal = isMeal(feeding)
  const breast = lastBreast(feeding)
  const usage = breastUsage(feeding)
  const breastLabel =
    usage === 'both' && breast
      ? `Brust: Beide, zuletzt ${capitalize(BREAST_LABELS[breast])}`
      : usage && usage !== 'both'
        ? `Brust: ${capitalize(BREAST_LABELS[usage])}`
        : null
  async function handleDelete() {
    setIsDeleting(true)
    try {
      await onDelete(feeding.id)
    } finally {
      setIsDeleting(false)
    }
  }

  const editTrigger = (
    <Button variant="ghost" size="icon" aria-label="Eintrag bearbeiten">
      <Pencil className="size-4" />
    </Button>
  )

  return (
    <li className="flex items-start justify-between gap-3 rounded-lg border bg-card p-3">
      <div className="flex min-w-0 flex-col gap-1">
        {meal ? (
          <>
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
              {breastLabel && <Badge variant="outline">{breastLabel}</Badge>}
              {feeding.supplement_mm_ml > 0 && (
                <Badge variant="outline">MM {formatMl(feeding.supplement_mm_ml)}</Badge>
              )}
              {feeding.supplement_em_ml > 0 && (
                <Badge variant="outline">EM {formatMl(feeding.supplement_em_ml)}</Badge>
              )}
              {feeding.urine && (
                <Badge style={{ backgroundColor: 'var(--urine)', color: '#33362c' }}>Pipi</Badge>
              )}
              {feeding.stool && (
                <Badge style={{ backgroundColor: 'var(--stool)', color: '#fff' }}>Kaka</Badge>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="text-sm font-medium">
              {formatDay(feeding.start)} {formatTime(feeding.start)}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {feeding.height_cm > 0 && (
                <Badge variant="outline">Größe {formatCm(feeding.height_cm)}</Badge>
              )}
              {feeding.weight_g > 0 && (
                <Badge variant="outline">Gewicht {formatGrams(feeding.weight_g)}</Badge>
              )}
            </div>
          </>
        )}
        {feeding.note && <p className="truncate text-sm text-muted-foreground">{feeding.note}</p>}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <span
          className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary"
          title={meal ? 'Mahlzeit' : 'Größe / Gewicht'}
        >
          {meal ? (
            <Milk className="size-4" aria-label="Mahlzeit" />
          ) : (
            <Ruler className="size-4" aria-label="Größe / Gewicht" />
          )}
        </span>
        <div className="flex items-center gap-1 sm:gap-2">
          {meal ? (
            <FeedingForm
              mode="edit"
              feeding={feeding}
              lastWeight={lastWeight}
              lastHeight={lastHeight}
              open={isEditOpen}
              onOpenChange={setIsEditOpen}
              onSubmit={(draft) => onUpdate(feeding.id, draft)}
              trigger={editTrigger}
            />
          ) : (
            <MeasurementForm
              mode="edit"
              feeding={feeding}
              lastWeight={lastWeight}
              lastHeight={lastHeight}
              open={isEditOpen}
              onOpenChange={setIsEditOpen}
              onSubmit={(draft) => onUpdate(feeding.id, draft)}
              trigger={editTrigger}
            />
          )}

          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button variant="ghost" size="icon" aria-label="Eintrag löschen">
                  <Trash2 className="size-4" />
                </Button>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {meal ? 'Mahlzeit löschen?' : 'Eintrag löschen?'}
                </AlertDialogTitle>
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
      </div>
    </li>
  )
}
