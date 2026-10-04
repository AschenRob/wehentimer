import { useEffect, useRef, useState } from 'react'
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

const WHEEL_THROTTLE_MS = 120

/**
 * Kompaktes Dropdown für Chart-Konfiguration (Zeitraum, Kennzahl, Achsen-Maximum ...).
 * Bei geöffnetem Dropdown wechseln Pfeil hoch/runter und das Scrollrad die Auswahl live
 * (Fernbedienung am TV); Enter schließt.
 */
export function OptionSelect<T extends string>({
  value,
  onChange,
  options,
  labels,
  label,
}: OptionSelectProps<T>) {
  const [open, setOpen] = useState(false)
  const valueRef = useRef(value)
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    valueRef.current = value
    onChangeRef.current = onChange
  })

  useEffect(() => {
    if (!open) return
    let lastWheel = 0

    function step(direction: 1 | -1) {
      const index = options.indexOf(valueRef.current)
      const next = options[Math.min(options.length - 1, Math.max(0, index + direction))]
      if (next !== valueRef.current) onChangeRef.current(next)
    }

    // Capture + stopPropagation, damit Base UI nicht parallel eine eigene Hervorhebung verschiebt.
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        e.stopPropagation()
        step(e.key === 'ArrowDown' ? 1 : -1)
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        e.stopPropagation()
        setOpen(false)
      }
    }

    function handleWheel(e: WheelEvent) {
      e.preventDefault()
      e.stopPropagation()
      const now = Date.now()
      if (now - lastWheel < WHEEL_THROTTLE_MS) return
      lastWheel = now
      step(e.deltaY > 0 ? 1 : -1)
    }

    window.addEventListener('keydown', handleKeyDown, true)
    window.addEventListener('wheel', handleWheel, { capture: true, passive: false })
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
      window.removeEventListener('wheel', handleWheel, true)
    }
  }, [open, options])

  return (
    <Select
      items={labels}
      value={value}
      open={open}
      onOpenChange={setOpen}
      onValueChange={(next) => next && onChange(next as T)}
    >
      <SelectTrigger size="sm" aria-label={label} className="text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {options.map((option) => (
          <SelectItem
            key={option}
            value={option}
            className="data-selected:bg-accent data-selected:text-accent-foreground"
          >
            {labels[option]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
