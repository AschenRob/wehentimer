import { ChartCard } from '@/components/charts/ChartCard'
import { formatDecimal } from '@/lib/format'
import { AFTER_REM_LABELS, type Sleep } from '@/types/sleep'

interface SleepAfterRemCardProps {
  sleeps: Sleep[]
}

/** Anteil: Nach der REM-Phase aufgewacht oder in den nächsten Schlafzyklus übergegangen. */
export function SleepAfterRemCard({ sleeps }: SleepAfterRemCardProps) {
  const woke = sleeps.filter((s) => s.after_rem === 'woke').length
  const next = sleeps.filter((s) => s.after_rem === 'next_cycle').length
  const total = woke + next
  const nextPct = total > 0 ? (next / total) * 100 : 0

  return (
    <ChartCard title="Nach der REM-Phase">
      {total === 0 ? (
        <p className="text-sm text-muted-foreground">
          Im Zeitraum wurde noch nicht erfasst, was nach der REM-Phase passiert.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex h-6 overflow-hidden rounded-sm bg-muted">
            <div style={{ width: `${nextPct}%`, backgroundColor: 'var(--chart-2)' }} />
            <div style={{ width: `${100 - nextPct}%`, backgroundColor: 'var(--chart-4)' }} />
          </div>
          <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="inline-block size-3 rounded-sm" style={{ background: 'var(--chart-2)' }} />
              {AFTER_REM_LABELS.next_cycle}: {next}× ({formatDecimal(nextPct)} %)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block size-3 rounded-sm" style={{ background: 'var(--chart-4)' }} />
              {AFTER_REM_LABELS.woke}: {woke}× ({formatDecimal(100 - nextPct)} %)
            </span>
          </div>
        </div>
      )}
    </ChartCard>
  )
}
