import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CHART_RANGE_LABELS, CHART_RANGE_OPTIONS, type ChartRange } from '@/lib/chartRange'

interface ChartRangeSelectProps {
  value: ChartRange
  onChange: (value: ChartRange) => void
  label: string
}

/** Zeitraum-Filter oben rechts an einer Chart-Karte (Gesamt / letzte 3 Tage / 24h / 3h / 1h). */
export function ChartRangeSelect({ value, onChange, label }: ChartRangeSelectProps) {
  return (
    <Select
      items={CHART_RANGE_LABELS}
      value={value}
      onValueChange={(next) => next && onChange(next as ChartRange)}
    >
      <SelectTrigger size="sm" aria-label={label} className="text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {CHART_RANGE_OPTIONS.map((option) => (
          <SelectItem key={option} value={option}>
            {CHART_RANGE_LABELS[option]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
