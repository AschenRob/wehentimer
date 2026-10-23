/** Zeitraum-Filter für die Auswertungs-Charts (unabhängig von der 5-1-1-Auswertung). */
export type ChartRange = 'all' | '7d' | '3d' | 'yesterday' | '24h' | '3h' | '1h'

export const CHART_RANGE_OPTIONS = ['all', '3d', '24h', '3h', '1h'] as const satisfies ChartRange[]

export const FEEDING_RANGE_OPTIONS = [
  'all',
  '7d',
  '3d',
  'yesterday',
  '24h',
] as const satisfies ChartRange[]

export const CHART_RANGE_LABELS: Record<ChartRange, string> = {
  all: 'Gesamt',
  '7d': 'Letzte 7 Tage',
  '3d': 'Letzte 3 Tage',
  yesterday: 'Ganzer letzter Tag',
  '24h': 'Letzte 24 Std.',
  '3h': 'Letzte 3 Std.',
  '1h': 'Letzte Std.',
}

const RANGE_HOURS: Record<Exclude<ChartRange, 'all' | 'yesterday'>, number> = {
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
  if (range === 'yesterday') {
    // Kalendertag gestern 00:00 bis 23:59 (lokal), nicht rollierend.
    const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).getTime()
    const to = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    return items.filter((item) => {
      const start = new Date(item.start).getTime()
      return start >= from && start < to
    })
  }
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

/** Manuelles Maximum der Y-Achse im Still-Verlauf "Abstand (Std)". */
export type IntervalYMax = 'auto' | '4' | '5' | '6' | '8' | '12'

export const INTERVAL_Y_MAX_OPTIONS = [
  'auto',
  '4',
  '5',
  '6',
  '8',
  '12',
] as const satisfies IntervalYMax[]

export const INTERVAL_Y_MAX_LABELS: Record<IntervalYMax, string> = {
  auto: 'Y-Max: Auto',
  '4': 'Y-Max: 4 Std',
  '5': 'Y-Max: 5 Std',
  '6': 'Y-Max: 6 Std',
  '8': 'Y-Max: 8 Std',
  '12': 'Y-Max: 12 Std',
}

/** Y-Skala im Gewichtsverlauf: Auto inkl. Normbereich, nur Gewichte, oder fester Bereich in kg. */
export type WeightYScale = 'auto' | 'data' | '2-5' | '2-8' | '2-12' | '0-15'

export const WEIGHT_Y_SCALE_OPTIONS = [
  'auto',
  'data',
  '2-5',
  '2-8',
  '2-12',
  '0-15',
] as const satisfies WeightYScale[]

export const WEIGHT_Y_SCALE_LABELS: Record<WeightYScale, string> = {
  auto: 'Y: Auto (mit Normbereich)',
  data: 'Y: Nur Gewichte',
  '2-5': 'Y: 2–5 kg',
  '2-8': 'Y: 2–8 kg',
  '2-12': 'Y: 2–12 kg',
  '0-15': 'Y: 0–15 kg',
}

/** Y-Skala im Größenverlauf: Auto inkl. Normbereich, nur Größen, oder fester Bereich in cm. */
export type HeightYScale = 'auto' | 'data' | '45-65' | '45-80' | '45-100' | '40-100'

export const HEIGHT_Y_SCALE_OPTIONS = [
  'auto',
  'data',
  '45-65',
  '45-80',
  '45-100',
  '40-100',
] as const satisfies HeightYScale[]

export const HEIGHT_Y_SCALE_LABELS: Record<HeightYScale, string> = {
  auto: 'Y: Auto (mit Normbereich)',
  data: 'Y: Nur Größen',
  '45-65': 'Y: 45–65 cm',
  '45-80': 'Y: 45–80 cm',
  '45-100': 'Y: 45–100 cm',
  '40-100': 'Y: 40–100 cm',
}
