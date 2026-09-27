// Spiegelt die PocketBase-Collection "feedings" (siehe pocketbase/pb_migrations).
export interface Feeding {
  id: string
  start: string // ISO datetime
  /** Ende der Mahlzeit (Timer-Stop oder manuell). */
  end: string // ISO datetime
  /** "angelegt Minuten" laut Still-Protokoll. */
  latch_minutes: number
  woke_self: boolean
  /** Zugefüttert Muttermilch (ml). */
  supplement_mm_ml: number
  /** Zugefüttert Ersatzmilch (ml). */
  supplement_em_ml: number
  urine: boolean
  stool: boolean
  /** Gewicht in Gramm, 0 = nicht erfasst. */
  weight_g: number
  note?: string
  is_manual: boolean
  created: string
  updated: string
}

export type FeedingDraft = Omit<Feeding, 'id' | 'created' | 'updated'>

export const FEEDING_DEFAULTS = {
  woke_self: true,
  urine: false,
  stool: false,
} satisfies Partial<FeedingDraft>

export type SupplementType = 'mm' | 'em'

export const SUPPLEMENT_TYPE_LABELS: Record<SupplementType, string> = {
  mm: 'Muttermilch',
  em: 'Ersatzmilch',
}

export const DEFAULT_SUPPLEMENT_TYPE: SupplementType = 'mm'
export const DEFAULT_SUPPLEMENT_ML = 100
/** Vorbelegung für den allerersten Eintrag. */
export const DEFAULT_FIRST_WEIGHT_G = 3500

/** Gewicht des jüngsten Eintrags mit erfasstem Gewicht (Liste ist neueste zuerst). */
export function latestWeight(feedings: Feeding[]): number {
  return feedings.find((f) => f.weight_g > 0)?.weight_g ?? DEFAULT_FIRST_WEIGHT_G
}
