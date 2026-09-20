import { useState } from 'react'
import { Play, Square } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useElapsedSeconds } from '@/hooks/useElapsedSeconds'
import { formatDurationClock } from '@/lib/format'
import type { ContractionDraft } from '@/types/contraction'

interface ContractionTimerProps {
  onSave: (draft: ContractionDraft) => Promise<unknown>
}

export function ContractionTimer({ onSave }: ContractionTimerProps) {
  const [startedAt, setStartedAt] = useState<Date | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const elapsed = useElapsedSeconds(startedAt)
  const isRunning = startedAt !== null

  async function handleClick() {
    if (!isRunning) {
      setStartedAt(new Date())
      return
    }
    const start = startedAt
    const end = new Date()
    const durationSec = Math.max(1, Math.round((end.getTime() - start.getTime()) / 1000))
    setStartedAt(null)
    setIsSaving(true)
    try {
      await onSave({
        start: start.toISOString(),
        end: end.toISOString(),
        duration_sec: durationSec,
        is_manual: false,
      })
    } finally {
      setIsSaving(false)
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
    </div>
  )
}
