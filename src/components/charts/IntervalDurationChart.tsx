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
import { buildChartSeries, type Thresholds } from '@/lib/rule511'
import { formatTime } from '@/lib/format'
import type { Contraction } from '@/types/contraction'

interface IntervalDurationChartProps {
  contractions: Contraction[]
  thresholds: Thresholds
  /** Festes Maximum der Y-Achse in Minuten, `null` = automatisch. */
  yMax: number | null
}

export function IntervalDurationChart({ contractions, thresholds, yMax }: IntervalDurationChartProps) {
  const data = buildChartSeries(contractions).map((point) => ({
    ...point,
    // Numerischer Timestamp statt Kategorie-Label -> die X-Achse kann die
    // Punkte proportional zum tatsächlichen zeitlichen Abstand platzieren,
    // statt sie gleichmäßig durchzunummerieren.
    timestamp: new Date(point.start).getTime(),
  }))

  if (data.length < 2) {
    return (
      <p className="text-sm text-muted-foreground">
        Noch nicht genug Wehen für einen Verlauf (mindestens 2 nötig).
      </p>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 36 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="timestamp"
          type="number"
          scale="time"
          domain={['dataMin', 'dataMax']}
          tickFormatter={(value) => formatTime(new Date(value))}
          angle={-45}
          textAnchor="end"
          height={50}
          tick={{ fontSize: 12 }}
        />
        <YAxis
          tick={{ fontSize: 12 }}
          domain={yMax != null ? [0, yMax] : [0, 'auto']}
          allowDataOverflow={yMax != null}
          label={{ value: 'Minuten', angle: -90, position: 'insideLeft', fontSize: 12 }}
        />
        <Tooltip
          formatter={(value, name) => [`${Number(value).toFixed(1)} Min`, name]}
          labelFormatter={(label) => `Start: ${formatTime(new Date(label as number))}`}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <ReferenceLine
          y={thresholds.durationMinutes}
          stroke="var(--chart-2)"
          strokeDasharray="4 4"
          label={{ value: 'Mindestdauer', position: 'insideTopRight', fontSize: 11 }}
        />
        <ReferenceLine
          y={thresholds.intervalMinutes}
          stroke="var(--chart-1)"
          strokeDasharray="4 4"
          label={{ value: 'Zielabstand', position: 'insideBottomRight', fontSize: 11 }}
        />
        <Line
          type="monotone"
          dataKey="durationMin"
          name="Dauer"
          stroke="var(--chart-2)"
          dot={{ r: 3 }}
          connectNulls
        />
        <Line
          type="monotone"
          dataKey="intervalMin"
          name="Abstand"
          stroke="var(--chart-1)"
          dot={{ r: 3 }}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
