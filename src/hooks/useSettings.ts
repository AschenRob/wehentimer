import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { pb, SETTINGS_COLLECTION } from '@/lib/pocketbase'
import { DEFAULT_THRESHOLDS, type WehenSettings } from '@/types/settings'

type ThresholdPatch = Partial<
  Pick<WehenSettings, 'interval_minutes' | 'duration_minutes' | 'sustained_minutes'>
>

const FALLBACK: WehenSettings = { id: '', updated: '', ...DEFAULT_THRESHOLDS }

/** Lädt den 5-1-1-Schwellenwert-Singleton, hält ihn geräteübergreifend synchron. */
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

  const updateThresholds = useCallback(async (patch: ThresholdPatch) => {
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

  return { settings: settings ?? FALLBACK, isLoading, updateThresholds }
}
