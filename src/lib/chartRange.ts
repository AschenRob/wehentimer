/** Zeitraum-Filter für die Auswertungs-Charts (unabhängig von der 5-1-1-Auswertung). */
export type ChartRange = 'all' | '7d' | '3d' | '24h' | '3h' | '1h'

export const CHART_RANGE_OPTIONS = ['all', '3d', '24h', '3h', '1h'] as const satisfies ChartRange[]

export const FEEDING_RANGE_OPTIONS = ['all', '7d', '3d', '24h'] as const satisfies ChartRange[]

export const CHART_RANGE_LABELS: Record<ChartRange, string> = {
  all: 'Gesamt',
  '7d': 'Letzte 7 Tage',
  '3d': 'Letzte 3 Tage',
  '24h': 'Letzte 24 Std.',
  '3h': 'Letzte 3 Std.',
  '1h': 'Letzte Std.',
}

const RANGE_HOURS: Record<Exclude<ChartRange, 'all'>, number> = {
  '7d': 168,
  '3d': 72,
  '24h': 24,
  '3h': 3,
  '1h': 1,
}

export function filterByChartRange<T extends { start: string }>(
  items: T[],
  range: ChartRange,
  now: Date,
): T[] {
  if (range === 'all') return items
  const cutoff = now.getTime() - RANGE_HOURS[range] * 60 * 60_000
  return items.filter((item) => new Date(item.start).getTime() >= cutoff)
}

/** Manuelles Maximum der Y-Achse im Wehen-Verlaufsdiagramm (Minuten). */
export type YAxisMax = 'auto' | '10' | '15' | '20' | '30' | '60'

export const Y_AXIS_MAX_OPTIONS = ['auto', '10', '15', '20', '30', '60'] as const satisfies YAxisMax[]

export const Y_AXIS_MAX_LABELS: Record<YAxisMax, string> = {
  auto: 'Y-Max: Auto',
  '10': 'Y-Max: 10 Min',
  '15': 'Y-Max: 15 Min',
  '20': 'Y-Max: 20 Min',
  '30': 'Y-Max: 30 Min',
  '60': 'Y-Max: 60 Min',
}
