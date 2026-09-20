// Spiegelt die PocketBase-Collection "contractions" (siehe pocketbase/pb_migrations).
export interface Contraction {
  id: string
  start: string // ISO datetime
  end: string // ISO datetime
  duration_sec: number
  intensity?: number // 1-5, optional
  note?: string
  is_manual: boolean
  created: string
  updated: string
}

export type ContractionDraft = Pick<Contraction, 'start' | 'end' | 'duration_sec' | 'is_manual'> &
  Partial<Pick<Contraction, 'intensity' | 'note'>>

export const INTENSITY_MIN = 1
export const INTENSITY_MAX = 5
