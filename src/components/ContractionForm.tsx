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
import { Slider } from '@/components/ui/slider'
import type { Contraction, ContractionDraft } from '@/types/contraction'

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

function toDatetimeLocal(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
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

  const [startValue, setStartValue] = useState('')
  const [minutes, setMinutes] = useState(1)
  const [seconds, setSeconds] = useState(0)
  const [intensity, setIntensity] = useState<number | undefined>(undefined)
  const [note, setNote] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    if (contraction) {
      setStartValue(toDatetimeLocal(new Date(contraction.start)))
      setMinutes(Math.floor(contraction.duration_sec / 60))
      setSeconds(contraction.duration_sec % 60)
      setIntensity(contraction.intensity)
      setNote(contraction.note ?? '')
    } else {
      setStartValue(toDatetimeLocal(new Date()))
      setMinutes(1)
      setSeconds(0)
      setIntensity(undefined)
      setNote('')
    }
    setError(null)
  }, [open, contraction])

  const durationSec = minutes * 60 + seconds
  const start = startValue ? new Date(startValue) : null
  const end = start ? new Date(start.getTime() + durationSec * 1000) : null
  const endValue = end ? toDatetimeLocal(end) : ''

  function handleEndChange(value: string) {
    if (!start || !value) return
    const newEnd = new Date(value)
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
            <Label htmlFor="contraction-start">Startzeitpunkt</Label>
            <Input
              id="contraction-start"
              type="datetime-local"
              step={1}
              value={startValue}
              onChange={(e) => setStartValue(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
                  className="w-16"
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
                  className="w-16"
                />
                <span className="text-sm text-muted-foreground">Sek</span>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contraction-end">Endzeitpunkt</Label>
              <Input
                id="contraction-end"
                type="datetime-local"
                step={1}
                value={endValue}
                onChange={(e) => handleEndChange(e.target.value)}
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
