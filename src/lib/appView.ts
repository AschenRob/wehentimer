import type { Baby } from '@/types/baby'
import { ourLittle } from '@/types/baby'

export type AppView = 'wehen' | 'still' | 'sleep'

export const APP_VIEW_OPTIONS = ['wehen', 'still', 'sleep'] as const satisfies AppView[]

/** Darstellung pro Gerät: Smartphone (schmal) oder Desktop/TV (volle Breite, Charts zweispaltig). */
export type AppLayout = 'mobile' | 'desktop'

export const APP_LAYOUT_OPTIONS = ['mobile', 'desktop'] as const satisfies AppLayout[]

export const APP_LAYOUT_LABELS: Record<AppLayout, string> = {
  mobile: 'Smartphone',
  desktop: 'Desktop / TV',
}

export const APP_VIEW_META: Record<
  AppView,
  { title: string; subtitle: (baby: Pick<Baby, 'name' | 'gender'>) => string }
> = {
  wehen: {
    title: 'Wehentimer',
    subtitle: (baby) => `auf dem Weg zur Geburt ${ourLittle(baby)}`,
  },
  still: {
    title: 'Stilltracker',
    subtitle: (baby) => `die Mahlzeiten ${ourLittle(baby)}`,
  },
  sleep: {
    title: 'Sprünge und Schlaf',
    subtitle: (baby) => `Entwicklung und Schlaf ${ourLittle(baby)}`,
  },
}
