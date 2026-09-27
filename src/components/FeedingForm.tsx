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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { parseDateAndTime, selectAllOnFocus, toDateValue, toTimeValue } from '@/lib/dateInput'
import {
  DEFAULT_SUPPLEMENT_ML,
  DEFAULT_SUPPLEMENT_TYPE,
  FEEDING_DEFAULTS,
  SUPPLEMENT_TYPE_LABELS,
  type Feeding,
  type FeedingDraft,
  type SupplementType,
} from '@/types/feeding'

const DEFAULT_MANUAL_MINUTES = 20

function toNonNegative(value: string): number {
  const n = Number(value)
  return Number.isFinite(n) ? Math.max(0, n) : 0
}

interface YesNoFieldProps {
  label: string
  value: boolean
  onChange: (value: boolean) => void
}

function YesNoField({ label, value, onChange }: YesNoFieldProps) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <div className="grid grid-cols-2 gap-1.5" role="radiogroup" aria-label={label}>
        {[true, false].map((option) => (
          <Button
            key={String(option)}
            type="button"
            size="sm"
            role="radio"
            aria-checked={value === option}
            variant={value === option ? 'default' : 'outline'}
            onClick={() => onChange(option)}
          >
            {option ? 'Ja' : 'Nein'}
          </Button>
        ))}
      </div>
    </div>
  )
}

interface FeedingFormProps {
  /** `complete` = Ergänzen direkt nach dem Timer-Stop (Eintrag existiert noch nicht). */
  mode: 'create' | 'edit' | 'complete'
  feeding?: Feeding
  timerRange?: { start: string; end: string }
  lastWeight: number
  onSubmit: (draft: FeedingDraft) => Promise<unknown>
  trigger?: ReactElement
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const TITLES: Record<FeedingFormProps['mode'], string> = {
  create: 'Mahlzeit nachtragen',
  edit: 'Mahlzeit bearbeiten',
  complete: 'Mahlzeit speichern',
}

export function FeedingForm({
  mode,
  feeding,
  timerRange,
  lastWeight,
  onSubmit,
  trigger,
  open: openProp,
  onOpenChange,
}: FeedingFormProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = openProp ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen

  const [startDateStr, setStartDateStr] = useState('')
  const [startTimeStr, setStartTimeStr] = useState('')
  const [durationSec, setDurationSec] = useState(0)
  const [wokeSelf, setWokeSelf] = useState<boolean>(FEEDING_DEFAULTS.woke_self)
  const [supplementType, setSupplementType] = useState<SupplementType>(DEFAULT_SUPPLEMENT_TYPE)
  const [supplementMl, setSupplementMl] = useState(DEFAULT_SUPPLEMENT_ML)
  const [urine, setUrine] = useState<boolean>(FEEDING_DEFAULTS.urine)
  const [stool, setStool] = useState<boolean>(FEEDING_DEFAULTS.stool)
  const [weightG, setWeightG] = useState(0)
  const [note, setNote] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isConfirmDiscardOpen, setIsConfirmDiscardOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    if (feeding) {
      const start = new Date(feeding.start)
      setStartDateStr(toDateValue(start))
      setStartTimeStr(toTimeValue(start))
      setDurationSec(
        Math.max(0, Math.round((new Date(feeding.end).getTime() - start.getTime()) / 1000)),
      )
      setWokeSelf(feeding.woke_self)
      const isEm = feeding.supplement_em_ml > 0 && feeding.supplement_mm_ml === 0
      setSupplementType(isEm ? 'em' : 'mm')
      setSupplementMl(isEm ? feeding.supplement_em_ml : feeding.supplement_mm_ml)
      setUrine(feeding.urine)
      setStool(feeding.stool)
      setWeightG(feeding.weight_g)
      setNote(feeding.note ?? '')
    } else {
      const end = timerRange ? new Date(timerRange.end) : new Date()
      const start = timerRange
        ? new Date(timerRange.start)
        : new Date(end.getTime() - DEFAULT_MANUAL_MINUTES * 60_000)
      setStartDateStr(toDateValue(start))
      setStartTimeStr(toTimeValue(start))
      setDurationSec(Math.max(0, Math.round((end.getTime() - start.getTime()) / 1000)))
      setWokeSelf(FEEDING_DEFAULTS.woke_self)
      setSupplementType(DEFAULT_SUPPLEMENT_TYPE)
      setSupplementMl(DEFAULT_SUPPLEMENT_ML)
      setUrine(FEEDING_DEFAULTS.urine)
      setStool(FEEDING_DEFAULTS.stool)
      setWeightG(lastWeight)
      setNote('')
    }
    setError(null)
  }, [open, feeding, timerRange, lastWeight])

  const start = parseDateAndTime(startDateStr, startTimeStr)
  const end = start ? new Date(start.getTime() + durationSec * 1000) : null
  const endDateStr = end ? toDateValue(end) : ''
  const endTimeStr = end ? toTimeValue(end) : ''
  const latchMinutes = Math.round(durationSec / 60)

  function applyEnd(newEnd: Date | null) {
    if (!start || !newEnd) return
    const diffSec = Math.round((newEnd.getTime() - start.getTime()) / 1000)
    if (diffSec < 0) {
      setError('Ende der Mahlzeit muss nach dem Start liegen.')
      return
    }
    setError(null)
    setDurationSec(diffSec)
  }

  function handleOpenChange(next: boolean) {
    // Nach dem Timer-Stop existiert der Eintrag nur hier im Dialog -> nicht kommentarlos verwerfen.
    if (!next && mode === 'complete') {
      setIsConfirmDiscardOpen(true)
      return
    }
    setOpen(next)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!start) {
      setError('Bitte den Startzeitpunkt angeben.')
      return
    }
    setIsSaving(true)
    try {
      await onSubmit({
        start: start.toISOString(),
        end: new Date(start.getTime() + durationSec * 1000).toISOString(),
        latch_minutes: latchMinutes,
        woke_self: wokeSelf,
        supplement_mm_ml: supplementType === 'mm' ? supplementMl : 0,
        supplement_em_ml: supplementType === 'em' ? supplementMl : 0,
        urine,
        stool,
        weight_g: weightG,
        note: note.trim() || undefined,
        is_manual: mode === 'edit' ? (feeding?.is_manual ?? true) : mode === 'create',
      })
      setOpen(false)
    } catch {
      // Fehler-Toast übernimmt bereits der aufrufende Hook.
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{TITLES[mode]}</DialogTitle>
          <DialogDescription>
            {mode === 'complete'
              ? 'Start und Ende kommen vom Timer – ergänze die restlichen Angaben und speichere.'
              : 'Änderst du „angelegt“ oder das Ende, wird das jeweils andere automatisch berechnet.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="feeding-start-date">Start</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                id="feeding-start-date"
                type="date"
                aria-label="Startdatum"
                value={startDateStr}
                onChange={(e) => setStartDateStr(e.target.value)}
                required
              />
              <Input
                type="time"
                lang="en"
                aria-label="Startuhrzeit"
                value={startTimeStr}
                onChange={(e) => setStartTimeStr(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="feeding-latch">Angelegt (Minuten)</Label>
            <Input
              id="feeding-latch"
              type="number"
              min={0}
              inputMode="numeric"
              value={latchMinutes}
              onChange={(e) => setDurationSec(Math.round(toNonNegative(e.target.value)) * 60)}
              onFocus={selectAllOnFocus}
              className="w-24"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="feeding-end-date">Ende der Mahlzeit</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                id="feeding-end-date"
                type="date"
                aria-label="Enddatum"
                value={endDateStr}
                onChange={(e) => applyEnd(parseDateAndTime(e.target.value, endTimeStr))}
              />
              <Input
                type="time"
                lang="en"
                aria-label="Enduhrzeit"
                value={endTimeStr}
                onChange={(e) => applyEnd(parseDateAndTime(endDateStr, e.target.value))}
              />
            </div>
          </div>

          <YesNoField label="Von selbst aufgewacht" value={wokeSelf} onChange={setWokeSelf} />

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Zugefüttert</Label>
              <Select
                items={SUPPLEMENT_TYPE_LABELS}
                value={supplementType}
                onValueChange={(next) => next && setSupplementType(next as SupplementType)}
              >
                <SelectTrigger aria-label="Art der Zufütterung" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(SUPPLEMENT_TYPE_LABELS) as SupplementType[]).map((type) => (
                    <SelectItem key={type} value={type}>
                      {SUPPLEMENT_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="feeding-supplement-ml">Menge (ml)</Label>
              <Input
                id="feeding-supplement-ml"
                type="number"
                min={0}
                inputMode="numeric"
                value={supplementMl}
                onChange={(e) => setSupplementMl(toNonNegative(e.target.value))}
                onFocus={selectAllOnFocus}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <YesNoField label="Urin" value={urine} onChange={setUrine} />
            <YesNoField label="Stuhl" value={stool} onChange={setStool} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="feeding-weight">Gewicht (g)</Label>
            <Input
              id="feeding-weight"
              type="number"
              min={0}
              inputMode="numeric"
              value={weightG}
              onChange={(e) => setWeightG(toNonNegative(e.target.value))}
              onFocus={selectAllOnFocus}
              className="w-32"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="feeding-note">Besonderheiten (optional)</Label>
            <Textarea
              id="feeding-note"
              value={note}
              maxLength={500}
              onChange={(e) => setNote(e.target.value)}
              placeholder="z.B. Saugweise, Arznei ..."
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            {mode === 'complete' && (
              <Button type="button" variant="outline" onClick={() => setIsConfirmDiscardOpen(true)}>
                Verwerfen
              </Button>
            )}
            <Button type="submit" disabled={isSaving}>
              {mode === 'edit' ? 'Änderungen speichern' : 'Speichern'}
            </Button>
          </DialogFooter>
        </form>

        <AlertDialog open={isConfirmDiscardOpen} onOpenChange={setIsConfirmDiscardOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Mahlzeit verwerfen?</AlertDialogTitle>
              <AlertDialogDescription>
                Der gesamte Eintrag geht verloren – auch Start und Ende vom Timer werden nicht
                gespeichert.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Zurück</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={() => {
                  setIsConfirmDiscardOpen(false)
                  setOpen(false)
                }}
              >
                Verwerfen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  )
}
