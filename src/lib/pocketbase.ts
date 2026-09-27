import PocketBase from 'pocketbase'

const pocketbaseUrl = import.meta.env.VITE_POCKETBASE_URL ?? 'http://127.0.0.1:8090'

export const pb = new PocketBase(pocketbaseUrl)

// Keine Auth-Collection, keine überlappenden Suchanfragen wie in einer
// Autocomplete-UI -> Auto-Cancellation bringt hier nur das Risiko von
// "autocancelled" bei parallelen Requests (z.B. Start/Stop kurz hintereinander).
pb.autoCancellation(false)

export const CONTRACTIONS_COLLECTION = 'contractions'
export const SETTINGS_COLLECTION = 'settings'
export const FEEDINGS_COLLECTION = 'feedings'
