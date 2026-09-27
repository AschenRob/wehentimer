import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartCard } from '@/components/charts/ChartCard'
import { OptionSelect } from '@/components/charts/OptionSelect'
import { oneOf, usePersistentState } from '@/hooks/usePersistentState'
import { buildDailyStats, type DailyStats } from '@/lib/feedingStats'
import { formatDay } from '@/lib/format'
import type { Feeding } from '@/types/feeding'

type DailyMetric = 'count' | 'latch' | 'supplement' | 'diapers' | 'woke'

const METRIC_OPTIONS = [
  'count',
  'latch',
  'supplement',
  'diapers',
  'woke',
] as const satisfies DailyMetric[]

const METRIC_LABELS: Record<DailyMetric, string> = {
  count: 'Mahlzeiten',
  latch: 'Angelegt (Min)',
  supplement: 'Zugefüttert (ml)',
  diapers: 'Windeln',
  woke: 'Aufwachen',
}

const METRIC_BARS: Record<
  DailyMetric,
  { key: keyof DailyStats; name: string; color: string; unit: string }[]
> = {
  count: [{ key: 'count', name: 'Mahlzeiten', color: 'var(--chart-1)', unit: '' }],
  latch: [{ key: 'latchMinutes', name: 'Angelegt', color: 'var(--chart-2)', unit: ' Min' }],
  supplement: [
    { key: 'mmMl', name: 'Muttermilch (MM)', color: 'var(--chart-2)', unit: ' ml' },
    { key: 'emMl', name: 'Ersatzmilch (EM)', color: 'var(--chart-1)', unit: ' ml' },
  ],
  diapers: [
    { key: 'urine', name: 'Urin', color: 'var(--chart-3)', unit: '' },
    { key: 'stool', name: 'Stuhl', color: 'var(--chart-5)', unit: '' },
  ],
  woke: [
    { key: 'wokeSelf', name: 'Von selbst', color: 'var(--chart-2)', unit: '' },
    { key: 'woken', name: 'Geweckt', color: 'var(--chart-4)', unit: '' },
  ],
}

interface DailyChartProps {
  feedings: Feeding[]
}

/** Tagessummen als Balken, Kennzahl per Dropdown umschaltbar. */
export function DailyChart({ feedings }: DailyChartProps) {
  const [metric, setMetric] = usePersistentState<DailyMetric>(
    'still.dailyMetric',
    'count',
    oneOf(METRIC_OPTIONS),
  )
  const data = buildDailyStats(feedings)
  const bars = METRIC_BARS[metric]
  const unitByName = Object.fromEntries(bars.map((b) => [b.name, b.unit]))

  return (
    <ChartCard
      title="Pro Tag"
      actions={
        <OptionSelect
          value={metric}
          onChange={setMetric}
          options={METRIC_OPTIONS}
          labels={METRIC_LABELS}
          label="Kennzahl pro Tag"
        />
      }
    >
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground">Noch keine Mahlzeiten im Zeitraum.</p>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="dayStart"
              tickFormatter={(v) => formatDay(new Date(v))}
              tick={{ fontSize: 11 }}
            />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip
              labelFormatter={(label) => formatDay(new Date(label as number))}
              formatter={(value, name) => [`${value}${unitByName[String(name)] ?? ''}`, name]}
            />
            {bars.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
            {bars.map((bar) => (
              <Bar
                key={bar.key}
                dataKey={bar.key}
                name={bar.name}
                fill={bar.color}
                stackId="day"
                radius={bars.length === 1 ? [4, 4, 0, 0] : undefined}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}
