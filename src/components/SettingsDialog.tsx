import { useEffect, useState, type FormEvent } from 'react'
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

interface SettingsDialogProps {
  settings: WehenSettings
  onSave: (
    patch: Partial<Pick<WehenSettings, 'interval_minutes' | 'duration_minutes' | 'sustained_minutes'>>,
  ) => Promise<unknown>
}

export function SettingsDialog({ settings, onSave }: SettingsDialogProps) {
  const [open, setOpen] = useState(false)
  const [intervalMinutes, setIntervalMinutes] = useState(settings.interval_minutes)
  const [durationMinutes, setDurationMinutes] = useState(settings.duration_minutes)
  const [sustainedMinutes, setSustainedMinutes] = useState(settings.sustained_minutes)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setIntervalMinutes(settings.interval_minutes)
    setDurationMinutes(settings.duration_minutes)
    setSustainedMinutes(settings.sustained_minutes)
  }, [open, settings])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setIsSaving(true)
    try {
      await onSave({
        interval_minutes: intervalMinutes,
        duration_minutes: durationMinutes,
        sustained_minutes: sustainedMinutes,
      })
      setOpen(false)
    } finally {
      setIsSaving(false)
    }
  }

  function resetToDefaults() {
    setIntervalMinutes(DEFAULT_THRESHOLDS.interval_minutes)
    setDurationMinutes(DEFAULT_THRESHOLDS.duration_minutes)
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
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="duration-minutes">Mindestdauer je Wehe (Minuten)</Label>
            <Input
              id="duration-minutes"
              type="number"
              min={0.1}
              step={0.1}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
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
              required
            />
          </div>

          <Button type="button" variant="outline" size="sm" onClick={resetToDefaults} className="gap-1.5">
            <RotateCcw className="size-3.5" /> Standard (5 / 1 / 60)
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
