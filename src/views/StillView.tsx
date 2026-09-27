import { BarChart3, Milk } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { FeedingTimer } from '@/components/FeedingTimer'
import { FeedingForm } from '@/components/FeedingForm'
import { FeedingList } from '@/components/FeedingList'
import { OptionSelect } from '@/components/charts/OptionSelect'
import { FeedingKpiCard } from '@/components/still/FeedingKpiCard'
import { DailyChart } from '@/components/still/DailyChart'
import { FeedingTrendChart } from '@/components/still/FeedingTrendChart'
import { WeightChart } from '@/components/still/WeightChart'
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
import { latestWeight } from '@/types/feeding'

export function StillView() {
  const { feedings, isLoading, createFeeding, updateFeeding, deleteFeeding } = useFeedings()
  const now = useNow()
  const [chartRange, setChartRange] = usePersistentState<ChartRange>(
    'still.chartRange',
    'all',
    oneOf(FEEDING_RANGE_OPTIONS),
  )
  const lastWeight = latestWeight(feedings)
  const chartFeedings = filterByChartRange(feedings, chartRange, now)

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
        <FeedingTimer lastWeight={lastWeight} onSave={createFeeding} />

        <div className="flex items-center justify-between">
          <h2 className="font-heading text-base font-medium">Erfasste Mahlzeiten</h2>
          <FeedingForm
            mode="create"
            lastWeight={lastWeight}
            onSubmit={createFeeding}
            trigger={
              <Button
                size="icon"
                className="size-10 rounded-full"
                aria-label="Mahlzeit manuell eintragen"
              >
                <span className="text-xl leading-none">+</span>
              </Button>
            }
          />
        </div>

        <FeedingList
          feedings={feedings}
          isLoading={isLoading}
          lastWeight={lastWeight}
          onUpdate={updateFeeding}
          onDelete={deleteFeeding}
        />
      </TabsContent>

      <TabsContent value="auswertung" className="flex flex-col gap-4">
        <FeedingKpiCard kpis={computeFeedingKpis(feedings, now)} />

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

        <DayRhythmChart feedings={chartFeedings} now={now} />
        <DailyChart feedings={chartFeedings} />
        <FeedingTrendChart feedings={chartFeedings} />
        <HourDistributionChart feedings={chartFeedings} />
        <WeightChart feedings={chartFeedings} />
      </TabsContent>
    </Tabs>
  )
}
