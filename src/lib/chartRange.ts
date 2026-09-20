import type { Contraction } from '@/types/contraction'

/** Zeitraum-Filter für die Auswertungs-Charts (unabhängig von der 5-1-1-Auswertung). */
export type ChartRange = 'all' | '3d' | '24h' | '3h' | '1h'

export const CHART_RANGE_OPTIONS: ChartRange[] = ['all', '3d', '24h', '3h', '1h']

export const CHART_RANGE_LABELS: Record<ChartRange, string> = {
  all: 'Gesamt',
  '3d': 'Letzte 3 Tage',
  '24h': 'Letzte 24 Std.',
  '3h': 'Letzte 3 Std.',
  '1h': 'Letzte Std.',
}

const RANGE_HOURS: Record<Exclude<ChartRange, 'all'>, number> = {
  '3d': 72,
  '24h': 24,
  '3h': 3,
  '1h': 1,
}

export function filterByChartRange(
  contractions: Contraction[],
  range: ChartRange,
  now: Date,
): Contraction[] {
  if (range === 'all') return contractions
  const cutoff = now.getTime() - RANGE_HOURS[range] * 60 * 60_000
  return contractions.filter((c) => new Date(c.start).getTime() >= cutoff)
}
