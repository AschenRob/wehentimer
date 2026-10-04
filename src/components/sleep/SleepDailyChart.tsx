import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartCard } from '@/components/charts/ChartCard'
import { buildSleepDaily } from '@/lib/sleepStats'
import { formatDay, formatDecimal } from '@/lib/format'
import type { JumpWindow } from '@/lib/jumps'
import type { Sleep } from '@/types/sleep'

interface SleepDailyChartProps {
  sleeps: Sleep[]
  /** Sprung-Phasen als Markierung; null = kein ET gesetzt. */
  windows: JumpWindow[] | null
}

/** Schlafstunden je Tag (Tag/Nacht gestapelt); Sprung-Phasen sind hinterlegt. */
export function SleepDailyChart({ sleeps, windows }: SleepDailyChartProps) {
  const data = buildSleepDaily(sleeps)
  const markers = (windows ?? [])
    .map((w) => {
      const days = data.filter(
        (d) => d.dayStart >= w.start.getTime() && d.dayStart < w.end.getTime(),
      )
      return days.length > 0
        ? { number: w.jump.number, x1: days[0].dayStart, x2: days[days.length - 1].dayStart }
        : null
    })
    .filter((m) => m !== null)

  return (
    <ChartCard title="Schlaf pro Tag">
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground">Noch kein Schlaf im Zeitraum.</p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data} margin={{ top: 16, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="dayStart"
                tickFormatter={(v) => formatDay(new Date(v))}
                tick={{ fontSize: 11 }}
              />
              <YAxis tick={{ fontSize: 12 }} unit=" h" />
              {markers.map((m) => (
                <ReferenceArea
                  key={m.number}
                  x1={m.x1}
                  x2={m.x2}
                  fill="var(--chart-4)"
                  fillOpacity={0.25}
                  label={{ value: `Sprung ${m.number}`, fontSize: 10, position: 'top' }}
                />
              ))}
              <Tooltip
                labelFormatter={(label) => formatDay(new Date(label as number))}
                formatter={(value, name) => [`${formatDecimal(Number(value))} h`, name]}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="nightHours" name="Nacht" fill="var(--chart-3)" stackId="sleep" />
              <Bar dataKey="dayHours" name="Tag" fill="var(--chart-1)" stackId="sleep" />
            </BarChart>
          </ResponsiveContainer>
          {windows && (
            <p className="mt-1 text-xs text-muted-foreground">
              Hinterlegte Bereiche = stürmische Phase eines Entwicklungssprungs.
            </p>
          )}
        </>
      )}
    </ChartCard>
  )
}
