import { useMemo, useRef } from 'react'
import { Play, Square } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useElapsedSeconds } from '@/hooks/useElapsedSeconds'
import { useNow } from '@/hooks/useNow'
import { isIsoStringOrNull, usePersistentState } from '@/hooks/usePersistentState'
import { formatClockHM, formatDurationClock } from '@/lib/format'
import { FeedingForm } from '@/components/FeedingForm'
import type { FeedingDraft } from '@/types/feeding'

interface PendingRange {
  start: string
  end: string
}

function isPendingRange(value: unknown): value is PendingRange | null {
  if (value === null) return true
  if (typeof value !== 'object') return false
  const { start, end } = value as Record<string, unknown>
  return typeof start === 'string' && typeof end === 'string'
}

interface FeedingTimerProps {
  babyId: string
  lastWeight: number
  /** Ende der letzten Mahlzeit (ISO) für "Zeit seit der letzten Mahlzeit". */
  lastEnd: string | null
  onSave: (draft: FeedingDraft) => Promise<unknown>
}

/** Start/Stop für eine Mahlzeit; nach Stop wird der Eintrag im Dialog ergänzt und erst dann gespeichert. */
export function FeedingTimer({ babyId, lastWeight, lastEnd, onSave }: FeedingTimerProps) {
  const now = useNow(10_000)
  const [startedAtIso, setStartedAtIso] = usePersistentState<string | null>(
    `feedingTimerStart.${babyId}`,
    null,
    isIsoStringOrNull,
  )
  // Auch der gestoppte, noch nicht gespeicherte Eintrag überlebt ein Schließen der App.
  const [pending, setPending] = usePersistentState<PendingRange | null>(
    `feedingPendingStop.${babyId}`,
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
      setPending({ start: startedAtIso, end: new Date().toISOString() })
      setStartedAtIso(null)
    } else {
      setStartedAtIso(new Date().toISOString())
    }
    setTimeout(() => {
      isBusyRef.current = false
    }, 300)
  }

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={isRunning}
        className={cn(
          'relative flex h-40 w-40 flex-col items-center justify-center gap-1 rounded-full text-lg font-semibold shadow-lg transition-transform active:scale-95 sm:h-44 sm:w-44',
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
      {lastEnd && (
        <p className="text-sm">
          Zeit seit der letzten Mahlzeit:{' '}
          <span className="font-semibold tabular-nums">
            {formatClockHM((now.getTime() - new Date(lastEnd).getTime()) / 60_000)}
          </span>
        </p>
      )}
      <p className="text-center text-sm text-muted-foreground">
        {isRunning
          ? 'Mahlzeit läuft – Stop drücken, sobald sie vorbei ist.'
          : 'Neue Mahlzeit? Drück Start.'}
      </p>

      <FeedingForm
        mode="complete"
        timerRange={pending ?? undefined}
        lastWeight={lastWeight}
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open) setPending(null)
        }}
        onSubmit={onSave}
      />
    </div>
  )
}
