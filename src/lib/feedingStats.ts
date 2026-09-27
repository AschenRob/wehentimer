import type { Feeding } from '@/types/feeding'

const MS_PER_MIN = 60_000
const MS_PER_DAY = 86_400_000

function chronological(feedings: Feeding[]): Feeding[] {
  return [...feedings].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
}

export interface DailyStats {
  dayStart: number
  count: number
  latchMinutes: number
  mmMl: number
  emMl: number
  urine: number
  stool: number
  wokeSelf: number
  woken: number
}

/** Kennzahlen je Kalendertag (lokale Zeit), lückenlos vom ersten bis zum letzten Tag. */
export function buildDailyStats(feedings: Feeding[]): DailyStats[] {
  const sorted = chronological(feedings)
  if (sorted.length === 0) return []
  const byDay = new Map<string, DailyStats>()
  const first = startOfLocalDay(new Date(sorted[0].start))
  const last = startOfLocalDay(new Date(sorted[sorted.length - 1].start))
  // Über Datumsteile iterieren statt +24h, damit Zeitumstellungen keine Tage verschieben.
  for (let d = first; d <= last; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
    byDay.set(dayKey(d), {
      dayStart: d.getTime(),
      count: 0,
      latchMinutes: 0,
      mmMl: 0,
      emMl: 0,
      urine: 0,
      stool: 0,
      wokeSelf: 0,
      woken: 0,
    })
  }
  for (const f of sorted) {
    const entry = byDay.get(dayKey(new Date(f.start)))
    if (!entry) continue
    entry.count += 1
    entry.latchMinutes += f.latch_minutes
    entry.mmMl += f.supplement_mm_ml
    entry.emMl += f.supplement_em_ml
    if (f.urine) entry.urine += 1
    if (f.stool) entry.stool += 1
    if (f.woke_self) entry.wokeSelf += 1
    else entry.woken += 1
  }
  return [...byDay.values()]
}

export interface FeedingPoint {
  timestamp: number
  intervalHours: number | null
  latchMinutes: number
  mmMl: number
  emMl: number
  supplementMl: number
}

/** Ein Punkt je Mahlzeit, chronologisch; Abstand = Start zu Start. */
export function buildFeedingSeries(feedings: Feeding[]): FeedingPoint[] {
  const sorted = chronological(feedings)
  return sorted.map((f, i) => {
    const start = new Date(f.start).getTime()
    const prevStart = i > 0 ? new Date(sorted[i - 1].start).getTime() : null
    return {
      timestamp: start,
      intervalHours: prevStart != null ? (start - prevStart) / (60 * MS_PER_MIN) : null,
      latchMinutes: f.latch_minutes,
      mmMl: f.supplement_mm_ml,
      emMl: f.supplement_em_ml,
      supplementMl: f.supplement_mm_ml + f.supplement_em_ml,
    }
  })
}

export interface WeightPoint {
  timestamp: number
  weight: number
}

/**
 * Gewichtsverlauf. `entry`: nur Einträge, an denen sich das Gewicht geändert hat
 * (das Formular übernimmt sonst immer den letzten Wert); `day`: letzter Wert je Tag.
 */
export function buildWeightSeries(feedings: Feeding[], mode: 'entry' | 'day'): WeightPoint[] {
  const withWeight = chronological(feedings).filter((f) => f.weight_g > 0)
  if (mode === 'day') {
    const byDay = new Map<string, WeightPoint>()
    for (const f of withWeight) {
      const start = new Date(f.start)
      byDay.set(dayKey(start), { timestamp: startOfLocalDay(start).getTime(), weight: f.weight_g })
    }
    return [...byDay.values()]
  }
  const points: WeightPoint[] = []
  for (const f of withWeight) {
    if (points.length > 0 && points[points.length - 1].weight === f.weight_g) continue
    points.push({ timestamp: new Date(f.start).getTime(), weight: f.weight_g })
  }
  return points
}

export type HourMetric = 'count' | 'supplement' | 'latch'

export interface HourBin {
  label: string
  value: number
}

/** Verteilung über die Tageszeit (0–24 Uhr) in Blöcken von `binHours` Stunden. */
export function buildHourDistribution(
  feedings: Feeding[],
  binHours: number,
  metric: HourMetric,
): HourBin[] {
  const binCount = Math.ceil(24 / binHours)
  const bins = Array.from({ length: binCount }, (_, i) => ({
    label: `${i * binHours}–${Math.min(24, (i + 1) * binHours)}`,
    value: 0,
  }))
  for (const f of feedings) {
    const bin = bins[Math.floor(new Date(f.start).getHours() / binHours)]
    if (metric === 'count') bin.value += 1
    else if (metric === 'latch') bin.value += f.latch_minutes
    else bin.value += f.supplement_mm_ml + f.supplement_em_ml
  }
  return bins
}

export interface FeedingKpis {
  lastStart: string | null
  lastEnd: string | null
  minutesSinceLastStart: number | null
  count24h: number
  latch24h: number
  mm24h: number
  em24h: number
  urine24h: number
  stool24h: number
  woken24h: number
  avgIntervalMin24h: number | null
  currentWeight: number | null
  firstWeight: number | null
}

export function computeFeedingKpis(feedings: Feeding[], now: Date): FeedingKpis {
  const sorted = chronological(feedings)
  const last = sorted[sorted.length - 1] ?? null
  const cutoff = now.getTime() - MS_PER_DAY
  const recent = sorted.filter((f) => new Date(f.start).getTime() >= cutoff)
  const weights = sorted.filter((f) => f.weight_g > 0)

  let avgIntervalMin24h: number | null = null
  if (recent.length >= 2) {
    const span =
      new Date(recent[recent.length - 1].start).getTime() - new Date(recent[0].start).getTime()
    avgIntervalMin24h = span / MS_PER_MIN / (recent.length - 1)
  }

  const sum = (pick: (f: Feeding) => number) => recent.reduce((total, f) => total + pick(f), 0)

  return {
    lastStart: last?.start ?? null,
    lastEnd: last?.end ?? null,
    minutesSinceLastStart: last
      ? (now.getTime() - new Date(last.start).getTime()) / MS_PER_MIN
      : null,
    count24h: recent.length,
    latch24h: sum((f) => f.latch_minutes),
    mm24h: sum((f) => f.supplement_mm_ml),
    em24h: sum((f) => f.supplement_em_ml),
    urine24h: sum((f) => (f.urine ? 1 : 0)),
    stool24h: sum((f) => (f.stool ? 1 : 0)),
    woken24h: sum((f) => (f.woke_self ? 0 : 1)),
    avgIntervalMin24h,
    currentWeight: weights[weights.length - 1]?.weight_g ?? null,
    firstWeight: weights[0]?.weight_g ?? null,
  }
}

export interface RhythmDay {
  dayStart: number
  items: { id: string; startMin: number; endMin: number; feeding: Feeding }[]
}

/** Mahlzeiten je Kalendertag als Minuten seit Mitternacht (über Mitternacht wird am Tagesende abgeschnitten). */
export function buildRhythmDays(feedings: Feeding[]): RhythmDay[] {
  const days = new Map<string, RhythmDay>()
  for (const f of chronological(feedings)) {
    const start = new Date(f.start)
    const dayStart = startOfLocalDay(start)
    const key = dayKey(start)
    if (!days.has(key)) days.set(key, { dayStart: dayStart.getTime(), items: [] })
    const startMin = (start.getTime() - dayStart.getTime()) / MS_PER_MIN
    const endMin = Math.min(24 * 60, (new Date(f.end).getTime() - dayStart.getTime()) / MS_PER_MIN)
    days
      .get(key)!
      .items.push({ id: f.id, startMin, endMin: Math.max(endMin, startMin), feeding: f })
  }
  return [...days.values()]
}
