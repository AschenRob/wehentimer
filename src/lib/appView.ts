export type AppView = 'wehen' | 'still'

export const APP_VIEW_OPTIONS = ['wehen', 'still'] as const satisfies AppView[]

/** Darstellung pro Gerät: Smartphone (schmal) oder Desktop/TV (volle Breite, Charts zweispaltig). */
export type AppLayout = 'mobile' | 'desktop'

export const APP_LAYOUT_OPTIONS = ['mobile', 'desktop'] as const satisfies AppLayout[]

export const APP_LAYOUT_LABELS: Record<AppLayout, string> = {
  mobile: 'Smartphone',
  desktop: 'Desktop / TV',
}

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
