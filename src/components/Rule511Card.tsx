import { AlertTriangle, Clock3, HeartPulse, TrendingUp } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { formatMinutes } from '@/lib/format'
import type { PatternStatus, Rule511Result } from '@/lib/rule511'

const STATUS_META: Record<
  PatternStatus,
  { label: string; description: string; className: string }
> = {
  idle: {
    label: 'Kein aktuelles Muster',
    description: 'Noch keine regelmäßigen Wehen erkannt.',
    className: 'border-status-idle/30 bg-status-idle/10 text-status-idle',
  },
  observing: {
    label: 'Beobachten',
    description: 'Wehen werden erfasst, aber noch nicht regelmäßig genug.',
    className: 'border-status-observing/30 bg-status-observing/10 text-status-observing',
  },
  approaching: {
    label: 'Muster erkannt',
    description: 'Ein regelmäßiges Muster läuft, die Stunde ist aber noch nicht voll.',
    className: 'border-status-approaching/30 bg-status-approaching/10 text-status-approaching',
  },
  critical: {
    label: '5-1-1 erreicht – ins Krankenhaus fahren!',
    description: 'Das Muster hält bereits seit der eingestellten Zeit durch.',
    className: 'border-status-critical/30 bg-status-critical/10 text-status-critical',
  },
}

interface Rule511CardProps {
  result: Rule511Result
  sustainedMinutes: number
  lastHourCount: number
}

export function Rule511Card({ result, sustainedMinutes, lastHourCount }: Rule511CardProps) {
  const meta = STATUS_META[result.status]

  return (
    <div className={cn('rounded-xl border p-4', meta.className)}>
      <div className="flex items-center gap-2">
        {result.status === 'critical' ? (
          <AlertTriangle className="size-5 shrink-0" />
        ) : (
          <HeartPulse className="size-5 shrink-0" />
        )}
        <h3 className="font-semibold">{meta.label}</h3>
      </div>
      <p className="mt-1 text-sm opacity-90">{meta.description}</p>

      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="flex items-center gap-1">
            <TrendingUp className="size-3.5" /> Muster hält seit
          </span>
          <span>
            {formatMinutes(result.streakDurationMin)} / {formatMinutes(sustainedMinutes)}
          </span>
        </div>
        <Progress value={result.progress * 100} />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs opacity-70">Ø Abstand</dt>
          <dd>{result.avgIntervalMin != null ? formatMinutes(result.avgIntervalMin) : '–'}</dd>
        </div>
        <div>
          <dt className="text-xs opacity-70">Ø Dauer</dt>
          <dd>{result.avgDurationMin != null ? formatMinutes(result.avgDurationMin) : '–'}</dd>
        </div>
        <div>
          <dt className="text-xs opacity-70">Wehen im Muster</dt>
          <dd>
            {result.streakCount}
            {result.outlierCount > 0 && (
              <span className="text-xs opacity-70"> (davon {result.outlierCount} toleriert)</span>
            )}
          </dd>
        </div>
        <div>
          <dt className="flex items-center gap-1 text-xs opacity-70">
            <Clock3 className="size-3.5" /> Letzte Wehe
          </dt>
          <dd>{result.minutesSinceLast != null ? `vor ${formatMinutes(result.minutesSinceLast)}` : '–'}</dd>
        </div>
        <div>
          <dt className="text-xs opacity-70">Wehen (letzte Std.)</dt>
          <dd>{lastHourCount}</dd>
        </div>
      </dl>
    </div>
  )
}
