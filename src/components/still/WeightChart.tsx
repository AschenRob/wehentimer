import {
  CartesianGrid,
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
import {
  WEIGHT_Y_SCALE_LABELS,
  WEIGHT_Y_SCALE_OPTIONS,
  type WeightYScale,
} from '@/lib/chartRange'
import { buildWeightSeries, dayTicks } from '@/lib/feedingStats'
import { formatDateTime, formatDay, formatGrams } from '@/lib/format'
import { whoReferenceAt, type WeightReference } from '@/lib/whoWeight'
import { parseBabyDate, type Baby } from '@/types/baby'
import type { Feeding } from '@/types/feeding'

type WeightMode = 'entry' | 'day'

const MODE_OPTIONS = ['entry', 'day'] as const satisfies WeightMode[]

const MODE_LABELS: Record<WeightMode, string> = {
  entry: 'Jede Änderung',
  day: 'Pro Tag (letzter Wert)',
}

interface WeightChartProps {
  feedings: Feeding[]
  baby: Pick<Baby, 'gender' | 'birth_date' | 'due_date'>
}

interface ChartRow extends Partial<WeightReference> {
  timestamp: number
  weight?: number
}

/** Gewichtspunkte plus Stützstellen (Start, Mitternächte, Ende) für die WHO-Kurven. */
function withReference(
  points: { timestamp: number; weight: number }[],
  baby: WeightChartProps['baby'],
): ChartRow[] {
  const birth = parseBabyDate(baby.birth_date) ?? parseBabyDate(baby.due_date)
  if (!birth || !baby.gender || points.length === 0) return points
  const first = points[0].timestamp
  const last = points[points.length - 1].timestamp
  const times = new Set([first, last, ...points.map((p) => p.timestamp)])
  const start = new Date(first)
  for (let i = 1; ; i++) {
    const midnight = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i).getTime()
    if (midnight >= last) break
    times.add(midnight)
  }
  const weights = new Map(points.map((p) => [p.timestamp, p.weight]))
  return [...times]
    .sort((a, b) => a - b)
    .map((timestamp) => ({
      timestamp,
      weight: weights.get(timestamp),
      ...whoReferenceAt(baby.gender, birth, timestamp),
    }))
}

/** Y-Bereich in Gramm; `auto` lässt Recharts über alle Linien (inkl. Normbereich) entscheiden. */
function yDomainFor(
  scale: WeightYScale,
  points: { weight: number }[],
): [number | ((v: number) => number), number | ((v: number) => number)] {
  if (scale === 'data') {
    const weights = points.map((p) => p.weight)
    return [
      Math.floor((Math.min(...weights) - 50) / 50) * 50,
      Math.ceil((Math.max(...weights) + 50) / 50) * 50,
    ]
  }
  if (scale === 'auto') {
    return [
      (min: number) => Math.floor((min - 50) / 50) * 50,
      (max: number) => Math.ceil((max + 50) / 50) * 50,
    ]
  }
  const [lo, hi] = scale.split('-').map((kg) => Number(kg) * 1000)
  return [lo, hi]
}

export function WeightChart({ feedings, baby }: WeightChartProps) {
  const [yScale, setYScale] = usePersistentState<WeightYScale>(
    'still.weightYScale',
    'auto',
    oneOf(WEIGHT_Y_SCALE_OPTIONS),
  )
  const [mode, setMode] = usePersistentState<WeightMode>(
    'still.weightMode',
    'entry',
    oneOf(MODE_OPTIONS),
  )
  const points = buildWeightSeries(feedings, mode)
  const data = withReference(points, baby)
  const xTicks =
    data.length > 1 ? dayTicks(data[0].timestamp, data[data.length - 1].timestamp) : undefined
  const yDomain = yDomainFor(yScale, points)
  const clipped = yScale !== 'auto'

  return (
    <ChartCard
      title="Gewichtsverlauf"
      actions={
        <>
          <OptionSelect
            value={mode}
            onChange={setMode}
            options={MODE_OPTIONS}
            labels={MODE_LABELS}
            label="Darstellung Gewicht"
          />
          <OptionSelect
            value={yScale}
            onChange={setYScale}
            options={WEIGHT_Y_SCALE_OPTIONS}
            labels={WEIGHT_Y_SCALE_LABELS}
            label="Skalierung der Y-Achse"
          />
        </>
      }
    >
      {points.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Im Zeitraum wurde noch kein Gewicht erfasst.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 20, right: 16, left: 4, bottom: 0 }}>
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
            <YAxis
              tick={{ fontSize: 12 }}
              width={56}
              domain={yDomain}
              allowDataOverflow={clipped}
              tickFormatter={(v) => formatGrams(Number(v))}
            />
            <Tooltip
              labelFormatter={(label) =>
                mode === 'day'
                  ? formatDay(new Date(label as number))
                  : formatDateTime(new Date(label as number))
              }
              formatter={(value, name) => [formatGrams(Number(value)), name]}
            />
            <Line
              type="monotone"
              dataKey="p97"
              name="Oberer Grenzwert (P97)"
              stroke="var(--muted-foreground)"
              strokeDasharray="5 4"
              strokeWidth={1.5}
              dot={false}
              activeDot={false}
            />
            <Line
              type="monotone"
              dataKey="p50"
              name="Normgewicht (P50)"
              stroke="var(--muted-foreground)"
              strokeWidth={1.5}
              dot={false}
              activeDot={false}
            />
            <Line
              type="monotone"
              dataKey="p3"
              name="Unterer Grenzwert (P3)"
              stroke="var(--muted-foreground)"
              strokeDasharray="5 4"
              strokeWidth={1.5}
              dot={false}
              activeDot={false}
            />
            <Line
              type="monotone"
              dataKey="weight"
              name="Gewicht"
              stroke="var(--chart-2)"
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}
