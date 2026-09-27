import { Clock3, Scale } from 'lucide-react'
import { formatDecimal, formatGrams, formatHoursMinutes, formatMl, formatTime } from '@/lib/format'
import type { FeedingKpis } from '@/lib/feedingStats'

interface FeedingKpiCardProps {
  kpis: FeedingKpis
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

/** Überblick: letzte Mahlzeit live + Summen der letzten 24 Stunden. */
export function FeedingKpiCard({ kpis }: FeedingKpiCardProps) {
  const weightDelta =
    kpis.currentWeight != null && kpis.firstWeight != null
      ? kpis.currentWeight - kpis.firstWeight
      : null
  const weightDeltaPct =
    weightDelta != null && kpis.firstWeight ? (weightDelta / kpis.firstWeight) * 100 : null

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
      <div className="flex items-center gap-2">
        <Clock3 className="size-5 shrink-0 text-primary" />
        <h3 className="font-semibold">
          {kpis.minutesSinceLastStart != null
            ? `Letzte Mahlzeit vor ${formatHoursMinutes(kpis.minutesSinceLastStart)}`
            : 'Noch keine Mahlzeit erfasst'}
        </h3>
      </div>
      {kpis.lastStart && kpis.lastEnd && (
        <p className="mt-1 text-sm text-muted-foreground">
          {formatTime(kpis.lastStart)}–{formatTime(kpis.lastEnd)} Uhr (Abstand gerechnet ab Start)
        </p>
      )}

      <p className="mt-4 mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Letzte 24 Stunden
      </p>
      <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
        <Kpi
          label="Mahlzeiten"
          value={String(kpis.count24h)}
          hint={kpis.woken24h > 0 ? `davon ${kpis.woken24h}× geweckt` : undefined}
        />
        <Kpi
          label="Ø Abstand"
          value={kpis.avgIntervalMin24h != null ? formatHoursMinutes(kpis.avgIntervalMin24h) : '–'}
        />
        <Kpi label="Angelegt gesamt" value={formatHoursMinutes(kpis.latch24h)} />
        <Kpi label="Zugefüttert MM" value={formatMl(kpis.mm24h)} />
        <Kpi label="Zugefüttert EM" value={formatMl(kpis.em24h)} />
        <Kpi label="Windeln Urin / Stuhl" value={`${kpis.urine24h} / ${kpis.stool24h}`} />
      </dl>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
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
      </div>
    </div>
  )
}
