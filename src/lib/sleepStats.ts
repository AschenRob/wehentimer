import { isNightSleep, sleepMinutes, type Sleep } from '@/types/sleep'

const DAY_MIN = 24 * 60

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function nextDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
}

export interface SleepSegment {
  sleep: Sleep
  dayStart: number
  /** Minuten seit 00:00 des Tages. */
  startMin: number
  endMin: number
}

/** Teilt jeden Schlaf an lokalen Mitternächten, sodass jedes Stück genau einem Tag gehört. */
export function splitByDay(sleeps: Sleep[]): SleepSegment[] {
  const segments: SleepSegment[] = []
  for (const sleep of sleeps) {
    const start = new Date(sleep.start)
    const end = new Date(sleep.end)
    if (end <= start) continue
    for (let day = startOfLocalDay(start); day < end; day = nextDay(day)) {
      const dayEnd = nextDay(day)
      const from = Math.max(start.getTime(), day.getTime())
      const to = Math.min(end.getTime(), dayEnd.getTime())
      if (to <= from) continue
      segments.push({
        sleep,
        dayStart: day.getTime(),
        startMin: (from - day.getTime()) / 60_000,
        endMin: Math.min(DAY_MIN, (to - day.getTime()) / 60_000),
      })
    }
  }
  return segments
}

export interface SleepRhythmDay {
  dayStart: number
  segments: SleepSegment[]
}

/** Lückenlos vom ersten bis zum letzten Tag, älteste zuerst. */
export function buildSleepRhythmDays(sleeps: Sleep[]): SleepRhythmDay[] {
  const segments = splitByDay(sleeps)
  if (segments.length === 0) return []
  const byDay = new Map<number, SleepSegment[]>()
  for (const s of segments) byDay.set(s.dayStart, [...(byDay.get(s.dayStart) ?? []), s])
  const days = [...byDay.keys()].sort((a, b) => a - b)
  const result: SleepRhythmDay[] = []
  for (let d = new Date(days[0]); d.getTime() <= days[days.length - 1]; d = nextDay(d)) {
    result.push({ dayStart: d.getTime(), segments: byDay.get(d.getTime()) ?? [] })
  }
  return result
}

export interface SleepDailyStats {
  dayStart: number
  dayHours: number
  nightHours: number
  totalHours: number
  naps: number
}

/** Schlafstunden je Kalendertag (Tag-/Nachtschlaf nach Einschlafzeit) und Anzahl Tag-Schläfchen. */
export function buildSleepDaily(sleeps: Sleep[]): SleepDailyStats[] {
  return buildSleepRhythmDays(sleeps).map((day) => {
    let dayMin = 0
    let nightMin = 0
    const napIds = new Set<string>()
    for (const seg of day.segments) {
      const minutes = seg.endMin - seg.startMin
      if (isNightSleep(seg.sleep)) nightMin += minutes
      else {
        dayMin += minutes
        // Ein Schläfchen zählt am Tag seines Beginns.
        if (startOfLocalDay(new Date(seg.sleep.start)).getTime() === day.dayStart) {
          napIds.add(seg.sleep.id)
        }
      }
    }
    return {
      dayStart: day.dayStart,
      dayHours: dayMin / 60,
      nightHours: nightMin / 60,
      totalHours: (dayMin + nightMin) / 60,
      naps: napIds.size,
    }
  })
}

export interface CyclePoint {
  timestamp: number
  relax: number | null
  deep: number | null
  rem: number | null
}

/** Ein Punkt je Schlaf mit mindestens einer Zyklus-Messung, chronologisch. */
export function buildCycleSeries(sleeps: Sleep[]): CyclePoint[] {
  return [...sleeps]
    .filter((s) => s.relax_minutes > 0 || s.deep_minutes > 0 || s.rem_minutes > 0)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .map((s) => ({
      timestamp: new Date(s.start).getTime(),
      relax: s.relax_minutes > 0 ? s.relax_minutes : null,
      deep: s.deep_minutes > 0 ? s.deep_minutes : null,
      rem: s.rem_minutes > 0 ? s.rem_minutes : null,
    }))
}

function average(values: number[]): number | null {
  return values.length === 0 ? null : values.reduce((sum, v) => sum + v, 0) / values.length
}

export interface SleepKpis {
  lastEnd: string | null
  minutesSinceWake: number | null
  /** Beginn (00:00) des gestrigen Tages, auf den sich die Summen beziehen. */
  yesterdayStart: number
  totalHoursYesterday: number
  dayHoursYesterday: number
  nightHoursYesterday: number
  napsYesterday: number
  avgNapMinYesterday: number | null
  longestMinYesterday: number | null
  avgRelaxMin: number | null
  avgDeepMin: number | null
  avgRemMin: number | null
  wokeAfterRem: number
  nextCycleAfterRem: number
}

/** `sleeps` ist neueste zuerst; Zyklus-Durchschnitte beziehen sich auf alle übergebenen Einträge. */
export function computeSleepKpis(sleeps: Sleep[], allSleeps: Sleep[], now: Date): SleepKpis {
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
  const daily = buildSleepDaily(allSleeps).find((d) => d.dayStart === yesterday.getTime())
  const startedYesterday = allSleeps.filter(
    (s) => startOfLocalDay(new Date(s.start)).getTime() === yesterday.getTime(),
  )
  const naps = startedYesterday.filter((s) => !isNightSleep(s))
  const last = allSleeps[0]

  return {
    lastEnd: last?.end ?? null,
    minutesSinceWake: last ? Math.max(0, (now.getTime() - new Date(last.end).getTime()) / 60_000) : null,
    yesterdayStart: yesterday.getTime(),
    totalHoursYesterday: daily?.totalHours ?? 0,
    dayHoursYesterday: daily?.dayHours ?? 0,
    nightHoursYesterday: daily?.nightHours ?? 0,
    napsYesterday: naps.length,
    avgNapMinYesterday: average(naps.map(sleepMinutes)),
    longestMinYesterday:
      startedYesterday.length > 0 ? Math.max(...startedYesterday.map(sleepMinutes)) : null,
    avgRelaxMin: average(sleeps.filter((s) => s.relax_minutes > 0).map((s) => s.relax_minutes)),
    avgDeepMin: average(sleeps.filter((s) => s.deep_minutes > 0).map((s) => s.deep_minutes)),
    avgRemMin: average(sleeps.filter((s) => s.rem_minutes > 0).map((s) => s.rem_minutes)),
    wokeAfterRem: sleeps.filter((s) => s.after_rem === 'woke').length,
    nextCycleAfterRem: sleeps.filter((s) => s.after_rem === 'next_cycle').length,
  }
}
