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
import { parseDateAndTime, selectAllOnFocus, toDateValue, toTimeValue } from '@/lib/dateInput'
import {
  AFTER_REM_LABELS,
  SLEEP_METHOD_LABELS,
  SLEEP_METHOD_OPTIONS,
  type AfterRem,
  type Sleep,
  type SleepDraft,
  type SleepMethod,
} from '@/types/sleep'

const DEFAULT_MANUAL_MINUTES = 45
const AFTER_REM_OPTIONS = ['woke', 'next_cycle'] as const satisfies AfterRem[]

function toNonNegative(value: string): number {
  const n = Number(value)
  return Number.isFinite(n) ? Math.max(0, n) : 0
}

interface ChoiceFieldProps<T extends string> {
  label: string
  value: T | ''
  options: readonly T[]
  labels: Record<T, string>
  onChange: (value: T | '') => void
}

/** Optionale Auswahl: erneutes Antippen der gewählten Option nimmt sie wieder zurück. */
function ChoiceField<T extends string>({ label, value, options, labels, onChange }: ChoiceFieldProps<T>) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={label}>
        {options.map((option) => (
          <Button
            key={option}
            type="button"
            size="sm"
            role="radio"
            aria-checked={value === option}
            variant={value === option ? 'default' : 'outline'}
            onClick={() => onChange(value === option ? '' : option)}
          >
            {labels[option]}
          </Button>
        ))}
      </div>
    </div>
  )
}

interface MinutesFieldProps {
  id: string
  label: string
  hint: string
  value: number
  onChange: (value: number) => void
}

function MinutesField({ id, label, hint, value, onChange }: MinutesFieldProps) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        min={0}
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(Math.round(toNonNegative(e.target.value)))}
        onFocus={selectAllOnFocus}
        className="w-24"
      />
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  )
}

export interface SleepTimerRange {
  start: string
  end: string
  relax_minutes?: number
  deep_minutes?: number
  rem_minutes?: number
}

interface SleepFormProps {
  /** `complete` = Ergänzen direkt nach dem Timer-Stop (Eintrag existiert noch nicht). */
  mode: 'create' | 'edit' | 'complete'
  sleep?: Sleep
  timerRange?: SleepTimerRange
  onSubmit: (draft: SleepDraft) => Promise<unknown>
  trigger?: ReactElement
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const TITLES: Record<SleepFormProps['mode'], string> = {
  create: 'Schlaf nachtragen',
  edit: 'Schlaf bearbeiten',
  complete: 'Schlaf speichern',
}

export function SleepForm({
  mode,
  sleep,
  timerRange,
  onSubmit,
  trigger,
  open: openProp,
  onOpenChange,
}: SleepFormProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = openProp ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen

  const [startDateStr, setStartDateStr] = useState('')
  const [startTimeStr, setStartTimeStr] = useState('')
  const [durationSec, setDurationSec] = useState(0)
  const [relaxMin, setRelaxMin] = useState(0)
  const [deepMin, setDeepMin] = useState(0)
  const [remMin, setRemMin] = useState(0)
  const [afterRem, setAfterRem] = useState<AfterRem | ''>('')
  const [method, setMethod] = useState<SleepMethod | ''>('')
  const [note, setNote] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isConfirmDiscardOpen, setIsConfirmDiscardOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    if (sleep) {
      const start = new Date(sleep.start)
      setStartDateStr(toDateValue(start))
      setStartTimeStr(toTimeValue(start))
      setDurationSec(
        Math.max(0, Math.round((new Date(sleep.end).getTime() - start.getTime()) / 1000)),
      )
      setRelaxMin(sleep.relax_minutes)
      setDeepMin(sleep.deep_minutes)
      setRemMin(sleep.rem_minutes)
      setAfterRem(sleep.after_rem)
      setMethod(sleep.method)
      setNote(sleep.note ?? '')
    } else {
      const end = timerRange ? new Date(timerRange.end) : new Date()
      const start = timerRange
        ? new Date(timerRange.start)
        : new Date(end.getTime() - DEFAULT_MANUAL_MINUTES * 60_000)
      setStartDateStr(toDateValue(start))
      setStartTimeStr(toTimeValue(start))
      setDurationSec(Math.max(0, Math.round((end.getTime() - start.getTime()) / 1000)))
      setRelaxMin(timerRange?.relax_minutes ?? 0)
      setDeepMin(timerRange?.deep_minutes ?? 0)
      setRemMin(timerRange?.rem_minutes ?? 0)
      setAfterRem('')
      setMethod('')
      setNote('')
    }
    setError(null)
  }, [open, sleep, timerRange])

  const start = parseDateAndTime(startDateStr, startTimeStr)
  const end = start ? new Date(start.getTime() + durationSec * 1000) : null
  const endDateStr = end ? toDateValue(end) : ''
  const endTimeStr = end ? toTimeValue(end) : ''
  const durationMinutes = Math.round(durationSec / 60)

  function applyEnd(newEnd: Date | null) {
    if (!start || !newEnd) return
    const diffSec = Math.round((newEnd.getTime() - start.getTime()) / 1000)
    if (diffSec < 0) {
      setError('Das Ende muss nach dem Einschlafen liegen.')
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
        relax_minutes: relaxMin,
        deep_minutes: deepMin,
        rem_minutes: remMin,
        after_rem: afterRem,
        method,
        note: note.trim() || undefined,
        is_manual: mode === 'edit' ? (sleep?.is_manual ?? true) : mode === 'create',
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
              ? 'Augen zu und Aufwachen kommen vom Timer – ergänze die Beobachtungen und speichere.'
              : 'Änderst du die Dauer oder das Ende, wird das jeweils andere automatisch berechnet.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="sleep-start-date">Augen zu (Start)</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                id="sleep-start-date"
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
            <Label htmlFor="sleep-duration">Schlafdauer (Minuten)</Label>
            <Input
              id="sleep-duration"
              type="number"
              min={0}
              inputMode="numeric"
              value={durationMinutes}
              onChange={(e) => setDurationSec(Math.round(toNonNegative(e.target.value)) * 60)}
              onFocus={selectAllOnFocus}
              className="w-24"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="sleep-end-date">Ende des Schlafs</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                id="sleep-end-date"
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

          <div className="grid gap-3 rounded-lg border p-3">
            <div>
              <h3 className="text-sm font-medium">Schlafzyklus (optional)</h3>
              <p className="text-xs text-muted-foreground">
                Minuten ab „Augen zu“. 0 = keine Angabe.
              </p>
            </div>
            <MinutesField
              id="sleep-relax"
              label="Völlig entspannt nach (Min)"
              hint="Wann wirkt das Baby völlig entspannt?"
              value={relaxMin}
              onChange={setRelaxMin}
            />
            <MinutesField
              id="sleep-deep"
              label="Tiefschlaf nach (Min)"
              hint="Armtest: Fällt der Arm vollkommen schlaff, schläft das Baby tief."
              value={deepMin}
              onChange={setDeepMin}
            />
            <MinutesField
              id="sleep-rem"
              label="REM-Beginn nach (Min)"
              hint="Sobald sich das Baby regt, ist der Tiefschlaf vorbei."
              value={remMin}
              onChange={setRemMin}
            />
            <ChoiceField
              label="Nach der REM-Phase"
              value={afterRem}
              options={AFTER_REM_OPTIONS}
              labels={AFTER_REM_LABELS}
              onChange={setAfterRem}
            />
          </div>

          <ChoiceField
            label="Einschlafart (optional)"
            value={method}
            options={SLEEP_METHOD_OPTIONS}
            labels={SLEEP_METHOD_LABELS}
            onChange={setMethod}
          />

          <div className="grid gap-2">
            <Label htmlFor="sleep-note">Notiz (optional)</Label>
            <Textarea
              id="sleep-note"
              value={note}
              maxLength={500}
              onChange={(e) => setNote(e.target.value)}
              placeholder="z.B. unruhig, Zahnen ..."
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
              <AlertDialogTitle>Schlaf verwerfen?</AlertDialogTitle>
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
