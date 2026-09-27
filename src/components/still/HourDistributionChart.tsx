import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ChartCard } from '@/components/charts/ChartCard'
import { OptionSelect } from '@/components/charts/OptionSelect'
import { oneOf, usePersistentState } from '@/hooks/usePersistentState'
import { buildHourDistribution, type HourMetric } from '@/lib/feedingStats'
import type { Feeding } from '@/types/feeding'

type BinSize = '1' | '2' | '3' | '6'

const BIN_OPTIONS = ['1', '2', '3', '6'] as const satisfies BinSize[]

const BIN_LABELS: Record<BinSize, string> = {
  '1': 'je 1 Std',
  '2': 'je 2 Std',
  '3': 'je 3 Std',
  '6': 'je 6 Std',
}

const METRIC_OPTIONS = ['count', 'supplement', 'latch'] as const satisfies HourMetric[]

const METRIC_LABELS: Record<HourMetric, string> = {
  count: 'Mahlzeiten',
  supplement: 'Zugefüttert (ml)',
  latch: 'Angelegt (Min)',
}

const METRIC_UNITS: Record<HourMetric, string> = {
  count: '',
  supplement: ' ml',
  latch: ' Min',
}

interface HourDistributionChartProps {
  feedings: Feeding[]
}

/** Summe über alle Tage im Zeitraum nach Uhrzeit – zeigt, wann typischerweise getrunken wird. */
export function HourDistributionChart({ feedings }: HourDistributionChartProps) {
  const [bin, setBin] = usePersistentState<BinSize>('still.hourBin', '3', oneOf(BIN_OPTIONS))
  const [metric, setMetric] = usePersistentState<HourMetric>(
    'still.hourMetric',
    'count',
    oneOf(METRIC_OPTIONS),
  )
  const data = buildHourDistribution(feedings, Number(bin), metric)

  return (
    <ChartCard
      title="Nach Tageszeit"
      actions={
        <>
          <OptionSelect
            value={metric}
            onChange={setMetric}
            options={METRIC_OPTIONS}
            labels={METRIC_LABELS}
            label="Kennzahl nach Tageszeit"
          />
          <OptionSelect
            value={bin}
            onChange={setBin}
            options={BIN_OPTIONS}
            labels={BIN_LABELS}
            label="Blockgröße"
          />
        </>
      }
    >
      {feedings.length === 0 ? (
        <p className="text-sm text-muted-foreground">Noch keine Mahlzeiten im Zeitraum.</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={bin === '1' ? 2 : 0} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip
              labelFormatter={(label) => `${label} Uhr`}
              formatter={(value) => [`${value}${METRIC_UNITS[metric]}`, METRIC_LABELS[metric]]}
            />
            <Bar dataKey="value" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}
