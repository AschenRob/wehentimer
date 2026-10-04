// Spiegelt die PocketBase-Collection "feedings" (siehe pocketbase/pb_migrations).
export type BreastSide = 'left' | 'right'
export type BreastSecond = BreastSide | 'none'

export const BREAST_LABELS: Record<BreastSecond, string> = {
  left: 'links',
  right: 'rechts',
  none: 'keine',
}

export interface Feeding {
  id: string
  baby: string
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
  /** 1. Brust; leer bei Einträgen ohne Angabe. */
  breast_first: BreastSecond | ''
  /** 2. Brust; leer bei Einträgen ohne Angabe. */
  breast_second: BreastSecond | ''
  created: string
  updated: string
}

export type FeedingDraft = Omit<Feeding, 'id' | 'baby' | 'created' | 'updated'>

/** Zuletzt genutzte Brust: die 2. Brust, falls gewählt, sonst die 1. */
export function lastBreast(feeding: Feeding): BreastSide | null {
  if (feeding.breast_second === 'left' || feeding.breast_second === 'right') {
    return feeding.breast_second
  }
  return feeding.breast_first === 'left' || feeding.breast_first === 'right'
    ? feeding.breast_first
    : null
}

export type BreastUsage = 'left' | 'right' | 'both'

/** Genutzte Seite(n) aus 1. und 2. Brust zusammengefasst; null = keine Angabe/keine Brust. */
export function breastUsage(feeding: Feeding): BreastUsage | null {
  const left = feeding.breast_first === 'left' || feeding.breast_second === 'left'
  const right = feeding.breast_first === 'right' || feeding.breast_second === 'right'
  if (left && right) return 'both'
  if (left) return 'left'
  if (right) return 'right'
  return null
}

export const FEEDING_DEFAULTS = {
  woke_self: true,
  urine: false,
  stool: false,
  supplement_mm_ml: 0,
  supplement_em_ml: 0,
  breast_first: 'left',
  breast_second: 'none',
} satisfies Partial<FeedingDraft>
/** Vorbelegung für den allerersten Eintrag. */
export const DEFAULT_FIRST_WEIGHT_G = 3500

/** Gewicht des jüngsten Eintrags mit erfasstem Gewicht (Liste ist neueste zuerst). */
export function latestWeight(feedings: Feeding[]): number {
  return feedings.find((f) => f.weight_g > 0)?.weight_g ?? DEFAULT_FIRST_WEIGHT_G
}
