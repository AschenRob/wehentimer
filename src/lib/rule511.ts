import type { Contraction } from '@/types/contraction'

/**
 * Reine Berechnungslogik der geburtshilflichen 5-1-1-Faustregel:
 * Ab in die Klinik, wenn Wehen alle `intervalMinutes` (Start zu Start),
 * je mindestens `durationMinutes` andauernd, seit mindestens
 * `sustainedMinutes` durchgehend auftreten. Alle drei Werte sind über die
 * `settings`-Collection einstellbar (Standard: 5 / 1 / 60 Minuten).
 */
export interface Thresholds {
  intervalMinutes: number
  durationMinutes: number
  sustainedMinutes: number
}

export type PatternStatus = 'idle' | 'observing' | 'approaching' | 'critical'

export interface Rule511Result {
  status: PatternStatus
  /** Anzahl aufeinanderfolgender Wehen im aktuell laufenden Muster. */
  streakCount: number
  streakStartAt: string | null
  /** IDs der Wehen im aktuell laufenden Muster (für Hervorhebung in Charts). */
  streakIds: string[]
  /** Wie lange das Muster bereits durchgehalten hat. */
  streakDurationMin: number
  /** Fortschritt Richtung `sustainedMinutes`, 0..1. */
  progress: number
  avgIntervalMin: number | null
  avgDurationMin: number | null
  minutesSinceLast: number | null
}

const MS_PER_MIN = 60_000

function minutesBetween(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / MS_PER_MIN
}

const IDLE_RESULT: Rule511Result = {
  status: 'idle',
  streakCount: 0,
  streakStartAt: null,
  streakIds: [],
  streakDurationMin: 0,
  progress: 0,
  avgIntervalMin: null,
  avgDurationMin: null,
  minutesSinceLast: null,
}

export function evaluate511(
  contractions: Contraction[],
  thresholds: Thresholds,
  now: Date = new Date(),
): Rule511Result {
  if (contractions.length === 0) return IDLE_RESULT

  const sorted = [...contractions].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
  )
  const last = sorted[sorted.length - 1]
  const minutesSinceLast = minutesBetween(new Date(last.end), now)

  // Ist die letzte Wehe schon länger her als der Abstand-Schwellenwert,
  // gilt das Muster als gerade unterbrochen -> Bewertung bezieht sich immer
  // auf ein AKTUELL laufendes Muster, nicht auf einen historischen Verlauf.
  if (minutesSinceLast > thresholds.intervalMinutes) {
    return { ...IDLE_RESULT, minutesSinceLast }
  }

  // Streak von der jüngsten Wehe rückwärts aufbauen: jede Wehe muss selbst
  // lang genug sein UND nah genug an der direkt nachfolgenden liegen.
  const streak: Contraction[] = []
  for (let i = sorted.length - 1; i >= 0; i--) {
    const current = sorted[i]
    const durationOk = current.duration_sec / 60 >= thresholds.durationMinutes
    if (!durationOk) break
    if (streak.length > 0) {
      const gap = minutesBetween(new Date(current.start), new Date(streak[0].start))
      if (gap > thresholds.intervalMinutes) break
    }
    streak.unshift(current)
  }

  const streakCount = streak.length
  const streakStart = streak[0] ?? null
  const streakEnd = streak[streak.length - 1] ?? null
  const streakDurationMin =
    streakCount >= 2 && streakStart && streakEnd
      ? minutesBetween(new Date(streakStart.start), new Date(streakEnd.start))
      : 0

  const progress = Math.min(1, Math.max(0, streakDurationMin / thresholds.sustainedMinutes))

  let status: PatternStatus
  if (streakCount < 2) status = 'observing'
  else if (streakDurationMin < thresholds.sustainedMinutes) status = 'approaching'
  else status = 'critical'

  // Für die Durchschnittswerte auf die Streak zurückgreifen, sonst auf die
  // letzten (max. 6) Wehen, damit die KPI-Kacheln auch außerhalb eines
  // erkannten Musters eine sinnvolle Zahl zeigen.
  const sample = streakCount >= 2 ? streak : sorted.slice(-6)
  const avgDurationMin =
    sample.length > 0
      ? sample.reduce((sum, c) => sum + c.duration_sec / 60, 0) / sample.length
      : null
  const avgIntervalMin = averageInterval(sample)

  return {
    status,
    streakCount,
    streakStartAt: streakStart?.start ?? null,
    streakIds: streak.map((c) => c.id),
    streakDurationMin,
    progress,
    avgIntervalMin,
    avgDurationMin,
    minutesSinceLast,
  }
}

function averageInterval(items: Contraction[]): number | null {
  if (items.length < 2) return null
  let total = 0
  for (let i = 1; i < items.length; i++) {
    total += minutesBetween(new Date(items[i - 1].start), new Date(items[i].start))
  }
  return total / (items.length - 1)
}

export interface ChartPoint {
  index: number
  start: string
  durationMin: number
  intervalMin: number | null
}

/** Aufbereitung für die Verlaufsdiagramme: Dauer & Abstand je Wehe, chronologisch. */
export function buildChartSeries(contractions: Contraction[]): ChartPoint[] {
  const sorted = [...contractions].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
  )
  return sorted.map((c, i) => ({
    index: i,
    start: c.start,
    durationMin: c.duration_sec / 60,
    intervalMin: i === 0 ? null : minutesBetween(new Date(sorted[i - 1].start), new Date(c.start)),
  }))
}
