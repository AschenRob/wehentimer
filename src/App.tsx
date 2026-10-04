import type { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { Toaster } from '@/components/ui/sonner'
import { SettingsDialog } from '@/components/SettingsDialog'
import { PasscodeGate } from '@/components/settings/PasscodeGate'
import { useBabies } from '@/hooks/useBabies'
import { useSettings } from '@/hooks/useSettings'
import { oneOf, usePersistentState } from '@/hooks/usePersistentState'
import { APP_LAYOUT_OPTIONS, APP_VIEW_META, APP_VIEW_OPTIONS, type AppLayout, type AppView } from '@/lib/appView'
import { cn } from '@/lib/utils'
import { hashPasscode } from '@/lib/passcode'
import { WehenView } from '@/views/WehenView'
import { StillView } from '@/views/StillView'

const DEFAULT_TARGET_INTERVAL_HOURS = 3

const isString = (value: unknown): value is string => typeof value === 'string'
const isNonNegativeNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0

function FullScreenMessage({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh items-center justify-center gap-2 px-4 text-sm text-muted-foreground">
      {children}
    </div>
  )
}

function App() {
  const { settings, isLoading: isSettingsLoading, updateSettings } = useSettings()
  const { babies, isLoading: isBabiesLoading, createBaby, renameBaby, deleteBaby } = useBabies()
  const [view, setView] = usePersistentState<AppView>('view', 'wehen', oneOf(APP_VIEW_OPTIONS))
  const [layout, setLayout] = usePersistentState<AppLayout>(
    'layout',
    'mobile',
    oneOf(APP_LAYOUT_OPTIONS),
  )
  const [babyId, setBabyId] = usePersistentState<string>('babyId', '', isString)
  const [targetIntervalHours, setTargetIntervalHours] = usePersistentState<number>(
    'still.targetIntervalHours',
    DEFAULT_TARGET_INTERVAL_HOURS,
    isNonNegativeNumber,
  )
  // Hash des Codes, mit dem dieses Gerät entsperrt wurde; ändert sich der Code, ist es wieder gesperrt.
  const [unlockedHash, setUnlockedHash] = usePersistentState<string>('unlockedHash', '', isString)
  const meta = APP_VIEW_META[view]
  const isDesktop = layout === 'desktop'

  if (isSettingsLoading || isBabiesLoading) {
    return (
      <FullScreenMessage>
        <Loader2 className="size-4 animate-spin" /> Wird geladen ...
      </FullScreenMessage>
    )
  }

  const expectedHash = settings.passcode_hash
  if (expectedHash && unlockedHash !== expectedHash) {
    return (
      <PasscodeGate expectedHash={expectedHash} onUnlock={() => setUnlockedHash(expectedHash)} />
    )
  }

  const activeBaby = babies.find((b) => b.id === babyId) ?? babies[0]
  if (!activeBaby) {
    return <FullScreenMessage>Kein Baby gefunden – bitte Seite neu laden.</FullScreenMessage>
  }

  async function handleChangePasscode(code: string) {
    const previous = unlockedHash
    const hash = hashPasscode(code)
    // Vorab entsperren, sonst sperrt das Realtime-Update dieses Gerät kurz selbst aus.
    setUnlockedHash(hash)
    try {
      await updateSettings({ passcode_hash: hash })
    } catch (err) {
      setUnlockedHash(previous)
      throw err
    }
  }

  async function handleCreateBaby(name: string) {
    const baby = await createBaby(name)
    setBabyId(baby.id)
  }

  return (
    <div
      className={cn(
        'mx-auto flex min-h-svh flex-col gap-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]',
        isDesktop ? 'max-w-none px-8' : 'max-w-2xl px-4',
      )}
    >
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold">{meta.title}</h1>
          <p className="text-xs text-muted-foreground">
            {babies.length > 1 ? `${activeBaby.name} · ` : ''}
            {meta.subtitle}
          </p>
        </div>
        <SettingsDialog
          view={view}
          onViewChange={setView}
          layout={layout}
          onLayoutChange={setLayout}
          settings={settings}
          onSave={updateSettings}
          targetIntervalHours={targetIntervalHours}
          onTargetIntervalHoursChange={setTargetIntervalHours}
          babies={babies}
          activeBabyId={activeBaby.id}
          onSelectBaby={setBabyId}
          onCreateBaby={handleCreateBaby}
          onRenameBaby={renameBaby}
          onDeleteBaby={deleteBaby}
          onChangePasscode={handleChangePasscode}
          onLock={() => setUnlockedHash('')}
        />
      </header>

      {view === 'wehen' ? (
        <WehenView key={activeBaby.id} babyId={activeBaby.id} settings={settings} />
      ) : (
        <StillView
          key={activeBaby.id}
          babyId={activeBaby.id}
          wide={isDesktop}
          targetIntervalHours={targetIntervalHours}
        />
      )}

      <Toaster position="top-center" />
    </div>
  )
}

export default App
