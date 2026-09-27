import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface OptionSelectProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: readonly T[]
  labels: Record<T, string>
  label: string
}

/** Kompaktes Dropdown für Chart-Konfiguration (Zeitraum, Kennzahl, Achsen-Maximum ...). */
export function OptionSelect<T extends string>({
  value,
  onChange,
  options,
  labels,
  label,
}: OptionSelectProps<T>) {
  return (
    <Select items={labels} value={value} onValueChange={(next) => next && onChange(next as T)}>
      <SelectTrigger size="sm" aria-label={label} className="text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {labels[option]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
