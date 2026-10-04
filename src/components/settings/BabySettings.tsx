import { useState, type FormEvent } from 'react'
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toDateValue } from '@/lib/dateInput'
import { formatDate } from '@/lib/format'
import {
  BABY_GENDER_LABELS,
  parseBabyDate,
  type Baby,
  type BabyGender,
  type BabyInput,
} from '@/types/baby'

interface BabySettingsProps {
  babies: Baby[]
  activeBabyId: string
  onSelect: (id: string) => void
  onCreate: (input: BabyInput) => Promise<unknown>
  onUpdate: (id: string, input: BabyInput) => Promise<unknown>
  onDelete: (id: string) => Promise<unknown>
}

const EMPTY_INPUT: BabyInput = { name: '', due_date: '', gender: '' }

function babyDetails(baby: Baby): string {
  const due = parseBabyDate(baby.due_date)
  return [
    due ? `ET ${formatDate(due)}` : 'ET nicht gesetzt',
    baby.gender ? BABY_GENDER_LABELS[baby.gender] : 'Geschlecht nicht gesetzt',
  ].join(' · ')
}

function toInput(baby: Baby): BabyInput {
  const due = parseBabyDate(baby.due_date)
  return { name: baby.name, due_date: due ? toDateValue(due) : '', gender: baby.gender }
}

interface BabyFieldsProps {
  idPrefix: string
  value: BabyInput
  onChange: (value: BabyInput) => void
}

function BabyFields({ idPrefix, value, onChange }: BabyFieldsProps) {
  return (
    <div className="grid gap-2">
      <Input
        value={value.name}
        maxLength={60}
        placeholder="Name"
        aria-label="Name"
        onChange={(e) => onChange({ ...value, name: e.target.value })}
      />
      <div className="grid gap-1">
        <Label htmlFor={`${idPrefix}-due`} className="text-xs text-muted-foreground">
          Errechneter Termin (ET)
        </Label>
        <Input
          id={`${idPrefix}-due`}
          type="date"
          value={value.due_date}
          onChange={(e) => onChange({ ...value, due_date: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Geschlecht">
        {(Object.keys(BABY_GENDER_LABELS) as BabyGender[]).map((gender) => (
          <Button
            key={gender}
            type="button"
            role="radio"
            size="sm"
            aria-checked={value.gender === gender}
            variant={value.gender === gender ? 'default' : 'outline'}
            onClick={() => onChange({ ...value, gender: value.gender === gender ? '' : gender })}
          >
            {BABY_GENDER_LABELS[gender]}
          </Button>
        ))}
      </div>
    </div>
  )
}

export function BabySettings({
  babies,
  activeBabyId,
  onSelect,
  onCreate,
  onUpdate,
  onDelete,
}: BabySettingsProps) {
  const [newBaby, setNewBaby] = useState<BabyInput>(EMPTY_INPUT)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editBaby, setEditBaby] = useState<BabyInput>(EMPTY_INPUT)
  const [isBusy, setIsBusy] = useState(false)

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    const name = newBaby.name.trim()
    if (!name) return
    setIsBusy(true)
    try {
      await onCreate({ ...newBaby, name })
      setNewBaby(EMPTY_INPUT)
    } catch {
      // Fehler-Toast übernimmt bereits der Hook.
    } finally {
      setIsBusy(false)
    }
  }

  async function handleUpdate(e: FormEvent) {
    e.preventDefault()
    const name = editBaby.name.trim()
    if (!editingId || !name) return
    setIsBusy(true)
    try {
      await onUpdate(editingId, { ...editBaby, name })
      setEditingId(null)
    } catch {
      // Fehler-Toast übernimmt bereits der Hook.
    } finally {
      setIsBusy(false)
    }
  }

  async function handleDelete(id: string) {
    setIsBusy(true)
    try {
      await onDelete(id)
    } catch {
      // Fehler-Toast übernimmt bereits der Hook.
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <div className="grid gap-3">
      <div>
        <h3 className="font-heading text-sm font-medium">Babys</h3>
        <p className="text-sm text-muted-foreground">
          Babys und ihre Einträge gelten auf allen Geräten. Welches Baby angezeigt wird, gilt nur
          für dieses Gerät.
        </p>
      </div>

      <ul className="grid gap-1.5" role="radiogroup" aria-label="Aktives Baby">
        {babies.map((baby) => (
          <li key={baby.id} className="flex items-center gap-1.5">
            {editingId === baby.id ? (
              <form onSubmit={handleUpdate} className="grid flex-1 gap-2 rounded-lg border p-2">
                <BabyFields idPrefix={`edit-${baby.id}`} value={editBaby} onChange={setEditBaby} />
                <div className="flex justify-end gap-1.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => setEditingId(null)}
                  >
                    <X className="size-4" /> Abbrechen
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="gap-1.5"
                    disabled={isBusy || !editBaby.name.trim()}
                  >
                    <Check className="size-4" /> Speichern
                  </Button>
                </div>
              </form>
            ) : (
              <>
                <Button
                  type="button"
                  role="radio"
                  aria-checked={baby.id === activeBabyId}
                  variant={baby.id === activeBabyId ? 'default' : 'outline'}
                  className="h-auto flex-1 flex-col items-start gap-0 py-1.5 text-left"
                  onClick={() => onSelect(baby.id)}
                >
                  <span>{baby.name}</span>
                  <span className="text-xs font-normal opacity-80">{babyDetails(baby)}</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`${baby.name} bearbeiten`}
                  onClick={() => {
                    setEditingId(baby.id)
                    setEditBaby(toInput(baby))
                  }}
                >
                  <Pencil className="size-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={babies.length <= 1 || isBusy}
                        aria-label={`${baby.name} löschen`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    }
                  />
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{baby.name} löschen?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Alle Wehen, Mahlzeiten und Schlaf-Einträge von {baby.name} werden endgültig
                        gelöscht – auf allen Geräten.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                      <AlertDialogAction
                        variant="destructive"
                        onClick={() => handleDelete(baby.id)}
                      >
                        Löschen
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </li>
        ))}
      </ul>

      <form onSubmit={handleCreate} className="grid gap-2">
        <Label>Neues Baby anlegen</Label>
        <BabyFields idPrefix="new" value={newBaby} onChange={setNewBaby} />
        <Button type="submit" disabled={isBusy || !newBaby.name.trim()} className="gap-1.5">
          <Plus className="size-4" /> Anlegen
        </Button>
      </form>
    </div>
  )
}
