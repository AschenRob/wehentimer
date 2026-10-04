import { ChartCard } from '@/components/charts/ChartCard'
import { buildSleepRhythmDays } from '@/lib/sleepStats'
import { formatDay, formatTime } from '@/lib/format'
import { isNightSleep, type Sleep } from '@/types/sleep'

const DAY_MIN = 24 * 60
const HOUR_TICKS = [0, 3, 6, 9, 12, 15, 18, 21, 24]
const NIGHT_BANDS = [
  { from: 0, to: 6 },
  { from: 19, to: 24 },
]

interface SleepRhythmChartProps {
  sleeps: Sleep[]
  now: Date
}

/** Eine Zeile je Tag über 0–24 Uhr: zeigt Schlafphasen und Lücken im Tagesablauf. */
export function SleepRhythmChart({ sleeps, now }: SleepRhythmChartProps) {
  // Neuester Tag oben, passend zur Liste in der Erfassung.
  const days = buildSleepRhythmDays(sleeps).reverse()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const nowPct = ((now.getTime() - todayStart) / 60_000 / DAY_MIN) * 100

  return (
    <ChartCard title="Tagesrhythmus Schlaf">
      {days.length === 0 ? (
        <p className="text-sm text-muted-foreground">Noch kein Schlaf im Zeitraum.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          <div className="grid grid-cols-[4.5rem_1fr] gap-2">
            <span />
            <div className="relative h-4 text-[10px] text-muted-foreground">
              {HOUR_TICKS.map((h) => (
                <span
                  key={h}
                  className={
                    h === 0
                      ? 'absolute left-0'
                      : h === 24
                        ? 'absolute right-0'
                        : 'absolute -translate-x-1/2'
                  }
                  style={h === 0 || h === 24 ? undefined : { left: `${(h / 24) * 100}%` }}
                >
                  {h}
                </span>
              ))}
            </div>
          </div>
          {days.map((day) => (
            <div key={day.dayStart} className="grid grid-cols-[4.5rem_1fr] items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {formatDay(new Date(day.dayStart))}
              </span>
              <div className="relative h-6 overflow-hidden rounded-sm bg-muted">
                {NIGHT_BANDS.map((band) => (
                  <div
                    key={band.from}
                    className="absolute top-0 h-full bg-sky-200/70 dark:bg-sky-900/50"
                    style={{
                      left: `${(band.from / 24) * 100}%`,
                      width: `${((band.to - band.from) / 24) * 100}%`,
                    }}
                  />
                ))}
                {HOUR_TICKS.slice(1, -1).map((h) => (
                  <div
                    key={h}
                    className="absolute top-0 h-full w-px bg-foreground/10"
                    style={{ left: `${(h / 24) * 100}%` }}
                  />
                ))}
                {day.segments.map((seg) => (
                  <div
                    key={`${seg.sleep.id}-${seg.startMin}`}
                    title={`${formatTime(seg.sleep.start)}–${formatTime(seg.sleep.end)}`}
                    className="absolute top-0.5 h-5 rounded-sm"
                    style={{
                      left: `${(seg.startMin / DAY_MIN) * 100}%`,
                      width: `${Math.max(((seg.endMin - seg.startMin) / DAY_MIN) * 100, 0.8)}%`,
                      backgroundColor: isNightSleep(seg.sleep) ? 'var(--chart-3)' : 'var(--chart-1)',
                    }}
                  />
                ))}
                {day.dayStart === todayStart && (
                  <div
                    className="absolute top-0 h-full w-px bg-foreground/50"
                    style={{ left: `${nowPct}%` }}
                  />
                )}
              </div>
            </div>
          ))}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="inline-block size-3 rounded-sm" style={{ background: 'var(--chart-1)' }} />
              Tagschlaf
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block size-3 rounded-sm" style={{ background: 'var(--chart-3)' }} />
              Nachtschlaf
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block size-3 rounded-sm bg-sky-200/70 dark:bg-sky-900/50" />
              Nachtzeit (19–6 Uhr)
            </span>
          </div>
        </div>
      )}
    </ChartCard>
  )
}
