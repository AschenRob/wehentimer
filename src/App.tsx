import { useState } from 'react'
import { Activity, BarChart3 } from 'lucide-react'
import { Toaster } from '@/components/ui/sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ContractionTimer } from '@/components/ContractionTimer'
import { ContractionForm } from '@/components/ContractionForm'
import { ContractionList } from '@/components/ContractionList'
import { SettingsDialog } from '@/components/SettingsDialog'
import { Rule511Card } from '@/components/Rule511Card'
import { IntervalDurationChart } from '@/components/charts/IntervalDurationChart'
import { TimelineChart } from '@/components/charts/TimelineChart'
import { ChartRangeSelect } from '@/components/charts/ChartRangeSelect'
import { useContractions } from '@/hooks/useContractions'
import { useSettings } from '@/hooks/useSettings'
import { useNow } from '@/hooks/useNow'
import { evaluate511 } from '@/lib/rule511'
import { filterByChartRange, type ChartRange } from '@/lib/chartRange'

function App() {
  const { contractions, isLoading, createContraction, updateContraction, deleteContraction } =
    useContractions()
  const { settings, updateThresholds } = useSettings()
  const now = useNow()
  const [intervalChartRange, setIntervalChartRange] = useState<ChartRange>('all')
  const [timelineChartRange, setTimelineChartRange] = useState<ChartRange>('all')

  const thresholds = {
    intervalMinutes: settings.interval_minutes,
    durationMinutes: settings.duration_minutes,
    sustainedMinutes: settings.sustained_minutes,
  }
  const result = evaluate511(contractions, thresholds, now)
  const streakIds = new Set(result.streakIds)
  const lastHourCount = contractions.filter(
    (c) => now.getTime() - new Date(c.start).getTime() <= 60 * 60_000,
  ).length

  return (
    <div
      className="mx-auto flex min-h-svh max-w-2xl flex-col gap-4 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold">Wehentimer</h1>
          <p className="text-xs text-muted-foreground">
            auf dem Weg zur Geburt unseres kleinen Krümelchens
          </p>
        </div>
        <SettingsDialog settings={settings} onSave={updateThresholds} />
      </header>

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
                <Button size="icon" className="size-10 rounded-full" aria-label="Wehe manuell eintragen">
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

          <div className="rounded-xl border bg-card p-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-heading text-base font-medium">Verlauf: Abstand &amp; Dauer</h2>
              <ChartRangeSelect
                value={intervalChartRange}
                onChange={setIntervalChartRange}
                label="Zeitraum für Verlaufsdiagramm"
              />
            </div>
            <IntervalDurationChart
              contractions={filterByChartRange(contractions, intervalChartRange, now)}
              thresholds={thresholds}
            />
          </div>

          <div className="rounded-xl border bg-card p-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-heading text-base font-medium">Zeitleiste</h2>
              <ChartRangeSelect
                value={timelineChartRange}
                onChange={setTimelineChartRange}
                label="Zeitraum für Zeitleiste"
              />
            </div>
            <TimelineChart
              contractions={filterByChartRange(contractions, timelineChartRange, now)}
              now={now}
              streakIds={streakIds}
            />
          </div>
        </TabsContent>
      </Tabs>

      <Toaster position="top-center" />
    </div>
  )
}

export default App
