/** Feste Farbskala für die Wehenstärke 1–5 (grün → gelb → rot), ohne Stärke grau. */
export const INTENSITY_COLORS: Record<number, string> = {
  1: '#4f9d4a',
  2: '#9bbb3f',
  3: '#e5c02e',
  4: '#e8892b',
  5: '#cf3f35',
}

export const NO_INTENSITY_COLOR = '#a8a49a'

export function intensityColor(intensity: number | undefined): string {
  return (intensity && INTENSITY_COLORS[intensity]) || NO_INTENSITY_COLOR
}
