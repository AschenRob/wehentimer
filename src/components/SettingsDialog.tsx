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
import { BabySettings } from '@/components/settings/BabySettings'
import { PasscodeSettings } from '@/components/settings/PasscodeSettings'
import {
  APP_LAYOUT_LABELS,
  APP_LAYOUT_OPTIONS,
  type AppLayout,
  type AppView,
} from '@/lib/appView'
import type { Baby, BabyInput } from '@/types/baby'
import { DEFAULT_THRESHOLDS, type SettingsPatch, type WehenSettings } from '@/types/settings'

// Markiert den kompletten Feldinhalt beim Fokussieren, damit Tippen die
// vorhandene "0" ersetzt statt "07" entstehen zu lassen.
function selectAllOnFocus(e: FocusEvent<HTMLInputElement>) {
  e.target.select()
}

interface SettingsDialogProps {
  view: AppView
  layout: AppLayout
  onLayoutChange: (layout: AppLayout) => void
  settings: WehenSettings
  onSave: (patch: SettingsPatch) => Promise<unknown>
  /** Soll-Abstand (Std) für die gestrichelte Linie im Still-Verlauf; 0 = aus. */
  targetIntervalHours: number
  onTargetIntervalHoursChange: (hours: number) => void
  babies: Baby[]
  activeBabyId: string
  onSelectBaby: (id: string) => void
  onCreateBaby: (input: BabyInput) => Promise<unknown>
  onUpdateBaby: (id: string, input: BabyInput) => Promise<unknown>
  onDeleteBaby: (id: string) => Promise<unknown>
  onChangePasscode: (code: string) => Promise<unknown>
  onLock: () => void
}

export function SettingsDialog({
  view,
  layout,
  onLayoutChange,
  settings,
  onSave,
  targetIntervalHours,
  onTargetIntervalHoursChange,
  babies,
  activeBabyId,
  onSelectBaby,
  onCreateBaby,
  onUpdateBaby,
  onDeleteBaby,
  onChangePasscode,
  onLock,
}: SettingsDialogProps) {
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
          <DialogDescription>Das Layout gilt nur für dieses Gerät.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label>Layout</Label>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Layout">
            {APP_LAYOUT_OPTIONS.map((option) => (
              <Button
                key={option}
                type="button"
                role="radio"
                aria-checked={layout === option}
                variant={layout === option ? 'default' : 'outline'}
                onClick={() => onLayoutChange(option)}
              >
                {APP_LAYOUT_LABELS[option]}
              </Button>
            ))}
          </div>
        </div>

        <Separator />
        <BabySettings
          babies={babies}
          activeBabyId={activeBabyId}
          onSelect={onSelectBaby}
          onCreate={onCreateBaby}
          onUpdate={onUpdateBaby}
          onDelete={onDeleteBaby}
        />

        {view === 'still' && (
          <>
            <Separator />
            <div className="grid gap-2">
              <div>
                <h3 className="font-heading text-sm font-medium">Stillen</h3>
                <p className="text-sm text-muted-foreground">Gilt nur für dieses Gerät.</p>
              </div>
              <Label htmlFor="target-interval">Soll-Abstand im Verlauf je Mahlzeit (Stunden)</Label>
              <Input
                id="target-interval"
                type="number"
                min={0}
                step="any"
                inputMode="decimal"
                value={targetIntervalHours}
                onChange={(e) => onTargetIntervalHoursChange(Math.max(0, Number(e.target.value)))}
                onFocus={selectAllOnFocus}
                className="w-32"
              />
              <p className="text-xs text-muted-foreground">
                Gestrichelte Linie im Diagramm „Verlauf je Mahlzeit“ (Abstand). 0 = keine Linie.
              </p>
            </div>
          </>
        )}

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

        <Separator />
        <PasscodeSettings onChange={onChangePasscode} onLock={onLock} />
      </DialogContent>
    </Dialog>
  )
}
