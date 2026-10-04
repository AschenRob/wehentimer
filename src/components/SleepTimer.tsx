import { useMemo, useRef } from 'react'
import { Check, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useElapsedSeconds } from '@/hooks/useElapsedSeconds'
import { isIsoStringOrNull, usePersistentState } from '@/hooks/usePersistentState'
import { formatDurationClock } from '@/lib/format'
import { SleepForm, type SleepTimerRange } from '@/components/SleepForm'
import type { SleepDraft } from '@/types/sleep'

type MarkKey = 'relax' | 'deep' | 'rem'
type Marks = Partial<Record<MarkKey, string>>

const MARK_LABELS: Record<MarkKey, string> = {
  relax: 'Völlig entspannt',
  deep: 'Tiefschlaf (Armtest)',
  rem: 'REM-Beginn (Regung)',
}
const MARK_KEYS = Object.keys(MARK_LABELS) as MarkKey[]

function isMarks(value: unknown): value is Marks {
  if (typeof value !== 'object' || value === null) return false
  return MARK_KEYS.every((key) => {
    const v = (value as Record<string, unknown>)[key]
    return v === undefined || (typeof v === 'string' && !Number.isNaN(Date.parse(v)))
  })
}

function isPendingRange(value: unknown): value is SleepTimerRange | null {
  if (value === null) return true
  if (typeof value !== 'object') return false
  const { start, end } = value as Record<string, unknown>
  return typeof start === 'string' && typeof end === 'string'
}

/** Minuten zwischen Start und Zeitstempel; mindestens 1, damit "0 = keine Angabe" nicht greift. */
function minutesSince(startIso: string, markIso: string | undefined): number | undefined {
  if (!markIso) return undefined
  const diff = (new Date(markIso).getTime() - new Date(startIso).getTime()) / 60_000
  return Math.max(1, Math.round(diff))
}

interface SleepTimerProps {
  babyId: string
  onSave: (draft: SleepDraft) => Promise<unknown>
}

/**
 * Start = Augen zu, Stop = aufgewacht. Währenddessen lassen sich Entspannung, Tiefschlaf und
 * REM-Beginn per Tipp festhalten; nach Stop ergänzt der Dialog den Rest, gespeichert wird erst dort.
 */
export function SleepTimer({ babyId, onSave }: SleepTimerProps) {
  const [startedAtIso, setStartedAtIso] = usePersistentState<string | null>(
    `sleepTimerStart.${babyId}`,
    null,
    isIsoStringOrNull,
  )
  const [marks, setMarks] = usePersistentState<Marks>(`sleepTimerMarks.${babyId}`, {}, isMarks)
  const [pending, setPending] = usePersistentState<SleepTimerRange | null>(
    `sleepPendingStop.${babyId}`,
    null,
    isPendingRange,
  )
  const startedAt = useMemo(() => (startedAtIso ? new Date(startedAtIso) : null), [startedAtIso])
  const elapsed = useElapsedSeconds(startedAt)
  const isBusyRef = useRef(false)
  const isRunning = startedAt !== null

  function handleClick() {
    // Schützt gegen doppelt ausgelöste Taps im selben Tick.
    if (isBusyRef.current) return
    isBusyRef.current = true
    if (startedAtIso) {
      setPending({
        start: startedAtIso,
        end: new Date().toISOString(),
        relax_minutes: minutesSince(startedAtIso, marks.relax),
        deep_minutes: minutesSince(startedAtIso, marks.deep),
        rem_minutes: minutesSince(startedAtIso, marks.rem),
      })
      setStartedAtIso(null)
      setMarks({})
    } else {
      setStartedAtIso(new Date().toISOString())
      setMarks({})
    }
    setTimeout(() => {
      isBusyRef.current = false
    }, 300)
  }

  function toggleMark(key: MarkKey) {
    const next = { ...marks }
    if (next[key]) delete next[key]
    else next[key] = new Date().toISOString()
    setMarks(next)
  }

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={isRunning}
        className={cn(
          'relative flex h-40 w-40 flex-col items-center justify-center gap-1 rounded-full text-lg font-semibold shadow-lg transition-transform active:scale-95 sm:h-44 sm:w-44',
          isRunning ? 'bg-sky-600 text-white' : 'bg-primary text-primary-foreground',
        )}
      >
        {isRunning && <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-sky-500/40" />}
        {isRunning ? (
          <>
            <Sun className="size-8" />
            <span className="font-mono text-2xl tabular-nums">{formatDurationClock(elapsed)}</span>
            <span className="text-sm font-normal opacity-90">Aufgewacht</span>
          </>
        ) : (
          <>
            <Moon className="size-10" />
            <span>Augen zu</span>
          </>
        )}
      </button>
      <p className="text-center text-sm text-muted-foreground">
        {isRunning
          ? 'Schlaf läuft – halte unten Beobachtungen fest, Aufgewacht beendet den Schlaf.'
          : 'Baby schläft ein? Drück „Augen zu“.'}
      </p>

      {isRunning && startedAtIso && (
        <div className="grid w-full gap-1.5">
          {MARK_KEYS.map((key) => {
            const minutes = minutesSince(startedAtIso, marks[key])
            return (
              <Button
                key={key}
                type="button"
                variant={marks[key] ? 'default' : 'outline'}
                className="justify-between"
                onClick={() => toggleMark(key)}
              >
                <span>{MARK_LABELS[key]}</span>
                {marks[key] ? (
                  <span className="flex items-center gap-1">
                    <Check className="size-4" /> nach {minutes} Min
                  </span>
                ) : (
                  <span className="text-xs font-normal text-muted-foreground">jetzt festhalten</span>
                )}
              </Button>
            )
          })}
        </div>
      )}

      <SleepForm
        mode="complete"
        timerRange={pending ?? undefined}
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open) setPending(null)
        }}
        onSubmit={onSave}
      />
    </div>
  )
}
