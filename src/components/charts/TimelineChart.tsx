import { useMemo } from 'react'
import { formatTime } from '@/lib/format'
import type { Contraction } from '@/types/contraction'

interface TimelineChartProps {
  contractions: Contraction[]
  now: Date
  streakIds?: Set<string>
}

/**
 * Leichtgewichtige Zeitleiste (kein Recharts nötig): Wehen überlappen sich
 * nie, deshalb reicht eine einzelne Spur mit prozentual positionierten
 * Balken. Balken im aktuell laufenden 5-1-1-Muster werden hervorgehoben.
 */
export function TimelineChart({ contractions, now, streakIds }: TimelineChartProps) {
  const sorted = useMemo(
    () => [...contractions].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()),
    [contractions],
  )

  if (sorted.length === 0) {
    return <p className="text-sm text-muted-foreground">Noch keine Wehen erfasst.</p>
  }

  const domainStart = new Date(sorted[0].start).getTime()
  const nowMs = now.getTime()
  const domainEnd = Math.max(nowMs, new Date(sorted[sorted.length - 1].end).getTime())
  const span = Math.max(domainEnd - domainStart, 60_000)
  const ticks = Array.from({ length: 5 }, (_, i) => domainStart + (span * i) / 4)

  return (
    <div className="flex flex-col gap-1">
      <div className="relative h-16 w-full overflow-hidden rounded-md bg-muted">
        {sorted.map((c) => {
          const start = new Date(c.start).getTime()
          const durationMs = c.duration_sec * 1000
          const leftPct = ((start - domainStart) / span) * 100
          const widthPct = Math.max((durationMs / span) * 100, 0.6)
          const isHighlighted = streakIds?.has(c.id)
          return (
            <div
              key={c.id}
              title={`${formatTime(c.start)} – ${formatTime(c.end)}`}
              className={
                isHighlighted ? 'absolute top-2 h-12 rounded-sm bg-status-critical' : 'absolute top-2 h-12 rounded-sm bg-primary'
              }
              style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
            />
          )
        })}
        <div
          className="absolute top-0 h-full w-px bg-foreground/40"
          style={{ left: `${((nowMs - domainStart) / span) * 100}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        {ticks.map((t) => (
          <span key={t}>{formatTime(new Date(t))}</span>
        ))}
      </div>
    </div>
  )
}
