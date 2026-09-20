import { useMemo } from 'react'
import { formatTime } from '@/lib/format'
import type { Contraction } from '@/types/contraction'

interface TimelineChartProps {
  contractions: Contraction[]
  now: Date
  streakIds?: Set<string>
}

const HOUR_MS = 3_600_000

/** Rasterabstand in Stunden, abhängig von der Zeitspanne (sonst zu viele/zu wenige Linien). */
function pickHourStep(spanMs: number): number {
  const spanHours = spanMs / HOUR_MS
  if (spanHours <= 6) return 1
  if (spanHours <= 12) return 2
  if (spanHours <= 24) return 3
  if (spanHours <= 72) return 6
  return 12
}

/** Volle-Stunden-Ticks innerhalb [domainStart, domainEnd], z.B. jeweils zur vollen Stunde. */
function buildHourTicks(domainStart: number, domainEnd: number): number[] {
  const stepMs = pickHourStep(domainEnd - domainStart) * HOUR_MS
  const first = Math.ceil(domainStart / stepMs) * stepMs
  const ticks: number[] = []
  for (let t = first; t <= domainEnd; t += stepMs) {
    ticks.push(t)
  }
  return ticks
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
  // Fällt keine volle Stunde in den Zeitraum (z.B. sehr kurze Zeitspanne),
  // trotzdem eine Mindest-Legende mit Anfang/Mitte/Ende anzeigen.
  const hourTicks = buildHourTicks(domainStart, domainEnd)
  const ticks =
    hourTicks.length > 0 ? hourTicks : [domainStart, domainStart + span / 2, domainEnd]

  return (
    <div className="flex flex-col gap-3">
      <div className="relative h-16 w-full overflow-hidden rounded-md bg-muted">
        {ticks.map((t) => (
          <div
            key={t}
            className="absolute top-0 h-full w-px bg-foreground/10"
            style={{ left: `${((t - domainStart) / span) * 100}%` }}
          />
        ))}
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
      <div className="relative h-4 text-xs text-muted-foreground">
        {ticks.map((t) => {
          const pct = ((t - domainStart) / span) * 100
          const edge = pct <= 2 ? 'left-0' : pct >= 98 ? 'right-0' : '-translate-x-1/2'
          return (
            <span
              key={t}
              className={`absolute ${edge}`}
              style={edge === '-translate-x-1/2' ? { left: `${pct}%` } : undefined}
            >
              {formatTime(new Date(t))}
            </span>
          )
        })}
      </div>
    </div>
  )
}

