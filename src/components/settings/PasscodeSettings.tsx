import { useState, type FormEvent } from 'react'
import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { isValidPasscode, PASSCODE_LENGTH } from '@/lib/passcode'
import { toast } from 'sonner'

interface PasscodeSettingsProps {
  onChange: (code: string) => Promise<unknown>
  onLock: () => void
}

export function PasscodeSettings({ onChange, onLock }: PasscodeSettingsProps) {
  const [code, setCode] = useState('')
  const [repeat, setRepeat] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const digitsOnly = (value: string) => value.replace(/\D/g, '').slice(0, PASSCODE_LENGTH)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isValidPasscode(code)) {
      setError(`Der Code muss aus genau ${PASSCODE_LENGTH} Ziffern bestehen.`)
      return
    }
    if (code !== repeat) {
      setError('Die beiden Eingaben stimmen nicht überein.')
      return
    }
    setError(null)
    setIsSaving(true)
    try {
      await onChange(code)
      setCode('')
      setRepeat('')
      toast.success('Passcode geändert.')
    } catch {
      // Fehler-Toast übernimmt bereits der Hook.
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3">
      <div>
        <h3 className="font-heading text-sm font-medium">Passcode</h3>
        <p className="text-sm text-muted-foreground">
          Gilt für alle Geräte. Dieses Gerät bleibt entsperrt, bis du hier auf „Jetzt sperren“
          drückst. Auf anderen Geräten ist nach einer Änderung der neue Code nötig.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="grid gap-2">
          <Label htmlFor="passcode-new">Neuer Code</Label>
          <Input
            id="passcode-new"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={PASSCODE_LENGTH}
            value={code}
            onChange={(e) => setCode(digitsOnly(e.target.value))}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="passcode-repeat">Wiederholen</Label>
          <Input
            id="passcode-repeat"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={PASSCODE_LENGTH}
            value={repeat}
            onChange={(e) => setRepeat(digitsOnly(e.target.value))}
          />
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={isSaving}>
          Passcode ändern
        </Button>
        <Button type="button" variant="outline" className="gap-1.5" onClick={onLock}>
          <Lock className="size-4" /> Jetzt sperren
        </Button>
      </div>
    </form>
  )
}
