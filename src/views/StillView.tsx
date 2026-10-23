import { BarChart3, Milk } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FeedingTimer } from '@/components/FeedingTimer'
import { AddEntryButton } from '@/components/AddEntryButton'
import { FeedingList } from '@/components/FeedingList'
import { OptionSelect } from '@/components/charts/OptionSelect'
import { FeedingKpiCard } from '@/components/still/FeedingKpiCard'
import { DailyChart } from '@/components/still/DailyChart'
import { FeedingTrendChart } from '@/components/still/FeedingTrendChart'
import { WeightChart } from '@/components/still/WeightChart'
import { HeightChart } from '@/components/still/HeightChart'
import { DayRhythmChart } from '@/components/still/DayRhythmChart'
import { HourDistributionChart } from '@/components/still/HourDistributionChart'
import { useFeedings } from '@/hooks/useFeedings'
import { useNow } from '@/hooks/useNow'
import { oneOf, usePersistentState } from '@/hooks/usePersistentState'
import {
  CHART_RANGE_LABELS,
  FEEDING_RANGE_OPTIONS,
  filterByChartRange,
  type ChartRange,
} from '@/lib/chartRange'
import { computeFeedingKpis } from '@/lib/feedingStats'
import { cn } from '@/lib/utils'
import type { Baby } from '@/types/baby'
import { isMeal, latestHeight, latestWeight } from '@/types/feeding'

interface StillViewProps {
  baby: Baby
  /** Desktop/TV: Charts zweispaltig, KPI-Karte breiter. */
  wide: boolean
  targetIntervalHours: number
}

export function StillView({ baby, wide, targetIntervalHours }: StillViewProps) {
  const babyId = baby.id
  const { feedings, isLoading, createFeeding, updateFeeding, deleteFeeding } = useFeedings(babyId)
  const now = useNow()
  const [chartRange, setChartRange] = usePersistentState<ChartRange>(
    'still.chartRange',
    'all',
    oneOf(FEEDING_RANGE_OPTIONS),
  )
  const lastWeight = latestWeight(feedings)
  const lastHeight = latestHeight(feedings)
  const chartFeedings = filterByChartRange(feedings, chartRange, now)
  // Reine Größe/Gewicht-Einträge dürfen die Mahlzeiten-Charts nicht verfälschen.
  const chartMeals = chartFeedings.filter(isMeal)
  const lastMealEnd = feedings.find(isMeal)?.end ?? null

  return (
    <Tabs defaultValue="erfassung" className="flex-1">
      <TabsList className="w-full">
        <TabsTrigger value="erfassung" className="gap-1.5">
          <Milk className="size-4" /> Erfassung
        </TabsTrigger>
        <TabsTrigger value="auswertung" className="gap-1.5">
          <BarChart3 className="size-4" /> Auswertung
        </TabsTrigger>
      </TabsList>

      <TabsContent value="erfassung" className="flex flex-col gap-4">
        <FeedingTimer
          babyId={babyId}
          lastWeight={lastWeight}
          lastHeight={lastHeight}
          lastEnd={lastMealEnd}
          onSave={createFeeding}
        />

        <div className="flex items-center justify-between">
          <h2 className="font-heading text-base font-medium">Erfasste Einträge</h2>
          <AddEntryButton
            lastWeight={lastWeight}
            lastHeight={lastHeight}
            onSubmit={createFeeding}
          />
        </div>

        <FeedingList
          feedings={feedings}
          isLoading={isLoading}
          lastWeight={lastWeight}
          lastHeight={lastHeight}
          onUpdate={updateFeeding}
          onDelete={deleteFeeding}
        />
      </TabsContent>

      <TabsContent value="auswertung" className="flex flex-col gap-4">
        <FeedingKpiCard kpis={computeFeedingKpis(feedings, now)} wide={wide} />

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
          <DayRhythmChart feedings={chartMeals} now={now} />
          <DailyChart feedings={chartMeals} />
          <FeedingTrendChart feedings={chartMeals} targetIntervalHours={targetIntervalHours} />
          <HourDistributionChart feedings={chartMeals} />
          <WeightChart feedings={chartFeedings} baby={baby} />
          <HeightChart feedings={chartFeedings} baby={baby} />
        </div>
      </TabsContent>
    </Tabs>
  )
}
