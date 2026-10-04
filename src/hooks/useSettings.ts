import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { pb, SETTINGS_COLLECTION } from '@/lib/pocketbase'
import { DEFAULT_THRESHOLDS, type SettingsPatch, type WehenSettings } from '@/types/settings'

const FALLBACK: WehenSettings = { id: '', updated: '', passcode_hash: '', ...DEFAULT_THRESHOLDS }

/** Lädt den Einstellungs-Singleton (Schwellenwerte, Passcode), hält ihn geräteübergreifend synchron. */
export function useSettings() {
  const [settings, setSettings] = useState<WehenSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const idRef = useRef<string | null>(null)

  useEffect(() => {
    let isCancelled = false

    async function load() {
      try {
        const record = await pb
          .collection(SETTINGS_COLLECTION)
          .getFirstListItem<WehenSettings>('', { requestKey: null })
        if (!isCancelled) {
          setSettings(record)
          idRef.current = record.id
        }
      } catch (err) {
        console.error('Einstellungen konnten nicht geladen werden', err)
      } finally {
        if (!isCancelled) setIsLoading(false)
      }
    }
    load()

    let unsubscribe: (() => void) | undefined
    pb.collection(SETTINGS_COLLECTION)
      .subscribe<WehenSettings>('*', (e) => {
        if (e.action !== 'update') return
        if (idRef.current && e.record.id !== idRef.current) return
        idRef.current = e.record.id
        setSettings(e.record)
      })
      .then((unsub) => {
        if (isCancelled) unsub()
        else unsubscribe = unsub
      })

    return () => {
      isCancelled = true
      unsubscribe?.()
    }
  }, [])

  const updateSettings = useCallback(async (patch: SettingsPatch) => {
    if (!idRef.current) return
    try {
      const record = await pb
        .collection(SETTINGS_COLLECTION)
        .update<WehenSettings>(idRef.current, patch, { requestKey: null })
      setSettings(record)
    } catch (err) {
      console.error('Einstellungen konnten nicht gespeichert werden', err)
      toast.error('Einstellungen konnten nicht gespeichert werden.')
      throw err
    }
  }, [])

  return {
    // Vor dem Einspielen der Migrationen fehlen neuere Felder noch.
    settings: settings
      ? {
          ...settings,
          tolerance_count: settings.tolerance_count ?? DEFAULT_THRESHOLDS.tolerance_count,
          passcode_hash: settings.passcode_hash ?? '',
        }
      : FALLBACK,
    /** true, sobald die Einstellungen vom Server geladen wurden. */
    isLoaded: settings !== null,
    isLoading,
    updateSettings,
  }
}
