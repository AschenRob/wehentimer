import { Sun } from 'lucide-react'
import { cn } from '@/lib/utils'
import { JUMPS, STATE_COLORS, jumpState, type JumpWindow } from '@/lib/jumps'

const DAY_MS = 24 * 60 * 60 * 1000
const WEEK_ROW_DAYS = 98
const MONTHS_PER_ROW = 2

interface Segment {
  label: string
  /** Tage ab ET (halboffen: from <= Tag < to). */
  from: number
  to: number
}

interface Row {
  key: string
  from: number
  to: number
  segments: Segment[]
  ticks: { day: number; label: string }[]
}

const monthFormatter = new Intl.DateTimeFormat('de-DE', { month: 'short', year: 'numeric' })

function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / DAY_MS)
}

/** Alle Montage im Bereich [from, to) als Ticks (gleichmäßiger Wochenabstand), Label = Tag im Monat. */
function mondayTicks(due: Date, from: number, to: number): Row['ticks'] {
  const ticks: Row['ticks'] = []
  for (let day = from; day < to; day++) {
    const date = new Date(due.getFullYear(), due.getMonth(), due.getDate() + day)
    if (date.getDay() === 1) ticks.push({ day, label: String(date.getDate()) })
  }
  return ticks
}

/** Mit ET: zwei Kalendermonate je Zeile; ohne ET: Blöcke zu 14 Wochen. */
function buildRows(due: Date | null): Row[] {
  const lastDay = Math.round(Math.max(...JUMPS.map((j) => j.stormEnd)) * 7)

  if (!due) {
    return Array.from({ length: Math.ceil(lastDay / WEEK_ROW_DAYS) }, (_, i) => {
      const from = i * WEEK_ROW_DAYS
      const to = from + WEEK_ROW_DAYS
      return {
        key: `w${i}`,
        from,
        to,
        segments: [{ label: `Wo. ${from / 7}–${to / 7}`, from, to }],
        ticks: Array.from({ length: WEEK_ROW_DAYS / 14 + 1 }, (_, t) => ({
          day: from + t * 14,
          label: String((from + t * 14) / 7),
        })),
      }
    })
  }

  const months: Segment[] = []
  for (
    let month = new Date(due.getFullYear(), due.getMonth(), 1);
    daysBetween(due, month) <= lastDay;
    month = new Date(month.getFullYear(), month.getMonth() + 1, 1)
  ) {
    months.push({
      label: monthFormatter.format(month),
      from: daysBetween(due, month),
      to: daysBetween(due, new Date(month.getFullYear(), month.getMonth() + 1, 1)),
    })
  }

  const rows: Row[] = []
  for (let i = 0; i < months.length; i += MONTHS_PER_ROW) {
    const segments = months.slice(i, i + MONTHS_PER_ROW)
    rows.push({
      key: `m${i}`,
      from: segments[0].from,
      to: segments[segments.length - 1].to,
      segments,
      ticks: mondayTicks(due, segments[0].from, segments[segments.length - 1].to),
    })
  }
  return rows
}

interface JumpTimelineProps {
  due: Date | null
  windows: JumpWindow[] | null
  now: Date
  /** Wochen ab ET; null = kein ET. */
  weeksNow: number | null
  selected: number
  onSelect: (jump: number) => void
}

/** Phasen aller zehn Sprünge, mit ET zwei Kalendermonate pro Zeile; Balken sind antippbar. */
export function JumpTimeline({ due, windows, now, weeksNow, selected, onSelect }: JumpTimelineProps) {
  const rows = buildRows(due)
  const todayDay = weeksNow !== null ? weeksNow * 7 : null

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row) => {
        const length = row.to - row.from
        const pct = (day: number) => `${((day - row.from) / length) * 100}%`
        const pieces = JUMPS.map((jump) => ({
          jump,
          start: Math.round(jump.stormStart * 7),
          end: Math.round(jump.stormEnd * 7),
        })).filter((p) => p.end > row.from && p.start < row.to)
        const hasToday = todayDay !== null && todayDay >= row.from && todayDay < row.to

        return (
          <div key={row.key}>
            <div className="relative h-4 text-[11px] font-medium text-muted-foreground">
              {row.segments.map((segment) => (
                <span
                  key={segment.from}
                  className="absolute left-0 whitespace-nowrap"
                  style={segment.from === row.from ? undefined : { left: pct(segment.from) }}
                >
                  {segment.label}
                </span>
              ))}
            </div>
            <div className="relative h-9 rounded-sm bg-muted">
              {row.ticks.map((t) => (
                <div
                  key={t.day}
                  className="absolute top-0 h-full w-px bg-foreground/10"
                  style={{ left: pct(t.day) }}
                />
              ))}
              {row.segments.slice(1).map((segment) => (
                <div
                  key={`divider-${segment.from}`}
                  className="absolute top-0 h-full w-px bg-foreground/40"
                  style={{ left: pct(segment.from) }}
                />
              ))}
              {due && row.from <= 0 && row.to > 0 && (
                <span
                  className="pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2 text-lg leading-none"
                  style={{ left: pct(0.5) }}
                  title="Errechneter Termin"
                >
                  ⭐
                </span>
              )}
              {pieces.map(({ jump, start, end }) => {
                const a = Math.max(start, row.from)
                const b = Math.min(end, row.to)
                const window = windows?.find((w) => w.jump.number === jump.number)
                const state = window ? jumpState(window, now) : null
                const isSelected = selected === jump.number
                return (
                  <button
                    key={jump.number}
                    type="button"
                    onClick={() => onSelect(jump.number)}
                    aria-label={`Sprung ${jump.number}: ${jump.name}`}
                    aria-pressed={isSelected}
                    className={cn(
                      'absolute top-1 flex h-7 min-w-5 items-center justify-center rounded-sm text-xs font-semibold text-white',
                      isSelected && 'ring-2 ring-foreground',
                    )}
                    style={{
                      left: pct(a),
                      width: `${((b - a) / length) * 100}%`,
                      backgroundColor: state ? STATE_COLORS[state] : STATE_COLORS.upcoming,
                    }}
                  >
                    {jump.number}
                  </button>
                )
              })}
              {pieces
                .filter((p) => p.end >= row.from && p.end < row.to)
                .map(({ jump, end }) => (
                  <Sun
                    key={`sun-${jump.number}`}
                    className="pointer-events-none absolute -bottom-2 size-3.5 -translate-x-1/2 text-amber-500"
                    style={{ left: pct(end + 0.5) }}
                  />
                ))}
              {hasToday && todayDay !== null && (
                <div
                  className="pointer-events-none absolute top-0 h-full w-0.5 bg-foreground"
                  style={{ left: pct(todayDay + 0.5) }}
                >
                  <span className="absolute -top-1 left-1/2 size-2 -translate-x-1/2 rounded-full bg-foreground" />
                </div>
              )}
            </div>
            <div className="relative mt-1 h-3 text-[10px] text-muted-foreground">
              {row.ticks.map((t) => (
                <span
                  key={t.day}
                  className="absolute -translate-x-1/2"
                  style={{ left: pct(t.day) }}
                >
                  {t.label}
                </span>
              ))}
            </div>
          </div>
        )
      })}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block size-3 rounded-sm" style={{ background: STATE_COLORS.past }} />
          vorbei
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block size-3 rounded-sm" style={{ background: STATE_COLORS.running }} />
          läuft
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block size-3 rounded-sm" style={{ background: STATE_COLORS.upcoming }} />
          kommt noch
        </span>
        <span className="flex items-center gap-1">
          <Sun className="size-3.5 text-amber-500" /> Sonnenschein danach
        </span>
        {due && (
          <span className="flex items-center gap-1">
            <span aria-hidden>⭐</span> Errechneter Termin
          </span>
        )}
        {weeksNow !== null && (
          <span className="flex items-center gap-1">
            <span className="inline-block h-3 w-0.5 bg-foreground" /> Heute
          </span>
        )}
      </div>
    </div>
  )
}
