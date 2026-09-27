export type AppView = 'wehen' | 'still'

export const APP_VIEW_OPTIONS = ['wehen', 'still'] as const satisfies AppView[]

export const APP_VIEW_META: Record<AppView, { title: string; subtitle: string }> = {
  wehen: {
    title: 'Wehentimer',
    subtitle: 'auf dem Weg zur Geburt unseres kleinen Krümelchens',
  },
  still: {
    title: 'Stilltracker',
    subtitle: 'die Mahlzeiten unseres kleinen Krümelchens',
  },
}
