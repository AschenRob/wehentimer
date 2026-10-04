import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartCard } from '@/components/charts/ChartCard'
import { OptionSelect } from '@/components/charts/OptionSelect'
import { oneOf, usePersistentState } from '@/hooks/usePersistentState'
import { dayTicks } from '@/lib/feedingStats'
import { formatDateTime, formatDay } from '@/lib/format'
import { buildCycleSeries } from '@/lib/sleepStats'
import type { Sleep } from '@/types/sleep'

type CycleMetric = 'cycle' | 'relax'

const METRIC_OPTIONS = ['cycle', 'relax'] as const satisfies CycleMetric[]

const METRIC_LABELS: Record<CycleMetric, string> = {
  cycle: 'Tiefschlaf & REM',
  relax: 'Einschlafdauer',
}

const LINES: Record<
  CycleMetric,
  { key: 'relax' | 'deep' | 'rem'; name: string; color: string }[]
> = {
  cycle: [
    { key: 'deep', name: 'Tiefschlaf nach', color: 'var(--chart-2)' },
    { key: 'rem', name: 'REM-Beginn nach', color: 'var(--chart-4)' },
  ],
  relax: [{ key: 'relax', name: 'Völlig entspannt nach', color: 'var(--chart-1)' }],
}

interface SleepCycleChartProps {
  sleeps: Sleep[]
}

/** Verlauf der gemessenen Zeiten: wann Tiefschlaf/REM einsetzen und wie lange das Einschlafen dauert. */
export function SleepCycleChart({ sleeps }: SleepCycleChartProps) {
  const [metric, setMetric] = usePersistentState<CycleMetric>(
    'sleep.cycleMetric',
    'cycle',
    oneOf(METRIC_OPTIONS),
  )
  const lines = LINES[metric]
  const data = buildCycleSeries(sleeps).filter((p) => lines.some((l) => p[l.key] !== null))
  const xTicks =
    data.length > 1 ? dayTicks(data[0].timestamp, data[data.length - 1].timestamp) : undefined

  return (
    <ChartCard
      title="Schlafzyklus & Einschlafen"
      actions={
        <OptionSelect
          value={metric}
          onChange={setMetric}
          options={METRIC_OPTIONS}
          labels={METRIC_LABELS}
          label="Kennzahl Schlafzyklus"
        />
      }
    >
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Im Zeitraum wurden noch keine Zeiten gemessen.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 20, right: 16, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="timestamp"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              ticks={xTicks}
              tickFormatter={(v) => formatDay(new Date(v))}
              tick={{ fontSize: 11 }}
            />
            <YAxis tick={{ fontSize: 12 }} unit=" Min" width={56} />
            <Tooltip
              labelFormatter={(label) => formatDateTime(new Date(label as number))}
              formatter={(value, name) => [`${value} Min`, name]}
            />
            {lines.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
            {lines.map((line) => (
              <Line
                key={line.key}
                type="monotone"
                dataKey={line.key}
                name={line.name}
                stroke={line.color}
                connectNulls
                dot={{ r: 3 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}
