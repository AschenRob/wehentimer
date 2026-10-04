import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { APP_VIEW_META, APP_VIEW_OPTIONS, type AppView } from '@/lib/appView'

interface ModeMenuProps {
  view: AppView
  onViewChange: (view: AppView) => void
}

/** Burger-Menü zur Wahl des Modus (Wehen, Stillen, Sprünge und Schlaf); gilt pro Gerät. */
export function ModeMenu({ view, onViewChange }: ModeMenuProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Modus wählen">
            <Menu className="size-5" />
          </Button>
        }
      />
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Modus</DialogTitle>
          <DialogDescription>Die Auswahl gilt nur für dieses Gerät.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2" role="radiogroup" aria-label="Modus">
          {APP_VIEW_OPTIONS.map((option) => (
            <Button
              key={option}
              type="button"
              role="radio"
              aria-checked={view === option}
              variant={view === option ? 'default' : 'outline'}
              className="justify-start"
              onClick={() => {
                onViewChange(option)
                setOpen(false)
              }}
            >
              {APP_VIEW_META[option].title}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
