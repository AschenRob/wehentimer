import type { FocusEvent } from 'react'

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

// Markiert den kompletten Feldinhalt beim Fokussieren, damit Tippen die
// vorhandene "0" ersetzt statt "07" entstehen zu lassen.
export function selectAllOnFocus(e: FocusEvent<HTMLInputElement>) {
  e.target.select()
}

// Getrennte Date-/Time-Inputs statt eines kombinierten datetime-local-Felds:
// Handys zeigen dafür ihre nativen (schnelleren) Kalender-/Uhr-Räder statt
// eines oft klobigen kombinierten Pickers.
export function toDateValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function toTimeValue(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function parseDateAndTime(dateStr: string, timeStr: string): Date | null {
  if (!dateStr || !timeStr) return null
  const [year, month, day] = dateStr.split('-').map(Number)
  const [hours, minutes] = timeStr.split(':').map(Number)
  if ([year, month, day, hours, minutes].some((n) => Number.isNaN(n))) return null
  const date = new Date(year, month - 1, day, hours, minutes, 0)
  return Number.isNaN(date.getTime()) ? null : date
}
