import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartCard } from '@/components/charts/ChartCard'
import { OptionSelect } from '@/components/charts/OptionSelect'
import { oneOf, usePersistentState } from '@/hooks/usePersistentState'
import {
  INTERVAL_Y_MAX_LABELS,
  INTERVAL_Y_MAX_OPTIONS,
  type IntervalYMax,
} from '@/lib/chartRange'
import { buildFeedingSeries, dayTicks, type FeedingPoint } from '@/lib/feedingStats'
import { formatDateTime, formatDay, formatDecimal, formatTime } from '@/lib/format'
import type { Feeding } from '@/types/feeding'

type TrendMetric = 'interval' | 'latch' | 'supplement'

const METRIC_OPTIONS = ['interval', 'latch', 'supplement'] as const satisfies TrendMetric[]

const METRIC_LABELS: Record<TrendMetric, string> = {
  interval: 'Abstand (Std)',
  latch: 'Angelegt (Min)',
  supplement: 'Zugefüttert (ml)',
}

const METRIC_LINES: Record<
  TrendMetric,
  { key: keyof FeedingPoint; name: string; color: string; unit: string }[]
> = {
  interval: [{ key: 'intervalHours', name: 'Abstand', color: 'var(--chart-1)', unit: ' Std' }],
  latch: [{ key: 'latchMinutes', name: 'Angelegt', color: 'var(--chart-2)', unit: ' Min' }],
  supplement: [
    { key: 'mmMl', name: 'MM', color: 'var(--chart-2)', unit: ' ml' },
    { key: 'emMl', name: 'EM', color: 'var(--chart-1)', unit: ' ml' },
  ],
}

interface FeedingTrendChartProps {
  feedings: Feeding[]
  /** Gestrichelte Soll-Linie im Modus "Abstand" in Stunden; 0 = keine Linie. */
  targetIntervalHours: number
}

/** Verlauf je Mahlzeit auf echter Zeitachse. */
export function FeedingTrendChart({ feedings, targetIntervalHours }: FeedingTrendChartProps) {
  const [metric, setMetric] = usePersistentState<TrendMetric>(
    'still.trendMetric',
    'interval',
    oneOf(METRIC_OPTIONS),
  )
  const [yMax, setYMax] = usePersistentState<IntervalYMax>(
    'still.trendYMax',
    'auto',
    oneOf(INTERVAL_Y_MAX_OPTIONS),
  )
  const data = buildFeedingSeries(feedings)
  const lines = METRIC_LINES[metric]
  const unitByName = Object.fromEntries(lines.map((l) => [l.name, l.unit]))
  const spansDays =
    data.length > 1 && data[data.length - 1].timestamp - data[0].timestamp > 20 * 3_600_000
  const xTicks = spansDays
    ? dayTicks(data[0].timestamp, data[data.length - 1].timestamp)
    : undefined
  const isInterval = metric === 'interval'
  const fixedMax = isInterval && yMax !== 'auto' ? Number(yMax) : null

  return (
    <ChartCard
      title="Verlauf je Mahlzeit"
      actions={
        <>
          <OptionSelect
            value={metric}
            onChange={setMetric}
            options={METRIC_OPTIONS}
            labels={METRIC_LABELS}
            label="Kennzahl für Verlauf"
          />
          {isInterval && (
            <OptionSelect
              value={yMax}
              onChange={setYMax}
              options={INTERVAL_Y_MAX_OPTIONS}
              labels={INTERVAL_Y_MAX_LABELS}
              label="Maximum der Y-Achse"
            />
          )}
        </>
      }
    >
      {data.length < 2 ? (
        <p className="text-sm text-muted-foreground">
          Noch nicht genug Mahlzeiten für einen Verlauf (mindestens 2 nötig).
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data} margin={{ top: 8, right: 16, left: -12, bottom: 24 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="timestamp"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              ticks={xTicks}
              tickFormatter={(v) => (spansDays ? formatDay(new Date(v)) : formatTime(new Date(v)))}
              angle={-35}
              textAnchor="end"
              height={40}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              domain={[0, fixedMax ?? 'auto']}
              allowDataOverflow={fixedMax != null}
            />
            {isInterval && targetIntervalHours > 0 && (
              <ReferenceLine
                y={targetIntervalHours}
                stroke="var(--chart-4)"
                strokeDasharray="6 4"
                ifOverflow={fixedMax != null ? 'hidden' : 'extendDomain'}
                label={{
                  value: `${formatDecimal(targetIntervalHours)} Std`,
                  position: 'insideTopRight',
                  fontSize: 11,
                  fill: 'var(--chart-4)',
                }}
              />
            )}
            <Tooltip
              labelFormatter={(label) => formatDateTime(new Date(label as number))}
              formatter={(value, name) => [
                `${formatDecimal(Number(value))}${unitByName[String(name)] ?? ''}`,
                name,
              ]}
            />
            {lines.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
            {lines.map((line) => (
              <Line
                key={line.key}
                type="monotone"
                dataKey={line.key}
                name={line.name}
                stroke={line.color}
                dot={{ r: 3 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}
