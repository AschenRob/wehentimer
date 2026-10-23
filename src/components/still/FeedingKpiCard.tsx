import { Clock3, Ruler, Scale } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  formatCm,
  formatDay,
  formatDecimal,
  formatGrams,
  formatHoursMinutes,
  formatTime,
} from '@/lib/format'
import type { FeedingKpis } from '@/lib/feedingStats'
import { BREAST_LABELS } from '@/types/feeding'

interface FeedingKpiCardProps {
  kpis: FeedingKpis
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

/** Überblick: letzte Mahlzeit live + Summen des gestrigen Tages (00:00–23:59). */
export function FeedingKpiCard({ kpis, wide = false }: FeedingKpiCardProps) {
  const weightDelta =
    kpis.currentWeight != null && kpis.firstWeight != null
      ? kpis.currentWeight - kpis.firstWeight
      : null
  const weightDeltaPct =
    weightDelta != null && kpis.firstWeight ? (weightDelta / kpis.firstWeight) * 100 : null
  const heightDelta =
    kpis.currentHeight != null && kpis.firstHeight != null
      ? kpis.currentHeight - kpis.firstHeight
      : null

  const weight = (
    <div
      className={cn(
        'flex flex-wrap items-center gap-x-4 gap-y-1 text-sm',
        wide ? 'justify-end text-right' : 'mt-4',
      )}
    >
      <span className="flex items-center gap-1.5">
        <Scale className="size-4 text-primary" />
        {kpis.currentWeight != null ? formatGrams(kpis.currentWeight) : 'Kein Gewicht erfasst'}
      </span>
      {weightDelta != null && weightDelta !== 0 && weightDeltaPct != null && (
        <span className="text-muted-foreground">
          {weightDelta > 0 ? '+' : '−'}
          {formatGrams(Math.abs(weightDelta))} ({weightDelta > 0 ? '+' : '−'}
          {formatDecimal(Math.abs(weightDeltaPct))} %) seit erstem Eintrag
        </span>
      )}
      {kpis.currentHeight != null && (
        <span className="flex items-center gap-1.5">
          <Ruler className="size-4 text-primary" />
          {formatCm(kpis.currentHeight)}
          {heightDelta != null && heightDelta > 0 && (
            <span className="text-muted-foreground">
              (+{formatDecimal(heightDelta)} cm seit erstem Eintrag)
            </span>
          )}
        </span>
      )}
    </div>
  )

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <Clock3 className="size-5 shrink-0 text-primary" />
          <h3 className="font-semibold">
            {kpis.minutesSinceLastEnd != null
              ? `Letzte Mahlzeit vor ${formatHoursMinutes(kpis.minutesSinceLastEnd)}`
              : 'Noch keine Mahlzeit erfasst'}
          </h3>
        </div>
        {wide && weight}
      </div>
      {kpis.lastStart && kpis.lastEnd && (
        <p className="mt-1 text-sm text-muted-foreground">
          {formatTime(kpis.lastStart)}–{formatTime(kpis.lastEnd)} Uhr (Abstand gerechnet ab Ende)
          {kpis.lastBreast && <> · zuletzt Brust {BREAST_LABELS[kpis.lastBreast]}</>}
        </p>
      )}

      <p className="mt-4 mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Letzte vollständige 24 Stunden · {formatDay(new Date(kpis.yesterdayStart))}
      </p>
      <dl className={cn('grid gap-3 text-sm', wide ? 'grid-cols-4' : 'grid-cols-2')}>
        <Kpi
          label="Mahlzeiten"
          value={String(kpis.countYesterday)}
          hint={kpis.wokenYesterday > 0 ? `davon ${kpis.wokenYesterday}× geweckt` : undefined}
        />
        <Kpi
          label="Ø Abstand"
          value={
            kpis.avgIntervalMinYesterday != null
              ? formatHoursMinutes(kpis.avgIntervalMinYesterday)
              : '–'
          }
        />
        <Kpi label="Angelegt gesamt" value={formatHoursMinutes(kpis.latchYesterday)} />
        <Kpi label="Windeln Pipi / Kaka" value={`${kpis.urineYesterday} / ${kpis.stoolYesterday}`} />
      </dl>

      {!wide && weight}
    </div>
  )
}
