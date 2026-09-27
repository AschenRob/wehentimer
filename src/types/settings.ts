// Spiegelt die PocketBase-Collection "settings" (genau ein Datensatz, siehe
// pocketbase/pb_migrations). Geräteübergreifend gültige 5-1-1-Schwellenwerte.
export interface WehenSettings {
  id: string
  interval_minutes: number
  duration_minutes: number
  sustained_minutes: number
  /** Anzahl Ausreißer-Wehen, die eine Serie nicht abbrechen. */
  tolerance_count: number
  updated: string
}

export const DEFAULT_THRESHOLDS = {
  interval_minutes: 5,
  duration_minutes: 1,
  sustained_minutes: 60,
  tolerance_count: 1,
} satisfies Pick<
  WehenSettings,
  'interval_minutes' | 'duration_minutes' | 'sustained_minutes' | 'tolerance_count'
>

export type ThresholdPatch = Partial<typeof DEFAULT_THRESHOLDS>
