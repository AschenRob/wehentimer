import { useEffect, useState, type FocusEvent, type FormEvent, type ReactElement } from 'react'
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
import { Slider } from '@/components/ui/slider'
import type { Contraction, ContractionDraft } from '@/types/contraction'

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

// Markiert den kompletten Feldinhalt beim Fokussieren, damit Tippen die
// vorhandene "0" ersetzt statt "07" entstehen zu lassen.
function selectAllOnFocus(e: FocusEvent<HTMLInputElement>) {
  e.target.select()
}

// Getrennte Date-/Time-Inputs statt eines kombinierten datetime-local-Felds:
// Handys zeigen dafür ihre nativen (schnelleren) Kalender-/Uhr-Räder statt
// eines oft klobigen kombinierten Pickers.
function toDateValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function toTimeValue(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function parseDateAndTime(dateStr: string, timeStr: string): Date | null {
  if (!dateStr || !timeStr) return null
  const [year, month, day] = dateStr.split('-').map(Number)
  const [hours, minutes] = timeStr.split(':').map(Number)
  if ([year, month, day, hours, minutes].some((n) => Number.isNaN(n))) return null
  const date = new Date(year, month - 1, day, hours, minutes, 0)
  return Number.isNaN(date.getTime()) ? null : date
}

interface ContractionFormProps {
  mode: 'create' | 'edit'
  contraction?: Contraction
  onSubmit: (draft: ContractionDraft) => Promise<unknown>
  trigger: ReactElement
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ContractionForm({
  mode,
  contraction,
  onSubmit,
  trigger,
  open: openProp,
  onOpenChange,
}: ContractionFormProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = openProp ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen

  const [startDateStr, setStartDateStr] = useState('')
  const [startTimeStr, setStartTimeStr] = useState('')
  const [minutes, setMinutes] = useState(1)
  const [seconds, setSeconds] = useState(0)
  const [intensity, setIntensity] = useState<number | undefined>(undefined)
  const [note, setNote] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    if (contraction) {
      const start = new Date(contraction.start)
      setStartDateStr(toDateValue(start))
      setStartTimeStr(toTimeValue(start))
      setMinutes(Math.floor(contraction.duration_sec / 60))
      setSeconds(contraction.duration_sec % 60)
      setIntensity(contraction.intensity)
      setNote(contraction.note ?? '')
    } else {
      const now = new Date()
      setStartDateStr(toDateValue(now))
      setStartTimeStr(toTimeValue(now))
      setMinutes(1)
      setSeconds(0)
      setIntensity(undefined)
      setNote('')
    }
    setError(null)
  }, [open, contraction])

  const durationSec = minutes * 60 + seconds
  const start = parseDateAndTime(startDateStr, startTimeStr)
  const end = start ? new Date(start.getTime() + durationSec * 1000) : null
  const endDateStr = end ? toDateValue(end) : ''
  const endTimeStr = end ? toTimeValue(end) : ''

  function applyEnd(newEnd: Date | null) {
    if (!start || !newEnd) return
    const diffSec = Math.round((newEnd.getTime() - start.getTime()) / 1000)
    if (diffSec <= 0) {
      setError('Ende muss nach dem Start liegen.')
      return
    }
    setError(null)
    setMinutes(Math.floor(diffSec / 60))
    setSeconds(diffSec % 60)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!start || durationSec <= 0) {
      setError('Bitte Start und Dauer angeben.')
      return
    }
    setIsSaving(true)
    try {
      await onSubmit({
        start: start.toISOString(),
        end: new Date(start.getTime() + durationSec * 1000).toISOString(),
        duration_sec: durationSec,
        is_manual: true,
        intensity,
        note: note.trim() || undefined,
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
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Wehe nachtragen' : 'Wehe bearbeiten'}</DialogTitle>
          <DialogDescription>
            Start und Dauer sind Pflicht – änderst du Dauer oder Ende, wird das jeweils andere
            automatisch berechnet.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="contraction-start-date">Startzeitpunkt</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                id="contraction-start-date"
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
            <Label>Dauer</Label>
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                min={0}
                inputMode="numeric"
                aria-label="Minuten"
                value={minutes}
                onChange={(e) => setMinutes(Math.max(0, Number(e.target.value)))}
                onFocus={selectAllOnFocus}
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">Min</span>
              <Input
                type="number"
                min={0}
                max={59}
                inputMode="numeric"
                aria-label="Sekunden"
                value={seconds}
                onChange={(e) => setSeconds(Math.min(59, Math.max(0, Number(e.target.value))))}
                onFocus={selectAllOnFocus}
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">Sek</span>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="contraction-end-date">Endzeitpunkt</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                id="contraction-end-date"
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

          <div className="grid gap-2">
            <Label>Intensität {intensity ? `(${intensity}/5)` : '(optional)'}</Label>
            <Slider
              value={[intensity ?? 0]}
              min={0}
              max={5}
              step={1}
              onValueChange={(v) => {
                const next = Array.isArray(v) ? v[0] : v
                setIntensity(next === 0 ? undefined : next)
              }}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="contraction-note">Notiz (optional)</Label>
            <Textarea
              id="contraction-note"
              value={note}
              maxLength={500}
              onChange={(e) => setNote(e.target.value)}
              placeholder="z.B. Besonderheiten, Begleitsymptome ..."
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={isSaving}>
              {mode === 'create' ? 'Speichern' : 'Änderungen speichern'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
