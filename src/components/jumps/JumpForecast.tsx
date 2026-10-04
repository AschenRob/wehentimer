import { useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ChartCard } from '@/components/charts/ChartCard'
import { JumpTimeline } from '@/components/jumps/JumpTimeline'
import { cn } from '@/lib/utils'
import { formatDate, formatWeeksDays } from '@/lib/format'
import {
  STATE_COLORS,
  jumpOutlook,
  jumpState,
  jumpWindows,
  weeksSinceDue,
  type JumpState,
} from '@/lib/jumps'

const STATE_LABELS: Record<JumpState, string> = {
  past: 'vorbei',
  running: 'läuft',
  upcoming: 'kommt noch',
}

function formatWeek(weeks: number): string {
  return String(weeks).replace('.', ',')
}

function DetailList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</h4>
      <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

interface JumpForecastProps {
  /** Errechneter Termin; null = noch nicht eingetragen. */
  due: Date | null
  now: Date
  wide: boolean
}

/** Tab "Prognose": Zeitleiste aller zehn Sprünge + antippbare Detailkarten. */
export function JumpForecast({ due, now, wide }: JumpForecastProps) {
  const windows = due ? jumpWindows(due) : null
  const outlook = due ? jumpOutlook(due, now) : null
  const weeksNow = due ? weeksSinceDue(due, now) : null
  const [selected, setSelected] = useState<number | null>(null)
  const effectiveSelected = selected ?? outlook?.window.jump.number ?? 1

  function select(jump: number) {
    setSelected(jump)
    document
      .getElementById(`jump-card-${jump}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  // JUMPS-Reihenfolge, jeweils mit Zeitfenster falls ET bekannt.
  const entries = (windows ?? jumpWindows(new Date(0))).map((w) => ({
    window: w,
    state: due ? jumpState(w, now) : null,
  }))

  return (
    <div className="flex flex-col gap-4">
      {!due && (
        <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
          Trage in den Einstellungen unter „Babys“ den errechneten Termin (ET) ein, um Datumsangaben
          und den Countdown zu sehen. Die Wochenangaben unten zählen ab ET.
        </p>
      )}
      {due && weeksNow !== null && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-5 shrink-0 text-primary" />
            <h3 className="font-semibold">
              {outlook
                ? outlook.state === 'running'
                  ? `Sprung ${outlook.window.jump.number} läuft`
                  : `Nächster Sprung in ${formatWeeksDays(outlook.days)}`
                : 'Alle zehn Sprünge liegen hinter uns'}
            </h3>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {outlook &&
              (outlook.state === 'running'
                ? `${outlook.window.jump.name} – stürmische Phase voraussichtlich noch ${formatWeeksDays(outlook.days)}. `
                : `Sprung ${outlook.window.jump.number}: ${outlook.window.jump.name}. `)}
            Alter ab ET: {formatWeeksDays(Math.max(0, Math.round(weeksNow * 7)))}.
          </p>
        </div>
      )}

      <ChartCard title="Zeitleiste der Sprünge">
        <JumpTimeline
          due={due}
          windows={windows}
          now={now}
          weeksNow={weeksNow}
          selected={effectiveSelected}
          onSelect={select}
        />
      </ChartCard>

      <div className={cn('grid gap-3 *:min-w-0', wide && 'grid-cols-2')}>
        {entries.map(({ window, state }) => {
          const { jump } = window
          const isSelected = effectiveSelected === jump.number
          return (
            <div
              key={jump.number}
              id={`jump-card-${jump.number}`}
              className={cn(
                'rounded-xl border bg-card p-3 transition-colors',
                isSelected && 'border-primary',
              )}
            >
              <button
                type="button"
                onClick={() => setSelected(isSelected ? 0 : jump.number)}
                aria-expanded={isSelected}
                className="flex w-full items-start justify-between gap-3 text-left"
              >
                <div className="min-w-0">
                  <div className="font-medium">
                    Sprung {jump.number}: {jump.name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {due
                      ? `${formatDate(window.start)} – ${formatDate(window.end)}`
                      : `Woche ${formatWeek(jump.stormStart)}–${formatWeek(jump.stormEnd)}`}
                  </div>
                </div>
                {state && (
                  <Badge
                    style={{
                      backgroundColor: STATE_COLORS[state],
                      color: state === 'upcoming' ? '#1f1f1f' : '#fff',
                    }}
                  >
                    {STATE_LABELS[state]}
                  </Badge>
                )}
              </button>

              {isSelected && (
                <div className="mt-3 flex flex-col gap-3 border-t pt-3">
                  <p className="text-sm">{jump.summary}</p>
                  <p className="text-xs text-muted-foreground">
                    Höhepunkt um Woche {jump.week}
                    {due && <> (ca. {formatDate(window.peak)})</>}. Zeitangaben ab ET, nur
                    Richtwerte – jedes Kind ist anders.
                  </p>
                  <DetailList title="Das lernt das Baby" items={jump.skills} />
                  <DetailList title="Typische Anzeichen" items={jump.signs} />
                  <DetailList title="Das hilft" items={jump.tips} />
                  <div>
                    <h4 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      Auswirkung auf den Schlaf
                    </h4>
                    <p className="mt-1 text-sm">{jump.sleep}</p>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
