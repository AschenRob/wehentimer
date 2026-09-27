import { Toaster } from '@/components/ui/sonner'
import { SettingsDialog } from '@/components/SettingsDialog'
import { useSettings } from '@/hooks/useSettings'
import { oneOf, usePersistentState } from '@/hooks/usePersistentState'
import { APP_VIEW_META, APP_VIEW_OPTIONS, type AppView } from '@/lib/appView'
import { WehenView } from '@/views/WehenView'
import { StillView } from '@/views/StillView'

function App() {
  const { settings, updateThresholds } = useSettings()
  const [view, setView] = usePersistentState<AppView>('view', 'wehen', oneOf(APP_VIEW_OPTIONS))
  const meta = APP_VIEW_META[view]

  return (
    <div
      className="mx-auto flex min-h-svh max-w-2xl flex-col gap-4 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold">{meta.title}</h1>
          <p className="text-xs text-muted-foreground">{meta.subtitle}</p>
        </div>
        <SettingsDialog
          view={view}
          onViewChange={setView}
          settings={settings}
          onSave={updateThresholds}
        />
      </header>

      {view === 'wehen' ? <WehenView settings={settings} /> : <StillView />}

      <Toaster position="top-center" />
    </div>
  )
}

export default App
