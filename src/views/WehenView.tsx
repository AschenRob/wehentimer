import { Activity, BarChart3 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ContractionTimer } from '@/components/ContractionTimer'
import { ContractionForm } from '@/components/ContractionForm'
import { ContractionList } from '@/components/ContractionList'
import { Rule511Card } from '@/components/Rule511Card'
import { IntervalDurationChart } from '@/components/charts/IntervalDurationChart'
import { TimelineChart } from '@/components/charts/TimelineChart'
import { OptionSelect } from '@/components/charts/OptionSelect'
import { useContractions } from '@/hooks/useContractions'
import { useNow } from '@/hooks/useNow'
import { oneOf, usePersistentState } from '@/hooks/usePersistentState'
import { evaluate511 } from '@/lib/rule511'
import {
  CHART_RANGE_LABELS,
  CHART_RANGE_OPTIONS,
  filterByChartRange,
  Y_AXIS_MAX_LABELS,
  Y_AXIS_MAX_OPTIONS,
  type ChartRange,
  type YAxisMax,
} from '@/lib/chartRange'
import type { WehenSettings } from '@/types/settings'

interface WehenViewProps {
  settings: WehenSettings
}

export function WehenView({ settings }: WehenViewProps) {
  const { contractions, isLoading, createContraction, updateContraction, deleteContraction } =
    useContractions()
  const now = useNow()
  const [chartRange, setChartRange] = usePersistentState<ChartRange>(
    'wehen.chartRange',
    'all',
    oneOf(CHART_RANGE_OPTIONS),
  )
  const [yAxisMax, setYAxisMax] = usePersistentState<YAxisMax>(
    'wehen.yAxisMax',
    'auto',
    oneOf(Y_AXIS_MAX_OPTIONS),
  )

  const thresholds = {
    intervalMinutes: settings.interval_minutes,
    durationMinutes: settings.duration_minutes,
    sustainedMinutes: settings.sustained_minutes,
    toleranceCount: settings.tolerance_count,
  }
  const result = evaluate511(contractions, thresholds, now)
  const streakIds = new Set(result.streakIds)
  const lastHourCount = contractions.filter(
    (c) => now.getTime() - new Date(c.start).getTime() <= 60 * 60_000,
  ).length
  const chartContractions = filterByChartRange(contractions, chartRange, now)

  return (
    <Tabs defaultValue="erfassung" className="flex-1">
      <TabsList className="w-full">
        <TabsTrigger value="erfassung" className="gap-1.5">
          <Activity className="size-4" /> Erfassung
        </TabsTrigger>
        <TabsTrigger value="auswertung" className="gap-1.5">
          <BarChart3 className="size-4" /> Auswertung
        </TabsTrigger>
      </TabsList>

      <TabsContent value="erfassung" className="flex flex-col gap-4">
        <ContractionTimer
          onSave={createContraction}
          onUpdateIntensity={(id, intensity) => updateContraction(id, { intensity })}
        />

        <div className="flex items-center justify-between">
          <h2 className="font-heading text-base font-medium">Erfasste Wehen</h2>
          <ContractionForm
            mode="create"
            onSubmit={createContraction}
            trigger={
              <Button
                size="icon"
                className="size-10 rounded-full"
                aria-label="Wehe manuell eintragen"
              >
                <span className="text-xl leading-none">+</span>
              </Button>
            }
          />
        </div>

        <ContractionList
          contractions={contractions}
          isLoading={isLoading}
          onUpdate={updateContraction}
          onDelete={deleteContraction}
        />
      </TabsContent>

      <TabsContent value="auswertung" className="flex flex-col gap-4">
        <Rule511Card
          result={result}
          sustainedMinutes={settings.sustained_minutes}
          lastHourCount={lastHourCount}
        />

        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">Zeitraum für alle Diagramme</span>
          <OptionSelect
            value={chartRange}
            onChange={setChartRange}
            options={CHART_RANGE_OPTIONS}
            labels={CHART_RANGE_LABELS}
            label="Zeitraum für alle Diagramme"
          />
        </div>

        <div className="rounded-xl border bg-card p-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-heading text-base font-medium">Verlauf: Abstand &amp; Dauer</h2>
            <OptionSelect
              value={yAxisMax}
              onChange={setYAxisMax}
              options={Y_AXIS_MAX_OPTIONS}
              labels={Y_AXIS_MAX_LABELS}
              label="Maximum der Y-Achse"
            />
          </div>
          <IntervalDurationChart
            contractions={chartContractions}
            thresholds={thresholds}
            yMax={yAxisMax === 'auto' ? null : Number(yAxisMax)}
          />
        </div>

        <div className="rounded-xl border bg-card p-4">
          <h2 className="mb-2 font-heading text-base font-medium">Zeitleiste</h2>
          <TimelineChart contractions={chartContractions} now={now} streakIds={streakIds} />
        </div>
      </TabsContent>
    </Tabs>
  )
}
