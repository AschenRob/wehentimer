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
import type { Baby } from '@/types/baby'

interface BabySettingsProps {
  babies: Baby[]
  activeBabyId: string
  onSelect: (id: string) => void
  onCreate: (name: string) => Promise<unknown>
  onRename: (id: string, name: string) => Promise<unknown>
  onDelete: (id: string) => Promise<unknown>
}

export function BabySettings({
  babies,
  activeBabyId,
  onSelect,
  onCreate,
  onRename,
  onDelete,
}: BabySettingsProps) {
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [isBusy, setIsBusy] = useState(false)

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    setIsBusy(true)
    try {
      await onCreate(name)
      setNewName('')
    } catch {
      // Fehler-Toast übernimmt bereits der Hook.
    } finally {
      setIsBusy(false)
    }
  }

  async function handleRename(e: FormEvent) {
    e.preventDefault()
    const name = editName.trim()
    if (!editingId || !name) return
    setIsBusy(true)
    try {
      await onRename(editingId, name)
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
          Alle Einträge und Auswertungen gelten für das ausgewählte Baby (nur auf diesem Gerät).
        </p>
      </div>

      <ul className="grid gap-1.5" role="radiogroup" aria-label="Aktives Baby">
        {babies.map((baby) => (
          <li key={baby.id} className="flex items-center gap-1.5">
            {editingId === baby.id ? (
              <form onSubmit={handleRename} className="flex flex-1 items-center gap-1.5">
                <Input
                  value={editName}
                  maxLength={60}
                  autoFocus
                  aria-label="Neuer Name"
                  onChange={(e) => setEditName(e.target.value)}
                />
                <Button type="submit" size="icon" disabled={isBusy} aria-label="Name speichern">
                  <Check className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Abbrechen"
                  onClick={() => setEditingId(null)}
                >
                  <X className="size-4" />
                </Button>
              </form>
            ) : (
              <>
                <Button
                  type="button"
                  role="radio"
                  aria-checked={baby.id === activeBabyId}
                  variant={baby.id === activeBabyId ? 'default' : 'outline'}
                  className="flex-1 justify-start"
                  onClick={() => onSelect(baby.id)}
                >
                  {baby.name}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`${baby.name} umbenennen`}
                  onClick={() => {
                    setEditingId(baby.id)
                    setEditName(baby.name)
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
                        Alle Wehen und Mahlzeiten von {baby.name} werden endgültig gelöscht.
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
        <Label htmlFor="new-baby-name">Neues Baby anlegen</Label>
        <div className="flex gap-1.5">
          <Input
            id="new-baby-name"
            value={newName}
            maxLength={60}
            placeholder="Name"
            onChange={(e) => setNewName(e.target.value)}
          />
          <Button type="submit" disabled={isBusy || !newName.trim()} className="gap-1.5">
            <Plus className="size-4" /> Anlegen
          </Button>
        </div>
      </form>
    </div>
  )
}
