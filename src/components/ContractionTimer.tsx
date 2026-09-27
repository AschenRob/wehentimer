import { useMemo, useRef, useState } from 'react'
import { Play, Square } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useElapsedSeconds } from '@/hooks/useElapsedSeconds'
import { isIsoStringOrNull, usePersistentState } from '@/hooks/usePersistentState'
import { formatDurationClock } from '@/lib/format'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import type { Contraction, ContractionDraft } from '@/types/contraction'

interface ContractionTimerProps {
  onSave: (draft: ContractionDraft) => Promise<Contraction>
  onUpdateIntensity: (id: string, intensity: number) => Promise<unknown>
}

export function ContractionTimer({ onSave, onUpdateIntensity }: ContractionTimerProps) {
  const [startedAtIso, setStartedAtIso] = usePersistentState<string | null>(
    'contractionTimerStart',
    null,
    isIsoStringOrNull,
  )
  const startedAt = useMemo(() => (startedAtIso ? new Date(startedAtIso) : null), [startedAtIso])
  const [isSaving, setIsSaving] = useState(false)
  const [intensityPromptFor, setIntensityPromptFor] = useState<Contraction | null>(null)
  const [intensityValue, setIntensityValue] = useState(3)
  const isBusyRef = useRef(false)
  const elapsed = useElapsedSeconds(startedAt)
  const isRunning = startedAt !== null

  async function handleClick() {
    // Schützt gegen doppelt ausgelöste Klicks/Taps im selben Tick (z.B. schnelles
    // Doppeltippen auf dem Handy), bevor React den "isSaving"-State nachzieht.
    if (isBusyRef.current) return
    if (!startedAt) {
      setStartedAtIso(new Date().toISOString())
      return
    }
    isBusyRef.current = true
    const start = startedAt
    const end = new Date()
    const durationSec = Math.max(1, Math.round((end.getTime() - start.getTime()) / 1000))
    setStartedAtIso(null)
    setIsSaving(true)
    try {
      const record = await onSave({
        start: start.toISOString(),
        end: end.toISOString(),
        duration_sec: durationSec,
        is_manual: false,
      })
      setIntensityValue(3)
      setIntensityPromptFor(record)
    } finally {
      setIsSaving(false)
      isBusyRef.current = false
    }
  }

  async function handleSaveIntensity() {
    if (!intensityPromptFor) return
    try {
      await onUpdateIntensity(intensityPromptFor.id, intensityValue)
    } finally {
      setIntensityPromptFor(null)
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <button
        type="button"
        onClick={handleClick}
        disabled={isSaving}
        aria-pressed={isRunning}
        className={cn(
          'relative flex h-40 w-40 flex-col items-center justify-center gap-1 rounded-full text-lg font-semibold shadow-lg transition-transform active:scale-95 disabled:opacity-70 sm:h-44 sm:w-44',
          isRunning ? 'bg-destructive text-white' : 'bg-primary text-primary-foreground',
        )}
      >
        {isRunning && (
          <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-destructive/40" />
        )}
        {isRunning ? (
          <>
            <Square className="size-8" />
            <span className="font-mono text-2xl tabular-nums">{formatDurationClock(elapsed)}</span>
            <span className="text-sm font-normal opacity-90">Stop</span>
          </>
        ) : (
          <>
            <Play className="size-10" />
            <span>Start</span>
          </>
        )}
      </button>
      <p className="text-center text-sm text-muted-foreground">
        {isRunning
          ? 'Wehe läuft – Stop drücken, sobald sie vorbei ist.'
          : 'Wehe beginnt jetzt? Drück Start.'}
      </p>

      <Dialog
        open={intensityPromptFor !== null}
        onOpenChange={(open) => {
          if (!open) setIntensityPromptFor(null)
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Wie stark war die Wehe?</DialogTitle>
            <DialogDescription>Optional – kann auch übersprungen werden.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <span className="text-sm font-medium">Intensität ({intensityValue}/5)</span>
            <Slider
              value={[intensityValue]}
              min={1}
              max={5}
              step={1}
              onValueChange={(v) => setIntensityValue(Array.isArray(v) ? v[0] : v)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIntensityPromptFor(null)}>
              Überspringen
            </Button>
            <Button type="button" onClick={handleSaveIntensity}>
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

