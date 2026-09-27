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
import { Separator } from '@/components/ui/separator'
import { APP_VIEW_META, APP_VIEW_OPTIONS, type AppView } from '@/lib/appView'
import { DEFAULT_THRESHOLDS, type ThresholdPatch, type WehenSettings } from '@/types/settings'

// Markiert den kompletten Feldinhalt beim Fokussieren, damit Tippen die
// vorhandene "0" ersetzt statt "07" entstehen zu lassen.
function selectAllOnFocus(e: FocusEvent<HTMLInputElement>) {
  e.target.select()
}

interface SettingsDialogProps {
  view: AppView
  onViewChange: (view: AppView) => void
  settings: WehenSettings
  onSave: (patch: ThresholdPatch) => Promise<unknown>
}

export function SettingsDialog({ view, onViewChange, settings, onSave }: SettingsDialogProps) {
  const [open, setOpen] = useState(false)
  const [intervalMinutes, setIntervalMinutes] = useState(settings.interval_minutes)
  // Mindestdauer wird dem Menschen in Sekunden angezeigt/eingegeben, aber wie
  // gehabt als Minuten in der `settings`-Collection gespeichert (kein
  // Migrations-/Schema-Wechsel nötig).
  const [durationSeconds, setDurationSeconds] = useState(Math.round(settings.duration_minutes * 60))
  const [sustainedMinutes, setSustainedMinutes] = useState(settings.sustained_minutes)
  const [toleranceCount, setToleranceCount] = useState(settings.tolerance_count)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setIntervalMinutes(settings.interval_minutes)
    setDurationSeconds(Math.round(settings.duration_minutes * 60))
    setSustainedMinutes(settings.sustained_minutes)
    setToleranceCount(settings.tolerance_count)
  }, [open, settings])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setIsSaving(true)
    try {
      await onSave({
        interval_minutes: intervalMinutes,
        duration_minutes: durationSeconds / 60,
        sustained_minutes: sustainedMinutes,
        tolerance_count: toleranceCount,
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
    setToleranceCount(DEFAULT_THRESHOLDS.tolerance_count)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Einstellungen">
            <Settings className="size-5" />
          </Button>
        }
      />
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Einstellungen</DialogTitle>
          <DialogDescription>Die Ansicht gilt nur für dieses Gerät.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label>Ansicht</Label>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Ansicht">
            {APP_VIEW_OPTIONS.map((option) => (
              <Button
                key={option}
                type="button"
                role="radio"
                aria-checked={view === option}
                variant={view === option ? 'default' : 'outline'}
                onClick={() => onViewChange(option)}
              >
                {APP_VIEW_META[option].title}
              </Button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" hidden={view !== 'wehen'}>
          <Separator />
          <div>
            <h3 className="font-heading text-sm font-medium">5-1-1-Regel</h3>
            <p className="text-sm text-muted-foreground">
              Gilt geräteübergreifend für alle, die diese Seite gerade geöffnet haben.
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="interval-minutes">Abstand höchstens alle (Minuten)</Label>
            <Input
              id="interval-minutes"
              type="number"
              min={1}
              step="any"
              inputMode="decimal"
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
              // Server erlaubt duration_minutes >= 0.1 (= 6 Sek).
              min={6}
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
              step={1}
              value={sustainedMinutes}
              onChange={(e) => setSustainedMinutes(Number(e.target.value))}
              onFocus={selectAllOnFocus}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tolerance-count">Toleranz (Ausreißer-Wehen pro Serie)</Label>
            <Input
              id="tolerance-count"
              type="number"
              min={0}
              step={1}
              value={toleranceCount}
              onChange={(e) => setToleranceCount(Math.max(0, Math.floor(Number(e.target.value))))}
              onFocus={selectAllOnFocus}
              required
            />
            <p className="text-xs text-muted-foreground">
              So viele Wehen dürfen zu kurz sein oder zu spät kommen, ohne die Serie abzubrechen.
            </p>
          </div>

          <Button type="button" variant="outline" size="sm" onClick={resetToDefaults} className="gap-1.5">
            <RotateCcw className="size-3.5" /> Standard (5 Min / 60 Sek / 60 Min / Toleranz 1)
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
