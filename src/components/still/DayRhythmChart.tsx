import { ChartCard } from '@/components/charts/ChartCard'
import { OptionSelect } from '@/components/charts/OptionSelect'
import { oneOf, usePersistentState } from '@/hooks/usePersistentState'
import { buildRhythmDays } from '@/lib/feedingStats'
import { formatDay, formatTime } from '@/lib/format'
import type { Feeding } from '@/types/feeding'

type ColorMode = 'woke' | 'supplement' | 'plain'

const COLOR_OPTIONS = ['woke', 'supplement', 'plain'] as const satisfies ColorMode[]

const COLOR_LABELS: Record<ColorMode, string> = {
  woke: 'Farbe: Aufwachen',
  supplement: 'Farbe: Zufütterung',
  plain: 'Farbe: einheitlich',
}

const LEGENDS: Record<ColorMode, { label: string; color: string }[]> = {
  woke: [
    { label: 'von selbst', color: 'var(--chart-2)' },
    { label: 'geweckt', color: 'var(--chart-4)' },
  ],
  supplement: [
    { label: 'ohne', color: 'var(--chart-5)' },
    { label: 'MM', color: 'var(--chart-2)' },
    { label: 'EM', color: 'var(--chart-1)' },
    { label: 'MM + EM', color: 'var(--chart-3)' },
  ],
  plain: [],
}

function barColor(feeding: Feeding, mode: ColorMode): string {
  if (mode === 'woke') return feeding.woke_self ? 'var(--chart-2)' : 'var(--chart-4)'
  if (mode === 'supplement') {
    const mm = feeding.supplement_mm_ml > 0
    const em = feeding.supplement_em_ml > 0
    if (mm && em) return 'var(--chart-3)'
    if (mm) return 'var(--chart-2)'
    if (em) return 'var(--chart-1)'
    return 'var(--chart-5)'
  }
  return 'var(--primary)'
}

const DAY_MIN = 24 * 60
const HOUR_TICKS = [0, 3, 6, 9, 12, 15, 18, 21, 24]

interface DayRhythmChartProps {
  feedings: Feeding[]
  now: Date
}

/** Eine Zeile je Tag über 0–24 Uhr: macht Tag-/Nacht-Rhythmus und Lücken sichtbar. */
export function DayRhythmChart({ feedings, now }: DayRhythmChartProps) {
  const [colorMode, setColorMode] = usePersistentState<ColorMode>(
    'still.rhythmColor',
    'woke',
    oneOf(COLOR_OPTIONS),
  )
  // Neuester Tag oben, passend zur Liste in der Erfassung.
  const days = buildRhythmDays(feedings).reverse()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const nowPct = ((now.getTime() - todayStart) / 60_000 / DAY_MIN) * 100

  return (
    <ChartCard
      title="Tagesrhythmus"
      actions={
        <OptionSelect
          value={colorMode}
          onChange={setColorMode}
          options={COLOR_OPTIONS}
          labels={COLOR_LABELS}
          label="Färbung Tagesrhythmus"
        />
      }
    >
      {days.length === 0 ? (
        <p className="text-sm text-muted-foreground">Noch keine Mahlzeiten im Zeitraum.</p>
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
                {HOUR_TICKS.slice(1, -1).map((h) => (
                  <div
                    key={h}
                    className="absolute top-0 h-full w-px bg-foreground/10"
                    style={{ left: `${(h / 24) * 100}%` }}
                  />
                ))}
                {day.items.map((item) => (
                  <div
                    key={item.id}
                    title={`${formatTime(item.feeding.start)}–${formatTime(item.feeding.end)}`}
                    className="absolute top-0.5 h-5 rounded-sm"
                    style={{
                      left: `${(item.startMin / DAY_MIN) * 100}%`,
                      width: `${Math.max(((item.endMin - item.startMin) / DAY_MIN) * 100, 0.8)}%`,
                      backgroundColor: barColor(item.feeding, colorMode),
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
          {LEGENDS[colorMode].length > 0 && (
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {LEGENDS[colorMode].map((entry) => (
                <span key={entry.label} className="flex items-center gap-1">
                  <span
                    className="inline-block size-3 rounded-sm"
                    style={{ backgroundColor: entry.color }}
                  />
                  {entry.label}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </ChartCard>
  )
}
