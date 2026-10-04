// Spiegelt die PocketBase-Collection "sleeps" (siehe pocketbase/pb_migrations).
export type AfterRem = 'woke' | 'next_cycle'
export type SleepMethod = 'nursing' | 'carried' | 'bed' | 'stroller' | 'car' | 'other'

export const AFTER_REM_LABELS: Record<AfterRem, string> = {
  woke: 'Aufgewacht',
  next_cycle: 'Nächster Zyklus',
}

export const SLEEP_METHOD_LABELS: Record<SleepMethod, string> = {
  nursing: 'Stillen',
  carried: 'Tragen',
  bed: 'Bett',
  stroller: 'Kinderwagen',
  car: 'Auto',
  other: 'Sonstiges',
}

export const SLEEP_METHOD_OPTIONS = Object.keys(SLEEP_METHOD_LABELS) as SleepMethod[]

export interface Sleep {
  id: string
  baby: string
  /** Augen zu. */
  start: string // ISO datetime
  /** Ende des Schlafs (Aufwachen). */
  end: string // ISO datetime
  /** Minuten bis das Baby völlig entspannt wirkt; 0 = keine Angabe. */
  relax_minutes: number
  /** Minuten bis zum Tiefschlaf (Armtest); 0 = keine Angabe. */
  deep_minutes: number
  /** Minuten bis zum Beginn der REM-Phase (erste Regung); 0 = keine Angabe. */
  rem_minutes: number
  after_rem: AfterRem | ''
  method: SleepMethod | ''
  note?: string
  is_manual: boolean
  created: string
  updated: string
}

export type SleepDraft = Omit<Sleep, 'id' | 'baby' | 'created' | 'updated'>

/** Schlaf, der in diesem Zeitfenster (lokale Stunde) beginnt, zählt als Nachtschlaf. */
export const NIGHT_START_HOUR = 19
export const NIGHT_END_HOUR = 6

export function isNightSleep(sleep: Pick<Sleep, 'start'>): boolean {
  const hour = new Date(sleep.start).getHours()
  return hour >= NIGHT_START_HOUR || hour < NIGHT_END_HOUR
}

export function sleepMinutes(sleep: Pick<Sleep, 'start' | 'end'>): number {
  return Math.max(0, (new Date(sleep.end).getTime() - new Date(sleep.start).getTime()) / 60_000)
}
