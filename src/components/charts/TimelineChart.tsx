import { useEffect, useMemo, useState } from 'react'
import { formatShortDate, formatTime } from '@/lib/format'
import { INTENSITY_COLORS, NO_INTENSITY_COLOR, intensityColor } from '@/lib/intensity'
import type { Contraction } from '@/types/contraction'

interface TimelineChartProps {
  contractions: Contraction[]
  now: Date
  streakIds?: Set<string>
}

const HOUR_MS = 3_600_000
const HOUR_STEPS = [1, 2, 3, 4, 6, 12, 24, 48, 72, 168]
/** Mindestabstand zwischen zwei Achsenbeschriftungen in Pixeln ("HH:MM" bzw. "TT.MM."). */
const MIN_LABEL_SPACING_PX = 60
const FALLBACK_WIDTH_PX = 320

function localDayIndex(date: Date): number {
  return Math.round((date.getTime() - date.getTimezoneOffset() * 60_000) / 86_400_000)
}

/**
 * Ticks zu vollen lokalen Stunden, Schrittweite so gewählt, dass bei der
 * verfügbaren Breite höchstens `maxTicks` Beschriftungen entstehen.
 */
function buildHourTicks(domainStart: number, domainEnd: number, maxTicks: number): number[] {
  const spanHours = (domainEnd - domainStart) / HOUR_MS
  const step =
    HOUR_STEPS.find((s) => spanHours / s <= Math.max(1, maxTicks - 1)) ??
    HOUR_STEPS[HOUR_STEPS.length - 1]
  const first = new Date(domainStart)
  first.setMinutes(0, 0, 0)
  const ticks: number[] = []
  // Stundenweise über Epoch-Millisekunden laufen, damit Zeitumstellungen keine Schleife erzeugen.
  for (let t = first.getTime(); t <= domainEnd; t += HOUR_MS) {
    if (t < domainStart) continue
    const d = new Date(t)
    const matches =
      step < 24
        ? d.getHours() % step === 0
        : d.getHours() === 0 && localDayIndex(d) % (step / 24) === 0
    if (matches) ticks.push(t)
  }
  return ticks
}

function formatTick(t: number): string {
  const d = new Date(t)
  return d.getHours() === 0 && d.getMinutes() === 0 ? formatShortDate(d) : formatTime(d)
}

function useElementWidth() {
  const [node, setNode] = useState<HTMLDivElement | null>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    if (!node) return
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(node)
    return () => observer.disconnect()
  }, [node])
  return [setNode, width] as const
}

/**
 * Leichtgewichtige Zeitleiste (kein Recharts nötig): Wehen überlappen sich
 * nie, deshalb reicht eine einzelne Spur mit prozentual positionierten
 * Balken. Farbe = Stärke, die Linie darunter markiert das laufende 5-1-1-Muster.
 */
export function TimelineChart({ contractions, now, streakIds }: TimelineChartProps) {
  const sorted = useMemo(
    () => [...contractions].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()),
    [contractions],
  )
  const [measureRef, width] = useElementWidth()

  if (sorted.length === 0) {
    return <p className="text-sm text-muted-foreground">Noch keine Wehen erfasst.</p>
  }

  const domainStart = new Date(sorted[0].start).getTime()
  const nowMs = now.getTime()
  const domainEnd = Math.max(nowMs, new Date(sorted[sorted.length - 1].end).getTime())
  const span = Math.max(domainEnd - domainStart, 60_000)
  // Fällt keine volle Stunde in den Zeitraum (z.B. sehr kurze Zeitspanne),
  // trotzdem eine Mindest-Legende mit Anfang/Mitte/Ende anzeigen.
  const hourTicks = buildHourTicks(
    domainStart,
    domainEnd,
    Math.floor((width || FALLBACK_WIDTH_PX) / MIN_LABEL_SPACING_PX),
  )
  const ticks =
    hourTicks.length > 0 ? hourTicks : [domainStart, domainStart + span / 2, domainEnd]
  const streakItems = sorted.filter((c) => streakIds?.has(c.id))
  const streakFrom = streakItems.length > 0 ? new Date(streakItems[0].start).getTime() : null
  const streakTo =
    streakItems.length > 0 ? new Date(streakItems[streakItems.length - 1].end).getTime() : null

  return (
    <div ref={measureRef} className="flex flex-col gap-1.5">
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
          return (
            <div
              key={c.id}
              title={`${formatTime(c.start)} – ${formatTime(c.end)}${c.intensity ? ` · Stärke ${c.intensity}/5` : ''}`}
              className="absolute top-2 h-12 rounded-sm"
              style={{
                left: `${leftPct}%`,
                width: `${widthPct}%`,
                backgroundColor: intensityColor(c.intensity),
              }}
            />
          )
        })}
        <div
          className="absolute top-0 h-full w-px bg-foreground/40"
          style={{ left: `${((nowMs - domainStart) / span) * 100}%` }}
        />
      </div>
      <div className="relative h-1.5 w-full" aria-label="Zeitraum des aktuellen Musters">
        {streakFrom != null && streakTo != null && (
          <div
            className="absolute h-full rounded-full bg-chart-1"
            style={{
              left: `${((streakFrom - domainStart) / span) * 100}%`,
              width: `${Math.max(((streakTo - streakFrom) / span) * 100, 0.6)}%`,
            }}
          />
        )}
      </div>
      <div className="relative h-4 text-xs text-muted-foreground">
        {ticks.map((t) => {
          const pct = ((t - domainStart) / span) * 100
          const px = (pct / 100) * (width || FALLBACK_WIDTH_PX)
          // Beschriftungen am Rand bündig ausrichten statt über den Rand hinaus zu zentrieren.
          const halfLabelPx = MIN_LABEL_SPACING_PX / 2
          const edge =
            px < halfLabelPx
              ? 'left-0'
              : px > (width || FALLBACK_WIDTH_PX) - halfLabelPx
                ? 'right-0'
                : '-translate-x-1/2'
          return (
            <span
              key={t}
              className={`absolute whitespace-nowrap ${edge}`}
              style={edge === '-translate-x-1/2' ? { left: `${pct}%` } : undefined}
            >
              {formatTick(t)}
            </span>
          )
        })}
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span>Stärke:</span>
        {Object.entries(INTENSITY_COLORS).map(([level, color]) => (
          <span key={level} className="flex items-center gap-1">
            <span className="inline-block size-3 rounded-sm" style={{ backgroundColor: color }} />
            {level}
          </span>
        ))}
        <span className="flex items-center gap-1">
          <span className="inline-block size-3 rounded-sm" style={{ backgroundColor: NO_INTENSITY_COLOR }} />
          ohne
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-1.5 w-4 rounded-full bg-chart-1" />
          aktuelles Muster
        </span>
      </div>
    </div>
  )
}

