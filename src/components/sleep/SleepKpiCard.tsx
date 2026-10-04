import { Moon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatClockHM, formatDay, formatHoursMinutes, formatTime } from '@/lib/format'
import type { SleepKpis } from '@/lib/sleepStats'

interface SleepKpiCardProps {
  kpis: SleepKpis
  wide?: boolean
}

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
      {hint && <dd className="text-xs text-muted-foreground">{hint}</dd>}
    </div>
  )
}

function formatHours(hours: number): string {
  return formatHoursMinutes(hours * 60)
}

function formatMin(value: number | null): string {
  return value != null ? `${Math.round(value)} Min` : '–'
}

/** Überblick: Wachzeit live + Summen des gestrigen Tages (00:00–23:59) + Zyklus-Durchschnitte. */
export function SleepKpiCard({ kpis, wide = false }: SleepKpiCardProps) {
  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
      <div className="flex items-center gap-2">
        <Moon className="size-5 shrink-0 text-primary" />
        <h3 className="font-semibold">
          {kpis.minutesSinceWake != null
            ? `Wach seit ${formatClockHM(kpis.minutesSinceWake)} Std`
            : 'Noch kein Schlaf erfasst'}
        </h3>
      </div>
      {kpis.lastEnd && (
        <p className="mt-1 text-sm text-muted-foreground">
          Zuletzt aufgewacht um {formatTime(kpis.lastEnd)} Uhr
        </p>
      )}

      <p className="mt-4 mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Letzte vollständige 24 Stunden · {formatDay(new Date(kpis.yesterdayStart))}
      </p>
      <dl className={cn('grid gap-3 text-sm', wide ? 'grid-cols-4' : 'grid-cols-2')}>
        <Kpi
          label="Schlaf gesamt"
          value={formatHours(kpis.totalHoursYesterday)}
          hint={`Tag ${formatHours(kpis.dayHoursYesterday)} · Nacht ${formatHours(kpis.nightHoursYesterday)}`}
        />
        <Kpi
          label="Tagesschläfchen"
          value={String(kpis.napsYesterday)}
          hint={
            kpis.avgNapMinYesterday != null
              ? `Ø ${formatHoursMinutes(kpis.avgNapMinYesterday)}`
              : undefined
          }
        />
        <Kpi
          label="Längster Schlaf"
          value={
            kpis.longestMinYesterday != null ? formatHoursMinutes(kpis.longestMinYesterday) : '–'
          }
        />
      </dl>

      <p className="mt-4 mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Schlafzyklus (Ø im gewählten Zeitraum)
      </p>
      <dl className={cn('grid gap-3 text-sm', wide ? 'grid-cols-4' : 'grid-cols-2')}>
        <Kpi label="Entspannt nach" value={formatMin(kpis.avgRelaxMin)} />
        <Kpi label="Tiefschlaf nach" value={formatMin(kpis.avgDeepMin)} />
        <Kpi label="REM-Beginn nach" value={formatMin(kpis.avgRemMin)} />
      </dl>
    </div>
  )
}
