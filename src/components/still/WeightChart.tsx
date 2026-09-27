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
import { buildWeightSeries } from '@/lib/feedingStats'
import { formatDateTime, formatDay, formatGrams } from '@/lib/format'
import type { Feeding } from '@/types/feeding'

type WeightMode = 'entry' | 'day'

const MODE_OPTIONS = ['entry', 'day'] as const satisfies WeightMode[]

const MODE_LABELS: Record<WeightMode, string> = {
  entry: 'Jede Änderung',
  day: 'Pro Tag (letzter Wert)',
}

interface WeightChartProps {
  feedings: Feeding[]
}

export function WeightChart({ feedings }: WeightChartProps) {
  const [mode, setMode] = usePersistentState<WeightMode>(
    'still.weightMode',
    'entry',
    oneOf(MODE_OPTIONS),
  )
  const data = buildWeightSeries(feedings, mode)

  return (
    <ChartCard
      title="Gewichtsverlauf"
      actions={
        <OptionSelect
          value={mode}
          onChange={setMode}
          options={MODE_OPTIONS}
          labels={MODE_LABELS}
          label="Darstellung Gewicht"
        />
      }
    >
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Im Zeitraum wurde noch kein Gewicht erfasst.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 8, right: 16, left: 4, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="timestamp"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(v) => formatDay(new Date(v))}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              width={56}
              domain={[
                (min: number) => Math.floor((min - 50) / 50) * 50,
                (max: number) => Math.ceil((max + 50) / 50) * 50,
              ]}
              tickFormatter={(v) => formatGrams(Number(v))}
            />
            <Tooltip
              labelFormatter={(label) =>
                mode === 'day'
                  ? formatDay(new Date(label as number))
                  : formatDateTime(new Date(label as number))
              }
              formatter={(value) => [formatGrams(Number(value)), 'Gewicht']}
            />
            <Line
              type="monotone"
              dataKey="weight"
              name="Gewicht"
              stroke="var(--chart-2)"
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}
