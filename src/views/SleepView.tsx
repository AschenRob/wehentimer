import { BarChart3, CalendarDays, Moon } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { OptionSelect } from '@/components/charts/OptionSelect'
import { JumpForecast } from '@/components/jumps/JumpForecast'
import { SleepForm } from '@/components/SleepForm'
import { SleepList } from '@/components/SleepList'
import { SleepTimer } from '@/components/SleepTimer'
import { SleepAfterRemCard } from '@/components/sleep/SleepAfterRemCard'
import { SleepCycleChart } from '@/components/sleep/SleepCycleChart'
import { SleepDailyChart } from '@/components/sleep/SleepDailyChart'
import { SleepKpiCard } from '@/components/sleep/SleepKpiCard'
import { SleepRhythmChart } from '@/components/sleep/SleepRhythmChart'
import { useNow } from '@/hooks/useNow'
import { oneOf, usePersistentState } from '@/hooks/usePersistentState'
import { useSleeps } from '@/hooks/useSleeps'
import {
  CHART_RANGE_LABELS,
  FEEDING_RANGE_OPTIONS,
  filterByChartRange,
  type ChartRange,
} from '@/lib/chartRange'
import { jumpWindows } from '@/lib/jumps'
import { computeSleepKpis } from '@/lib/sleepStats'
import { cn } from '@/lib/utils'
import { parseBabyDate, type Baby } from '@/types/baby'

interface SleepViewProps {
  baby: Baby
  /** Desktop/TV: Charts zweispaltig, KPI-Karte breiter. */
  wide: boolean
}

export function SleepView({ baby, wide }: SleepViewProps) {
  const { sleeps, isLoading, createSleep, updateSleep, deleteSleep } = useSleeps(baby.id)
  const now = useNow()
  const [chartRange, setChartRange] = usePersistentState<ChartRange>(
    'sleep.chartRange',
    'all',
    oneOf(FEEDING_RANGE_OPTIONS),
  )
  const due = parseBabyDate(baby.due_date)
  const windows = due ? jumpWindows(due) : null
  const chartSleeps = filterByChartRange(sleeps, chartRange, now)

  return (
    <Tabs defaultValue="prognose" className="flex-1">
      <TabsList className="w-full">
        <TabsTrigger value="prognose" className="gap-1.5">
          <CalendarDays className="size-4" /> Prognose
        </TabsTrigger>
        <TabsTrigger value="erfassung" className="gap-1.5">
          <Moon className="size-4" /> Erfassung
        </TabsTrigger>
        <TabsTrigger value="statistik" className="gap-1.5">
          <BarChart3 className="size-4" /> Statistik
        </TabsTrigger>
      </TabsList>

      <TabsContent value="prognose">
        <JumpForecast due={due} now={now} wide={wide} />
      </TabsContent>

      <TabsContent value="erfassung" className="flex flex-col gap-4">
        <SleepTimer babyId={baby.id} onSave={createSleep} />

        <div className="flex items-center justify-between">
          <h2 className="font-heading text-base font-medium">Erfasster Schlaf</h2>
          <SleepForm
            mode="create"
            onSubmit={createSleep}
            trigger={
              <Button size="icon" className="size-10 rounded-full" aria-label="Schlaf manuell eintragen">
                <span className="text-xl leading-none">+</span>
              </Button>
            }
          />
        </div>

        <SleepList
          sleeps={sleeps}
          isLoading={isLoading}
          onUpdate={updateSleep}
          onDelete={deleteSleep}
        />
      </TabsContent>

      <TabsContent value="statistik" className="flex flex-col gap-4">
        <SleepKpiCard kpis={computeSleepKpis(chartSleeps, sleeps, now)} wide={wide} />

        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">Zeitraum für alle Diagramme</span>
          <OptionSelect
            value={chartRange}
            onChange={setChartRange}
            options={FEEDING_RANGE_OPTIONS}
            labels={CHART_RANGE_LABELS}
            label="Zeitraum für alle Diagramme"
          />
        </div>

        <div className={cn('grid gap-4 *:min-w-0', wide && 'grid-cols-2')}>
          <SleepRhythmChart sleeps={chartSleeps} now={now} />
          <SleepDailyChart sleeps={chartSleeps} windows={windows} />
          <SleepCycleChart sleeps={chartSleeps} />
          <SleepAfterRemCard sleeps={chartSleeps} />
        </div>
      </TabsContent>
    </Tabs>
  )
}
