import { useEffect, useState } from 'react'
import { Delete, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { hashPasscode, PASSCODE_LENGTH } from '@/lib/passcode'

interface PasscodeGateProps {
  expectedHash: string
  onUnlock: () => void
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

/** Sperrbildschirm: vierstelliger Code per Tastatur oder Bildschirm-Ziffernblock. */
export function PasscodeGate({ expectedHash, onUnlock }: PasscodeGateProps) {
  const [code, setCode] = useState('')
  const [hasError, setHasError] = useState(false)

  function press(digit: string) {
    if (code.length >= PASSCODE_LENGTH) return
    const next = code + digit
    if (next.length < PASSCODE_LENGTH) {
      setCode(next)
      setHasError(false)
    } else if (hashPasscode(next) === expectedHash) {
      onUnlock()
    } else {
      setCode('')
      setHasError(true)
    }
  }

  function backspace() {
    setCode((prev) => prev.slice(0, -1))
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (/^\d$/.test(e.key)) press(e.key)
      else if (e.key === 'Backspace') backspace()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  })

  return (
    <div className="mx-auto flex min-h-svh max-w-xs flex-col items-center justify-center gap-6 px-4">
      <Lock className="size-8 text-primary" />
      <div className="text-center">
        <h1 className="font-heading text-xl font-semibold">Passcode eingeben</h1>
        <p className={cn('text-sm', hasError ? 'text-destructive' : 'text-muted-foreground')}>
          {hasError ? 'Falscher Code, bitte erneut versuchen.' : 'Die App ist gesperrt.'}
        </p>
      </div>
      <div className="flex gap-3" aria-label={`${code.length} von ${PASSCODE_LENGTH} Ziffern`}>
        {Array.from({ length: PASSCODE_LENGTH }, (_, i) => (
          <span
            key={i}
            className={cn(
              'size-4 rounded-full border-2 border-primary',
              i < code.length && 'bg-primary',
            )}
          />
        ))}
      </div>
      <div className="grid w-full grid-cols-3 gap-3">
        {KEYS.map((digit) => (
          <Button
            key={digit}
            type="button"
            variant="outline"
            className="h-14 text-xl"
            onClick={() => press(digit)}
          >
            {digit}
          </Button>
        ))}
        <span />
        <Button type="button" variant="outline" className="h-14 text-xl" onClick={() => press('0')}>
          0
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-14"
          aria-label="Letzte Ziffer löschen"
          onClick={backspace}
        >
          <Delete className="size-5" />
        </Button>
      </div>
    </div>
  )
}
