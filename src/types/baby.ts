// Spiegelt die PocketBase-Collection "babies" (siehe pocketbase/pb_migrations).
export type BabyGender = 'female' | 'male'

export const BABY_GENDER_LABELS: Record<BabyGender, string> = {
  female: 'Mädchen',
  male: 'Junge',
}

export interface Baby {
  id: string
  name: string
  /** Errechneter Termin als PocketBase-Datum ("2026-09-27 00:00:00.000Z"); leer = nicht gesetzt. */
  due_date: string
  /** Wird nur per Migration gesetzt (keine UI). */
  birth_date: string
  gender: BabyGender | ''
  created: string
  updated: string
}

export interface BabyInput {
  name: string
  /** "YYYY-MM-DD" oder leer. */
  due_date: string
  gender: BabyGender | ''
}

/** Datumsteil eines PocketBase-Datums als lokales Datum (Mitternacht), sonst null. */
export function parseBabyDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (!match) return null
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
}

/** "unserer kleinen Stella" (weiblich) bzw. "unseres kleinen Max". */
export function ourLittle(baby: Pick<Baby, 'name' | 'gender'>): string {
  return baby.gender === 'female' ? `unserer kleinen ${baby.name}` : `unseres kleinen ${baby.name}`
}
