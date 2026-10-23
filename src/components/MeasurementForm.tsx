import { useEffect, useState, type FormEvent, type ReactElement } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { parseDateAndTime, selectAllOnFocus, toDateValue, toTimeValue } from '@/lib/dateInput'
import { FEEDING_DEFAULTS, type Feeding, type FeedingDraft } from '@/types/feeding'

function toNonNegative(value: string): number {
  const n = Number(value.replace(',', '.'))
  return Number.isFinite(n) ? Math.max(0, n) : 0
}

/** 0 = nicht erfasst -> leeres Feld. */
function toFieldValue(value: number | undefined): string {
  return value && value > 0 ? String(value) : ''
}

interface MeasurementFormProps {
  mode: 'create' | 'edit'
  feeding?: Feeding
  lastWeight: number
  lastHeight: number
  onSubmit: (draft: FeedingDraft) => Promise<unknown>
  trigger?: ReactElement
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

/** Reiner Größe/Gewicht-Eintrag ohne Mahlzeit-Felder (Start = Ende = Messzeitpunkt). */
export function MeasurementForm({
  mode,
  feeding,
  lastWeight,
  lastHeight,
  onSubmit,
  trigger,
  open: openProp,
  onOpenChange,
}: MeasurementFormProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = openProp ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen

  const [dateStr, setDateStr] = useState('')
  const [timeStr, setTimeStr] = useState('')
  const [heightStr, setHeightStr] = useState('')
  const [weightStr, setWeightStr] = useState('')
  const [note, setNote] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const at = feeding ? new Date(feeding.start) : new Date()
    setDateStr(toDateValue(at))
    setTimeStr(toTimeValue(at))
    setHeightStr(toFieldValue(feeding ? feeding.height_cm : lastHeight))
    setWeightStr(toFieldValue(feeding ? feeding.weight_g : lastWeight))
    setNote(feeding?.note ?? '')
    setError(null)
  }, [open, feeding, lastWeight, lastHeight])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const at = parseDateAndTime(dateStr, timeStr)
    if (!at) {
      setError('Bitte Datum und Uhrzeit angeben.')
      return
    }
    const heightCm = toNonNegative(heightStr)
    const weightG = toNonNegative(weightStr)
    if (heightCm <= 0 && weightG <= 0) {
      setError('Bitte Größe und/oder Gewicht angeben.')
      return
    }
    setIsSaving(true)
    try {
      await onSubmit({
        ...FEEDING_DEFAULTS,
        kind: 'measurement',
        start: at.toISOString(),
        end: at.toISOString(),
        latch_minutes: 0,
        breast_first: '',
        breast_second: '',
        height_cm: Math.round(heightCm * 10) / 10,
        weight_g: Math.round(weightG),
        note: note.trim() || undefined,
        is_manual: true,
      })
      setOpen(false)
    } catch {
      // Fehler-Toast übernimmt bereits der aufrufende Hook.
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Größe / Gewicht bearbeiten' : 'Größe / Gewicht erfassen'}
          </DialogTitle>
          <DialogDescription>
            Messung ohne Mahlzeit. Trage Größe und/oder Gewicht ein; ein Wert von 0 gilt als nicht
            erfasst.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="measurement-date">Zeitpunkt</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                id="measurement-date"
                type="date"
                aria-label="Datum"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                required
              />
              <Input
                type="time"
                lang="en"
                aria-label="Uhrzeit"
                value={timeStr}
                onChange={(e) => setTimeStr(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="measurement-height">Größe (cm)</Label>
              <Input
                id="measurement-height"
                type="number"
                min={0}
                step={0.1}
                inputMode="decimal"
                value={heightStr}
                onChange={(e) => setHeightStr(e.target.value)}
                onFocus={selectAllOnFocus}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="measurement-weight">Gewicht (g)</Label>
              <Input
                id="measurement-weight"
                type="number"
                min={0}
                inputMode="numeric"
                value={weightStr}
                onChange={(e) => setWeightStr(e.target.value)}
                onFocus={selectAllOnFocus}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="measurement-note">Besonderheiten (optional)</Label>
            <Textarea
              id="measurement-note"
              value={note}
              maxLength={500}
              onChange={(e) => setNote(e.target.value)}
              placeholder="z.B. Kinderarzt, U-Untersuchung ..."
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={isSaving}>
              {mode === 'edit' ? 'Änderungen speichern' : 'Speichern'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
