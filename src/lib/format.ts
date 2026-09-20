// Zentrale Formatierung für Zeiten/Dauern (deutsches Format), analog zum
// Grundsatz aus otherApp: sichtbare Werte laufen über eine gemeinsame Stelle
// statt verstreutem toFixed()/toLocaleString().

const timeFormatter = new Intl.DateTimeFormat('de-DE', {
  hour: '2-digit',
  minute: '2-digit',
})

const dateTimeFormatter = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const decimalFormatter = new Intl.NumberFormat('de-DE', {
  maximumFractionDigits: 1,
})

export function formatTime(date: Date | string): string {
  return timeFormatter.format(new Date(date))
}

export function formatDateTime(date: Date | string): string {
  return dateTimeFormatter.format(new Date(date))
}

/** Sekunden -> "MM:SS" bzw. "H:MM:SS" bei >= 1 Std. */
export function formatDurationClock(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  const pad = (n: number) => n.toString().padStart(2, '0')
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(secs)}` : `${pad(minutes)}:${pad(secs)}`
}

/** Minuten (Dezimalwert) -> deutsch formatiert, z.B. "4,5 Min". */
export function formatMinutes(totalMinutes: number): string {
  return `${decimalFormatter.format(totalMinutes)} Min`
}

/** Relative Zeitangabe für Listen, z.B. "vor 5 Min". */
export function formatRelative(date: Date | string, now: Date = new Date()): string {
  const diffMs = now.getTime() - new Date(date).getTime()
  const diffMin = Math.round(diffMs / 60000)
  if (diffMin < 1) return 'gerade eben'
  if (diffMin < 60) return `vor ${diffMin} Min`
  const hours = Math.floor(diffMin / 60)
  const minutes = diffMin % 60
  return minutes > 0 ? `vor ${hours} Std ${minutes} Min` : `vor ${hours} Std`
}
