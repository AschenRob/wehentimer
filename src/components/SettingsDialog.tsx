import { useEffect, useState, type FocusEvent, type FormEvent } from 'react'
import { RotateCcw, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DEFAULT_THRESHOLDS, type WehenSettings } from '@/types/settings'

// Markiert den kompletten Feldinhalt beim Fokussieren, damit Tippen die
// vorhandene "0" ersetzt statt "07" entstehen zu lassen.
function selectAllOnFocus(e: FocusEvent<HTMLInputElement>) {
  e.target.select()
}

interface SettingsDialogProps {
  settings: WehenSettings
  onSave: (
    patch: Partial<Pick<WehenSettings, 'interval_minutes' | 'duration_minutes' | 'sustained_minutes'>>,
  ) => Promise<unknown>
}

export function SettingsDialog({ settings, onSave }: SettingsDialogProps) {
  const [open, setOpen] = useState(false)
  const [intervalMinutes, setIntervalMinutes] = useState(settings.interval_minutes)
  // Mindestdauer wird dem Menschen in Sekunden angezeigt/eingegeben, aber wie
  // gehabt als Minuten in der `settings`-Collection gespeichert (kein
  // Migrations-/Schema-Wechsel nötig).
  const [durationSeconds, setDurationSeconds] = useState(Math.round(settings.duration_minutes * 60))
  const [sustainedMinutes, setSustainedMinutes] = useState(settings.sustained_minutes)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setIntervalMinutes(settings.interval_minutes)
    setDurationSeconds(Math.round(settings.duration_minutes * 60))
    setSustainedMinutes(settings.sustained_minutes)
  }, [open, settings])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setIsSaving(true)
    try {
      await onSave({
        interval_minutes: intervalMinutes,
        duration_minutes: durationSeconds / 60,
        sustained_minutes: sustainedMinutes,
      })
      setOpen(false)
    } finally {
      setIsSaving(false)
    }
  }

  function resetToDefaults() {
    setIntervalMinutes(DEFAULT_THRESHOLDS.interval_minutes)
    setDurationSeconds(Math.round(DEFAULT_THRESHOLDS.duration_minutes * 60))
    setSustainedMinutes(DEFAULT_THRESHOLDS.sustained_minutes)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="5-1-1-Schwellenwerte einstellen">
            <Settings className="size-5" />
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>5-1-1-Regel einstellen</DialogTitle>
          <DialogDescription>
            Gilt geräteübergreifend für alle, die diese Seite gerade geöffnet haben.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="interval-minutes">Abstand höchstens alle (Minuten)</Label>
            <Input
              id="interval-minutes"
              type="number"
              min={1}
              step={0.5}
              value={intervalMinutes}
              onChange={(e) => setIntervalMinutes(Number(e.target.value))}
              onFocus={selectAllOnFocus}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="duration-seconds">Mindestdauer je Wehe (Sekunden)</Label>
            <Input
              id="duration-seconds"
              type="number"
              min={1}
              step={1}
              value={durationSeconds}
              onChange={(e) => setDurationSeconds(Number(e.target.value))}
              onFocus={selectAllOnFocus}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sustained-minutes">Muster muss andauern seit (Minuten)</Label>
            <Input
              id="sustained-minutes"
              type="number"
              min={1}
              step={5}
              value={sustainedMinutes}
              onChange={(e) => setSustainedMinutes(Number(e.target.value))}
              onFocus={selectAllOnFocus}
              required
            />
          </div>

          <Button type="button" variant="outline" size="sm" onClick={resetToDefaults} className="gap-1.5">
            <RotateCcw className="size-3.5" /> Standard (5 Min / 60 Sek / 60 Min)
          </Button>

          <DialogFooter>
            <Button type="submit" disabled={isSaving}>
              Speichern
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
